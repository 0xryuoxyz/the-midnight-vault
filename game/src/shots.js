// Staged scenes for screenshots: ?shot=start|play|alarm|win (with &seed=N) paints one
// fixed scene instead of running the loop, then sets window.__shotReady so a screenshot
// tool knows the frame is done. Each scene is built from the real game state, never
// from separate drawing code.

import { SCREEN_BUSTED, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';

export function stageShot(name, world) {
  const state = world.state;
  if (name === 'start') {
    return { screen: SCREEN_TITLE, best: 0 };
  }
  if (name === 'play') {
    // Mid-heist: two treasures pocketed, the thief crossing the hall while a guard's
    // cone sweeps just ahead and a camera watches from the wall.
    state.player.x = 620;
    state.player.y = 430;
    state.player.dir = Math.PI / 4;
    state.loot[0].taken = true;
    state.loot[1].taken = true;
    state.collected = 2;
    state.score = 800;
    state.time = 47;
    const guard = state.guards[0];
    guard.x = 760;
    guard.y = 520;
    guard.dir = Math.PI;
    guard.mode = 'patrol';
    const guard2 = state.guards[1];
    guard2.x = 640;
    guard2.y = 200;
    guard2.dir = Math.PI / 2;
    state.cameras[0].angle = Math.PI / 2 + 0.5;
    return { screen: SCREEN_PLAY, best: 1250 };
  }
  if (name === 'alarm') {
    // Caught in the open: the alarm is nearly full, a guard is chasing and the
    // camera has the thief in its cone.
    state.player.x = 700;
    state.player.y = 470;
    state.player.dir = -Math.PI / 2;
    state.loot[0].taken = true;
    state.collected = 1;
    state.score = 500;
    state.time = 63;
    state.alarm = 82;
    state.alarmPeak = 82;
    state.spotted = true;
    state.spottedBy = 'guard';
    const guard = state.guards[0];
    guard.x = 760;
    guard.y = 520;
    guard.dir = Math.atan2(state.player.y - guard.y, state.player.x - guard.x);
    guard.mode = 'chase';
    guard.seesPlayer = true;
    state.cameras[0].angle = Math.atan2(state.player.y - state.cameras[0].y, state.player.x - state.cameras[0].x);
    state.cameras[0].seesPlayer = true;
    return { screen: SCREEN_PLAY, best: 1250 };
  }
  if (name === 'win') {
    // The getaway: every treasure stolen, the thief at the open exit.
    for (const item of state.loot) item.taken = true;
    state.collected = state.totalLoot;
    state.score = 3420;
    state.time = 118;
    state.timeBonus = 610;
    state.stealthBonus = 340;
    state.alarmPeak = 32;
    state.player.x = state.level.exit.x - 24;
    state.player.y = state.level.exit.y + state.level.exit.h + 18;
    state.player.dir = Math.PI / 4;
    return { screen: SCREEN_WIN, best: 3420 };
  }
  if (name === 'end') {
    // Busted at the door: the alarm maxed out one step from freedom.
    state.player.x = 1080;
    state.player.y = 120;
    state.alarm = 100;
    state.alarmPeak = 100;
    state.collected = 3;
    state.score = 1200;
    state.time = 96;
    const guard = state.guards[0];
    guard.x = 1040;
    guard.y = 140;
    guard.dir = Math.atan2(state.player.y - guard.y, state.player.x - guard.x);
    guard.mode = 'chase';
    return { screen: SCREEN_BUSTED, best: 1250 };
  }
  return { screen: SCREEN_TITLE, best: 0 };
}
