// The heist simulation: the thief, patrolling guards with vision cones, sweeping
// security cameras, loot to steal and the alarm meter. Pure logic, no DOM: the main loop
// feeds it input and the renderer paints its state. All distances are in logical pixels.

import { ALARM, CAMERA, FIELD, GUARD, LEVELS, LOOT_VALUES, PLAYER } from './config.js';

export const EVENT_LOOT = 'loot';
export const EVENT_SPOTTED = 'spotted';
export const EVENT_WIN = 'win';
export const EVENT_BUSTED = 'busted';
export const EVENT_CAMERA_OFF = 'camera-off';

function clamp(value, min, max) {
  return value < min ? min : value > max ? max : value;
}

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

/** True when the segment from (x1,y1) to (x2,y2) touches the rectangle. */
export function segmentHitsRect(x1, y1, x2, y2, rect) {
  const minX = Math.min(x1, x2);
  const maxX = Math.max(x1, x2);
  const minY = Math.min(y1, y2);
  const maxY = Math.max(y1, y2);
  if (maxX < rect.x || minX > rect.x + rect.w || maxY < rect.y || minY > rect.y + rect.h) return false;
  // An endpoint inside the rectangle is a hit.
  if (x1 >= rect.x && x1 <= rect.x + rect.w && y1 >= rect.y && y1 <= rect.y + rect.h) return true;
  if (x2 >= rect.x && x2 <= rect.x + rect.w && y2 >= rect.y && y2 <= rect.y + rect.h) return true;
  // Otherwise test the four edges.
  const dx = x2 - x1;
  const dy = y2 - y1;
  const edges = [
    [rect.x, rect.y, rect.x + rect.w, rect.y],
    [rect.x + rect.w, rect.y, rect.x + rect.w, rect.y + rect.h],
    [rect.x + rect.w, rect.y + rect.h, rect.x, rect.y + rect.h],
    [rect.x, rect.y + rect.h, rect.x, rect.y],
  ];
  for (const [ex1, ey1, ex2, ey2] of edges) {
    const denom = dx * (ey2 - ey1) - dy * (ex2 - ex1);
    if (denom === 0) continue;
    const t = ((ex1 - x1) * (ey2 - ey1) - (ey1 - y1) * (ex2 - ex1)) / denom;
    const u = ((ex1 - x1) * dy - (ey1 - y1) * dx) / denom;
    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) return true;
  }
  return false;
}

/** True when nothing (a wall) stands between the two points. */
export function hasLineOfSight(x1, y1, x2, y2, walls) {
  for (const wall of walls) {
    if (segmentHitsRect(x1, y1, x2, y2, wall)) return false;
  }
  return true;
}

/** True when the target is inside a vision cone of the given range and half-angle. */
export function inCone(eyeX, eyeY, facing, range, halfAngle, tx, ty, walls) {
  const dx = tx - eyeX;
  const dy = ty - eyeY;
  const dist = Math.hypot(dx, dy);
  if (dist > range) return false;
  if (dist < 1) return true;
  if (Math.abs(angleDiff(Math.atan2(dy, dx), facing)) > halfAngle) return false;
  return hasLineOfSight(eyeX, eyeY, tx, ty, walls);
}

/** Push a circle out of every wall it overlaps and keep it inside the field. */
function resolveCircle(entity, radius, walls) {
  entity.x = clamp(entity.x, radius, FIELD.width - radius);
  entity.y = clamp(entity.y, radius, FIELD.height - radius);
  for (const wall of walls) {
    const nearestX = clamp(entity.x, wall.x, wall.x + wall.w);
    const nearestY = clamp(entity.y, wall.y, wall.y + wall.h);
    const dx = entity.x - nearestX;
    const dy = entity.y - nearestY;
    const distSq = dx * dx + dy * dy;
    if (distSq >= radius * radius) continue;
    if (distSq === 0) {
      // Centre inside the wall: push out along the smallest penetration.
      const left = entity.x - wall.x;
      const right = wall.x + wall.w - entity.x;
      const top = entity.y - wall.y;
      const bottom = wall.y + wall.h - entity.y;
      const min = Math.min(left, right, top, bottom);
      if (min === left) entity.x = wall.x - radius;
      else if (min === right) entity.x = wall.x + wall.w + radius;
      else if (min === top) entity.y = wall.y - radius;
      else entity.y = wall.y + wall.h + radius;
    } else {
      const dist = Math.sqrt(distSq);
      entity.x = nearestX + (dx / dist) * radius;
      entity.y = nearestY + (dy / dist) * radius;
    }
  }
}

export function createWorld(random, levelIndex = 0) {
  const level = LEVELS[levelIndex];
  const state = {
    levelIndex,
    level,
    time: 0,
    status: 'playing', // 'playing' | 'won' | 'busted'
    alarm: 0,
    alarmPeak: 0,
    score: 0,
    collected: 0,
    totalLoot: level.loot.length,
    spotted: false,
    spottedBy: null, // 'guard' | 'camera' | null
    hint: '',
    hintTimer: 0,
    player: {
      x: level.playerStart.x,
      y: level.playerStart.y,
      dir: -Math.PI / 2,
      moving: false,
      sneaking: false,
    },
    guards: level.guards.map((g, i) => ({
      id: i,
      waypoints: g.waypoints,
      wp: 0,
      x: g.waypoints[0].x,
      y: g.waypoints[0].y,
      dir: 0,
      pause: 0,
      mode: 'patrol', // 'patrol' | 'chase'
      spotTime: 0,
      lastSeen: null,
      memory: 0,
      seesPlayer: false,
    })),
    cameras: level.cameras.map((c) => ({
      x: c.x,
      y: c.y,
      baseAngle: c.baseAngle,
      sweep: c.sweep,
      angle: c.baseAngle,
      disabled: false,
      disableProgress: 0,
      seesPlayer: false,
    })),
    loot: level.loot.map((l) => ({
      kind: l.kind,
      x: l.x,
      y: l.y,
      value: LOOT_VALUES[l.kind],
      taken: false,
      sparkle: random() * Math.PI * 2,
    })),
  };

  function moveGuard(guard, dt, events) {
    const player = state.player;
    const seen = inCone(
      guard.x, guard.y, guard.dir, GUARD.visionRange, GUARD.visionHalfAngle,
      player.x, player.y, level.walls,
    );
    guard.seesPlayer = seen;
    if (seen) {
      guard.spotTime += dt;
      guard.lastSeen = { x: player.x, y: player.y };
      guard.memory = GUARD.chaseMemory;
      state.spotted = true;
      state.spottedBy = 'guard';
      state.alarm += GUARD.spotRate * dt * (player.sneaking ? PLAYER.sneakSpotFactor : 1);
      if (guard.spotTime >= GUARD.chaseDelay || state.alarm >= ALARM.huntThreshold) {
        if (guard.mode !== 'chase') events.push({ type: EVENT_SPOTTED, by: 'guard' });
        guard.mode = 'chase';
      }
    } else {
      guard.spotTime = 0;
    }

    let target = null;
    let speed = GUARD.patrolSpeed;
    if (guard.mode === 'chase') {
      target = guard.lastSeen;
      speed = GUARD.chaseSpeed;
      if (guard.memory > 0) guard.memory -= dt;
      if (guard.memory <= 0 && !seen) {
        guard.mode = 'patrol';
        guard.lastSeen = null;
      }
    } else {
      if (guard.pause > 0) {
        guard.pause -= dt;
      } else {
        target = guard.waypoints[guard.wp];
        const dx = target.x - guard.x;
        const dy = target.y - guard.y;
        if (Math.hypot(dx, dy) < 6) {
          guard.wp = (guard.wp + 1) % guard.waypoints.length;
          guard.pause = 0.9;
        }
      }
    }
    if (target) {
      const dx = target.x - guard.x;
      const dy = target.y - guard.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 1) {
        guard.dir = Math.atan2(dy, dx);
        const step = Math.min(dist, speed * dt);
        guard.x += (dx / dist) * step;
        guard.y += (dy / dist) * step;
      }
    }
    resolveCircle(guard, GUARD.radius, level.walls);

    // Caught: a guard gets their hands on the thief.
    if (Math.hypot(player.x - guard.x, player.y - guard.y) < GUARD.catchRadius) {
      state.status = 'busted';
      events.push({ type: EVENT_BUSTED, by: 'guard' });
    }
  }

  function updateCamera(camera, dt) {
    if (camera.disabled) {
      camera.seesPlayer = false;
      return;
    }
    camera.angle = camera.baseAngle + Math.sin(state.time * CAMERA.sweepSpeed) * camera.sweep;
    const player = state.player;
    const seen = inCone(
      camera.x, camera.y, camera.angle, CAMERA.visionRange, CAMERA.visionHalfAngle,
      player.x, player.y, level.walls,
    );
    camera.seesPlayer = seen;
    if (seen) {
      state.spotted = true;
      state.spottedBy = 'camera';
      state.alarm += CAMERA.spotRate * dt * (player.sneaking ? PLAYER.sneakSpotFactor : 1);
    }
  }

  function update(dt, input) {
    if (state.status !== 'playing') return [];
    const events = [];
    state.time += dt;
    state.spotted = false;
    state.spottedBy = null;

    // --- The thief moves. ---
    const player = state.player;
    const move = input.moveVector();
    player.sneaking = input.sneaking();
    const speed = player.sneaking ? PLAYER.sneakSpeed : PLAYER.speed;
    player.moving = move.x !== 0 || move.y !== 0;
    if (player.moving) {
      player.dir = Math.atan2(move.y, move.x);
      player.x += move.x * speed * dt;
      player.y += move.y * speed * dt;
      resolveCircle(player, PLAYER.radius, level.walls);
    }

    // --- Cameras sweep and watch. ---
    for (const camera of state.cameras) updateCamera(camera, dt);

    // --- Hold the mouse on a nearby camera to disable it. ---
    const mouse = input.mouse();
    for (const camera of state.cameras) {
      if (camera.disabled) continue;
      const near = Math.hypot(player.x - camera.x, player.y - camera.y) < CAMERA.disableRange;
      if (near && mouse.down) {
        camera.disableProgress += dt / CAMERA.disableTime;
        if (camera.disableProgress >= 1) {
          camera.disabled = true;
          camera.disableProgress = 0;
          state.score += 100;
          events.push({ type: EVENT_CAMERA_OFF });
        }
      } else {
        camera.disableProgress = Math.max(0, camera.disableProgress - dt * 0.8);
      }
    }

    // --- Guards patrol, spot and chase. ---
    for (const guard of state.guards) {
      moveGuard(guard, dt, events);
      if (state.status !== 'playing') return events;
    }

    // --- The alarm cools down while nobody sees the thief. ---
    if (!state.spotted) {
      state.alarm = Math.max(0, state.alarm - ALARM.decay * dt);
    }
    state.alarm = Math.min(ALARM.max, state.alarm);
    state.alarmPeak = Math.max(state.alarmPeak, state.alarm);
    if (state.alarm >= ALARM.max) {
      state.status = 'busted';
      events.push({ type: EVENT_BUSTED, by: 'alarm' });
      return events;
    }

    // --- Loot: walk over a treasure to pocket it. ---
    for (const item of state.loot) {
      if (item.taken) continue;
      if (Math.hypot(player.x - item.x, player.y - item.y) < PLAYER.radius + 18) {
        item.taken = true;
        state.collected += 1;
        state.score += item.value;
        events.push({ type: EVENT_LOOT, kind: item.kind, value: item.value });
      }
    }

    // --- The exit: only open once every treasure is stolen. ---
    const exit = level.exit;
    const inExit =
      player.x > exit.x - 6 && player.x < exit.x + exit.w + 6 &&
      player.y > exit.y - 6 && player.y < exit.y + exit.h + 6;
    if (inExit) {
      if (state.collected >= state.totalLoot) {
        state.status = 'won';
        const timeBonus = Math.max(0, 1200 - Math.floor(state.time) * 5);
        const stealthBonus = Math.floor((ALARM.max - state.alarmPeak) * 5);
        state.score += timeBonus + stealthBonus;
        state.timeBonus = timeBonus;
        state.stealthBonus = stealthBonus;
        events.push({ type: EVENT_WIN });
      } else if (state.hintTimer <= 0) {
        state.hint = `The exit is locked — steal ${state.totalLoot - state.collected} more treasure${state.totalLoot - state.collected === 1 ? '' : 's'} first!`;
        state.hintTimer = 2.5;
      }
    }
    if (state.hintTimer > 0) state.hintTimer -= dt;

    for (const item of state.loot) item.sparkle += dt * 3;
    return events;
  }

  return { state, update };
}
