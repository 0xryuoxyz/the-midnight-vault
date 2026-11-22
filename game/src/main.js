// Boot and the one loop: input is read every frame, the world advances in fixed 1/60 s
// steps (several in a slow frame, none in a fast one), and the renderer paints what is
// there. The game moves between five screens: title, play, paused, win and busted, and
// through three floors of the museum.
//
// ?seed=N fixes the patrol jitter. ?shot=start|play|alarm|win|end (with &seed=N) stages
// that scene instead of running the loop, paints it twice and sets window.__shotReady
// for a screenshot.

import { BEST_KEY, LEVELS, STEP } from './config.js';
import { createRandom } from './random.js';
import { EVENT_BUSTED, EVENT_LOOT, EVENT_WIN, createWorld } from './world.js';
import { ACTION_CONFIRM, ACTION_PAUSE, createInput } from './input.js';
import { createRenderer, SCREEN_BUSTED, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';
import { stageShot } from './shots.js';

/** The longest frame the loop catches up on; a longer stall (a hidden tab) is dropped, not replayed. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const renderer = createRenderer(canvas);

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts this visit only.
  }
}

let world = createWorld(createRandom(seed), 0);
let screen = SCREEN_TITLE;
let best = readBest();

// A read-only handle for automated playtests (and for curious players in devtools).
window.__heist = {
  get state() { return world.state; },
  get screen() { return screen; },
  get best() { return best; },
};

function announce(text) {
  status.textContent = text;
}

function startLevel(levelIndex, keepScore) {
  const score = keepScore ? world.state.score : 0;
  world = createWorld(createRandom(seed + levelIndex * 7919), levelIndex);
  if (keepScore) world.state.score = score;
  screen = SCREEN_PLAY;
  announce(`${LEVELS[levelIndex].name}. ${LEVELS[levelIndex].subtitle}`);
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen, scene.best);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas, (x, y) => renderer.toLogical(x, y));
  let accumulator = 0;
  let last = performance.now();

  function frame(now) {
    requestAnimationFrame(frame);
    const elapsed = Math.min(MAX_FRAME, (now - last) / 1000);
    last = now;
    const actions = input.takeActions();

    if (screen === SCREEN_TITLE) {
      if (actions & ACTION_CONFIRM) startLevel(0, false);
    } else if (screen === SCREEN_PLAY) {
      if (actions & ACTION_PAUSE) {
        screen = SCREEN_PAUSED;
        announce('Paused.');
      } else {
        accumulator += elapsed;
        while (accumulator >= STEP) {
          const events = world.update(STEP, input);
          accumulator -= STEP;
          for (const event of events) {
            if (event.type === EVENT_LOOT) {
              announce(`Stole the ${event.kind} — plus ${event.value} points.`);
            } else if (event.type === EVENT_WIN) {
              if (world.state.score > best) {
                best = world.state.score;
                saveBest(best);
              }
              screen = SCREEN_WIN;
              announce('Floor cleared! Every treasure stolen.');
            } else if (event.type === EVENT_BUSTED) {
              if (world.state.score > best) {
                best = world.state.score;
                saveBest(best);
              }
              screen = SCREEN_BUSTED;
              announce('Busted! The heist is over.');
            }
          }
          if (world.state.status !== 'playing') break;
        }
      }
    } else if (screen === SCREEN_PAUSED) {
      if (actions & ACTION_PAUSE) screen = SCREEN_PLAY;
    } else if (screen === SCREEN_WIN) {
      if (actions & ACTION_CONFIRM) {
        if (world.state.levelIndex >= LEVELS.length - 1) startLevel(0, false);
        else startLevel(world.state.levelIndex + 1, true);
      }
    } else if (screen === SCREEN_BUSTED) {
      if (actions & ACTION_CONFIRM) startLevel(world.state.levelIndex, false);
    }

    renderer.draw(world.state, screen, best);
  }
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
