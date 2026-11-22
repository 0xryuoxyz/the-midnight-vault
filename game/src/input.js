// Keyboard and mouse input. Held keys give a steering vector; one-shot presses (start,
// restart, pause) are queued as bit flags and taken once by the loop, so a press between
// two frames is never lost and never counted twice. The mouse position is tracked in the
// game's logical coordinates, and a held mouse button is how the thief disables cameras.

export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;

const UP = new Set(['ArrowUp', 'KeyW']);
const DOWN = new Set(['ArrowDown', 'KeyS']);
const LEFT = new Set(['ArrowLeft', 'KeyA']);
const RIGHT = new Set(['ArrowRight', 'KeyD']);
const SNEAK = new Set(['ShiftLeft', 'ShiftRight']);
const CONFIRM = new Set(['Space', 'Enter']);
const PAUSE = new Set(['KeyP', 'Escape']);

export function createInput(canvas, toLogical) {
  let up = false;
  let down = false;
  let left = false;
  let right = false;
  let sneak = false;
  let mouseDown = false;
  let mouseX = 0;
  let mouseY = 0;
  let actions = 0;

  function key(code, pressed) {
    if (UP.has(code)) up = pressed;
    else if (DOWN.has(code)) down = pressed;
    else if (LEFT.has(code)) left = pressed;
    else if (RIGHT.has(code)) right = pressed;
    else if (SNEAK.has(code)) sneak = pressed;
    else if (pressed && CONFIRM.has(code)) actions |= ACTION_CONFIRM;
    else if (pressed && PAUSE.has(code)) actions |= ACTION_PAUSE;
    else return false;
    return true;
  }

  window.addEventListener('keydown', (event) => {
    if (key(event.code, true) && !event.repeat) event.preventDefault();
    if (CONFIRM.has(event.code) && !event.repeat) actions |= ACTION_CONFIRM;
    if (PAUSE.has(event.code) && !event.repeat) actions |= ACTION_PAUSE;
  });
  window.addEventListener('keyup', (event) => {
    key(event.code, false);
  });
  // A key released while the tab is hidden never sends keyup: let go of everything on blur.
  window.addEventListener('blur', () => {
    up = down = left = right = sneak = false;
    mouseDown = false;
  });

  function trackPointer(event) {
    const rect = canvas.getBoundingClientRect();
    const point = toLogical(event.clientX - rect.left, event.clientY - rect.top);
    mouseX = point.x;
    mouseY = point.y;
  }
  canvas.addEventListener('pointermove', trackPointer);
  canvas.addEventListener('pointerdown', (event) => {
    trackPointer(event);
    mouseDown = true;
    actions |= ACTION_CONFIRM;
  });
  canvas.addEventListener('pointerup', () => {
    mouseDown = false;
  });
  canvas.addEventListener('pointerleave', () => {
    mouseDown = false;
  });

  return {
    /** Normalised steering vector from the held movement keys. */
    moveVector() {
      const x = (right ? 1 : 0) - (left ? 1 : 0);
      const y = (down ? 1 : 0) - (up ? 1 : 0);
      if (x === 0 && y === 0) return { x: 0, y: 0 };
      const len = Math.hypot(x, y);
      return { x: x / len, y: y / len };
    },
    sneaking() {
      return sneak;
    },
    mouse() {
      return { x: mouseX, y: mouseY, down: mouseDown };
    },
    /** The one-shot presses since the last call, as ACTION_* flags. */
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
  };
}
