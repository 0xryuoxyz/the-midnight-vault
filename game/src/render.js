// Everything the player sees: the museum floor, walls, vision cones, guards, cameras,
// loot, the thief, the HUD and the title / pause / win / busted screens. The canvas is
// scaled to fit the window while the logical 1280x720 field stays fixed.

import { ALARM, CAMERA, FIELD, FONT, GUARD, LEVELS, PALETTE, PLAYER } from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_WIN = 'win';
export const SCREEN_BUSTED = 'busted';

const LOOT_LABEL = {
  diamond: 'DIAMOND',
  gold: 'GOLD BARS',
  painting: 'PAINTING',
  crown: 'CROWN',
  safe: 'SAFE',
  ruby: 'RUBY',
};

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');

  function fit() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    const scale = Math.min(canvas.width / FIELD.width, canvas.height / FIELD.height);
    const ox = (canvas.width - FIELD.width * scale) / 2;
    const oy = (canvas.height - FIELD.height * scale) / 2;
    return { dpr, scale, ox, oy };
  }

  function toLogical(clientX, clientY) {
    const view = fit();
    return {
      x: (clientX * view.dpr - view.ox) / view.scale,
      y: (clientY * view.dpr - view.oy) / view.scale,
    };
  }

  function drawCone(x, y, facing, range, halfAngle, alert) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.arc(x, y, range, facing - halfAngle, facing + halfAngle);
    ctx.closePath();
    ctx.fillStyle = alert ? PALETTE.coneAlert : PALETTE.coneCalm;
    ctx.fill();
  }

  function drawFloor() {
    ctx.fillStyle = PALETTE.floorA;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    const tile = 80;
    for (let ty = 0; ty < FIELD.height / tile; ty += 1) {
      for (let tx = 0; tx < FIELD.width / tile; tx += 1) {
        if ((tx + ty) % 2 === 0) {
          ctx.fillStyle = PALETTE.floorB;
          ctx.fillRect(tx * tile, ty * tile, tile, tile);
        }
      }
    }
    ctx.strokeStyle = PALETTE.floorLine;
    ctx.lineWidth = 1;
    for (let x = 0; x <= FIELD.width; x += tile) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, FIELD.height); ctx.stroke();
    }
    for (let y = 0; y <= FIELD.height; y += tile) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(FIELD.width, y); ctx.stroke();
    }
  }

  function drawWalls(walls) {
    for (const wall of walls) {
      ctx.fillStyle = PALETTE.wallEdge;
      ctx.fillRect(wall.x - 2, wall.y - 2, wall.w + 4, wall.h + 4);
      ctx.fillStyle = PALETTE.wall;
      ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
      ctx.fillStyle = PALETTE.wallTop;
      ctx.fillRect(wall.x, wall.y, wall.w, 4);
    }
  }

  function drawExit(exit, open) {
    const pulse = open ? 0.55 + 0.25 * Math.sin(Date.now() / 300) : 0.3;
    ctx.fillStyle = open ? `rgba(39, 174, 96, ${pulse})` : PALETTE.exitGlow;
    ctx.fillRect(exit.x - 10, exit.y - 10, exit.w + 20, exit.h + 20);
    ctx.fillStyle = open ? PALETTE.exit : '#1e7a44';
    ctx.fillRect(exit.x, exit.y, exit.w, exit.h);
    ctx.fillStyle = '#0a0a12';
    ctx.font = `bold 13px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('EXIT', exit.x + exit.w / 2, exit.y + exit.h / 2 - 8);
    ctx.font = `bold 18px ${FONT}`;
    ctx.fillText(open ? 'OPEN' : 'LOCKED', exit.x + exit.w / 2, exit.y + exit.h / 2 + 12);
  }

  function drawLoot(item) {
    if (item.taken) return;
    const glow = 0.5 + 0.3 * Math.sin(item.sparkle);
    ctx.save();
    ctx.translate(item.x, item.y);
    ctx.beginPath();
    ctx.arc(0, 0, 26 + 4 * glow, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(242, 201, 76, ${0.12 + 0.12 * glow})`;
    ctx.fill();
    ctx.fillStyle = PALETTE.gold;
    ctx.strokeStyle = '#8a6d1f';
    ctx.lineWidth = 2;
    if (item.kind === 'diamond' || item.kind === 'ruby') {
      ctx.fillStyle = item.kind === 'ruby' ? '#e74c3c' : '#7fd4ff';
      ctx.beginPath();
      ctx.moveTo(0, -14); ctx.lineTo(12, 0); ctx.lineTo(0, 14); ctx.lineTo(-12, 0);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-12, 0); ctx.lineTo(0, -14); ctx.lineTo(12, 0); ctx.lineTo(0, 6); ctx.lineTo(-12, 0);
      ctx.closePath(); ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fill();
    } else if (item.kind === 'gold') {
      for (let i = -1; i <= 1; i += 1) {
        ctx.fillRect(i * 11 - 5, 4, 10, 8);
        ctx.strokeRect(i * 11 - 5, 4, 10, 8);
      }
      ctx.fillRect(-5, -6, 10, 8);
      ctx.strokeRect(-5, -6, 10, 8);
    } else if (item.kind === 'painting') {
      ctx.fillStyle = '#8e44ad';
      ctx.fillRect(-14, -11, 28, 22);
      ctx.strokeRect(-14, -11, 28, 22);
      ctx.fillStyle = '#f2c94c';
      ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.fill();
    } else if (item.kind === 'crown') {
      ctx.beginPath();
      ctx.moveTo(-13, 8); ctx.lineTo(-13, -6); ctx.lineTo(-6, 2); ctx.lineTo(0, -10);
      ctx.lineTo(6, 2); ctx.lineTo(13, -6); ctx.lineTo(13, 8); ctx.closePath();
      ctx.fill(); ctx.stroke();
    } else {
      ctx.fillStyle = '#5d6d7e';
      ctx.fillRect(-13, -10, 26, 20);
      ctx.strokeRect(-13, -10, 26, 20);
      ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2);
      ctx.fillStyle = PALETTE.gold; ctx.fill(); ctx.stroke();
    }
    ctx.restore();
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `10px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText(LOOT_LABEL[item.kind], item.x, item.y + 38);
  }

  function drawGuard(guard) {
    drawCone(guard.x, guard.y, guard.dir, GUARD.visionRange, GUARD.visionHalfAngle, guard.seesPlayer);
    ctx.save();
    ctx.translate(guard.x, guard.y);
    ctx.fillStyle = guard.mode === 'chase' ? '#e74c3c' : PALETTE.guard;
    ctx.beginPath(); ctx.arc(0, 0, GUARD.radius, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = PALETTE.guardDark;
    ctx.lineWidth = 3; ctx.stroke();
    // Facing tick and cap brim.
    ctx.rotate(guard.dir);
    ctx.fillStyle = '#f5f5f5';
    ctx.beginPath(); ctx.arc(4, -5, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(4, 5, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = guard.mode === 'chase' ? '#ff6b5e' : '#2c3e50';
    ctx.fillRect(6, -9, 10, 18);
    ctx.restore();
    if (guard.mode === 'chase') {
      ctx.fillStyle = PALETTE.red;
      ctx.font = `bold 16px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText('!', guard.x, guard.y - 24);
    }
  }

  function drawCamera(camera) {
    if (!camera.disabled) {
      drawCone(camera.x, camera.y, camera.angle, CAMERA.visionRange, CAMERA.visionHalfAngle, camera.seesPlayer);
    }
    ctx.save();
    ctx.translate(camera.x, camera.y);
    ctx.rotate(camera.disabled ? camera.baseAngle : camera.angle);
    ctx.fillStyle = camera.disabled ? '#3a3f52' : PALETTE.camera;
    ctx.fillRect(-4, -6, 20, 12);
    ctx.beginPath(); ctx.arc(16, 0, 5, 0, Math.PI * 2);
    ctx.fillStyle = camera.disabled ? '#555' : (camera.seesPlayer ? PALETTE.red : PALETTE.red);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#555';
    ctx.beginPath(); ctx.arc(camera.x, camera.y, 4, 0, Math.PI * 2); ctx.fill();
    if (!camera.disabled && camera.disableProgress > 0) {
      ctx.strokeStyle = PALETTE.gold;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(camera.x, camera.y, 22, -Math.PI / 2, -Math.PI / 2 + camera.disableProgress * Math.PI * 2);
      ctx.stroke();
    }
  }

  function drawPlayer(player) {
    ctx.save();
    ctx.translate(player.x, player.y);
    // Soft shadow.
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.beginPath(); ctx.ellipse(0, 9, 14, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.rotate(player.dir);
    ctx.fillStyle = PALETTE.player;
    ctx.beginPath(); ctx.arc(0, 0, PLAYER.radius, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = PALETTE.playerTrim;
    ctx.lineWidth = 2.5; ctx.stroke();
    // Mask slits.
    ctx.fillStyle = PALETTE.playerTrim;
    ctx.fillRect(2, -8, 8, 3);
    ctx.fillRect(2, 5, 8, 3);
    // Little loot sack when carrying treasure.
    ctx.restore();
  }

  function drawHud(state, best) {
    ctx.fillStyle = PALETTE.panel;
    ctx.fillRect(0, 0, FIELD.width, 52);
    ctx.textBaseline = 'middle';
    // Left: floor name and objective.
    ctx.fillStyle = PALETTE.text;
    ctx.font = `bold 18px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.fillText(state.level.name, 16, 18);
    ctx.font = `13px ${FONT}`;
    ctx.fillStyle = PALETTE.muted;
    ctx.fillText(state.level.subtitle, 16, 40);
    // Centre: time and best score.
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `14px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText(`TIME ${Math.floor(state.time)}s   •   BEST ${best}`, FIELD.width / 2, 26);
    // Right, top row: loot counter and score.
    ctx.fillStyle = PALETTE.gold;
    ctx.font = `bold 20px ${FONT}`;
    ctx.textAlign = 'right';
    ctx.fillText(`◆ ${state.collected}/${state.totalLoot}  •  SCORE ${state.score}`, FIELD.width - 16, 18);
    // Right, bottom row: alarm meter.
    const mw = 180;
    const mx = FIELD.width - 16 - mw;
    const my = 34;
    ctx.fillStyle = PALETTE.text;
    ctx.font = `bold 12px ${FONT}`;
    ctx.textAlign = 'right';
    ctx.fillText('ALARM', mx - 8, my + 6);
    ctx.fillStyle = '#222';
    ctx.fillRect(mx, my, mw, 12);
    const alarmColor = state.alarm > 70 ? PALETTE.red : state.alarm > 35 ? '#e67e22' : PALETTE.gold;
    ctx.fillStyle = alarmColor;
    ctx.fillRect(mx, my, mw * (state.alarm / ALARM.max), 12);
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 1;
    ctx.strokeRect(mx, my, mw, 12);
    if (state.spotted) {
      ctx.fillStyle = PALETTE.red;
      ctx.font = `bold 22px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText(state.spottedBy === 'camera' ? 'SPOTTED BY CAMERA!' : 'SPOTTED!', FIELD.width / 2, 78);
    }
    if (state.hintTimer > 0 && state.hint) {
      ctx.fillStyle = PALETTE.text;
      ctx.font = `bold 16px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText(state.hint, FIELD.width / 2, 104);
    }
    // Camera-disable hint.
    const nearCamera = state.cameras.find(
      (c) => !c.disabled && Math.hypot(state.player.x - c.x, state.player.y - c.y) < CAMERA.disableRange,
    );
    if (nearCamera) {
      ctx.fillStyle = PALETTE.gold;
      ctx.font = `bold 15px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText('HOLD CLICK ON THE CAMERA TO DISABLE IT', FIELD.width / 2, FIELD.height - 24);
    }
  }

  function drawOverlay(title, lines, accent) {
    ctx.fillStyle = 'rgba(5, 5, 12, 0.72)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.textAlign = 'center';
    ctx.fillStyle = accent || PALETTE.gold;
    ctx.font = `bold 64px ${FONT}`;
    ctx.fillText(title, FIELD.width / 2, 210);
    ctx.fillStyle = PALETTE.text;
    ctx.font = `20px ${FONT}`;
    let y = 290;
    for (const line of lines) {
      ctx.fillText(line, FIELD.width / 2, y);
      y += 34;
    }
  }

  function drawTitle(state, best) {
    drawWorld(state, true);
    drawOverlay('THE MIDNIGHT VAULT', [
      'A stealth heist in three floors of a guarded museum.',
      'WASD / Arrows — move     Shift — sneak     Mouse — disable cameras',
      'Steal every treasure, then escape through the green EXIT.',
      'If the alarm hits 100%, the heist is over.',
      '',
      'Press SPACE or CLICK to start the heist',
      best > 0 ? `Best score so far: ${best}` : 'No score yet — make the vault yours.',
    ]);
  }

  function drawWorld(state, forTitle = false, best = 0) {
    drawFloor();
    drawExit(state.level.exit, state.collected >= state.totalLoot);
    drawWalls(state.level.walls);
    for (const item of state.loot) drawLoot(item);
    for (const camera of state.cameras) drawCamera(camera);
    for (const guard of state.guards) drawGuard(guard);
    drawPlayer(state.player);
    if (!forTitle) drawHud(state, best);
  }

  function draw(state, screen, best) {
    const view = fit();
    ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
    ctx.fillStyle = PALETTE.backdrop;
    ctx.fillRect(0, 0, canvas.width / view.dpr, canvas.height / view.dpr);
    ctx.setTransform(view.scale, 0, 0, view.scale, view.ox, view.oy);
    ctx.textBaseline = 'middle';
    if (screen === SCREEN_TITLE) {
      drawTitle(state, best);
    } else if (screen === SCREEN_PLAY || screen === SCREEN_PAUSED) {
      drawWorld(state, false, best);
      if (screen === SCREEN_PAUSED) {
        drawOverlay('PAUSED', ['Take a breath. The guards are waiting.', '', 'Press P or ESC to keep sneaking'], PALETTE.text);
      }
    } else if (screen === SCREEN_WIN) {
      const last = state.levelIndex >= LEVELS.length - 1;
      drawWorld(state, false, best);
      drawOverlay(
        last ? 'THE PERFECT HEIST!' : 'FLOOR CLEARED!',
        last
          ? [
              `You stole every treasure in the museum. Score: ${state.score}`,
              `Time bonus: +${state.timeBonus || 0}   Stealth bonus: +${state.stealthBonus || 0}`,
              `Best score: ${Math.max(best, state.score)}`,
              '',
              'Press SPACE or CLICK to play again',
            ]
          : [
              `All ${state.totalLoot} treasures stolen. Score: ${state.score}`,
              `Time bonus: +${state.timeBonus || 0}   Stealth bonus: +${state.stealthBonus || 0}`,
              '',
              'Press SPACE or CLICK for the next floor',
            ],
        PALETTE.green,
      );
    } else if (screen === SCREEN_BUSTED) {
      drawWorld(state, false, best);
      drawOverlay('BUSTED!', [
        `The alarm hit ${Math.floor(state.alarmPeak)}% and the guards closed in.`,
        `You kept ${state.collected} of ${state.totalLoot} treasures. Score: ${state.score}`,
        '',
        'Press SPACE or CLICK to try the heist again',
      ], PALETTE.red);
    }
  }

  return { draw, toLogical };
}
