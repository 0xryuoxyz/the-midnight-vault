// Every tuning number, colour and level layout in one place. The playfield is a fixed
// 1280x720 logical area; the renderer scales it to the window, so no rule below depends
// on the screen size. All text the player sees is English.

export const FIELD = { width: 1280, height: 720 };
export const STEP = 1 / 60;

export const PLAYER = {
  radius: 14,
  speed: 210,
  sneakSpeed: 115,
  // While sneaking (hold Shift) the thief moves slower but is much harder to spot.
  sneakSpotFactor: 0.45,
};

export const GUARD = {
  radius: 15,
  patrolSpeed: 72,
  chaseSpeed: 158,
  visionRange: 235,
  // Half of the vision cone's opening angle, in radians.
  visionHalfAngle: 0.61,
  // Alarm points per second while the thief is inside this guard's cone.
  spotRate: 48,
  // Seconds of continuous sight before the guard starts chasing.
  chaseDelay: 0.7,
  catchRadius: 27,
  // How long a guard keeps chasing after losing sight, in seconds.
  chaseMemory: 2.2,
};

export const CAMERA = {
  visionRange: 265,
  visionHalfAngle: 0.52,
  spotRate: 36,
  // Radians per second the camera sweeps back and forth.
  sweepSpeed: 0.55,
  // Seconds the thief must stay close and keep the mouse held to disable a camera.
  disableTime: 1.2,
  disableRange: 120,
};

export const LOOT_VALUES = {
  diamond: 500,
  gold: 300,
  painting: 400,
  crown: 600,
  safe: 700,
  ruby: 800,
};

export const ALARM = {
  max: 100,
  // Alarm points per second the meter cools down while nobody sees the thief.
  decay: 7,
  // Alarm level at which every guard turns toward the thief and starts hunting.
  huntThreshold: 55,
};

export const PALETTE = {
  backdrop: '#0a0a12',
  floorA: '#171a26',
  floorB: '#141724',
  floorLine: '#1e2233',
  wall: '#2c3145',
  wallTop: '#454c68',
  wallEdge: '#10121c',
  player: '#1c1c22',
  playerTrim: '#f2c94c',
  guard: '#c0392b',
  guardDark: '#7e2318',
  camera: '#8e9aaf',
  coneCalm: 'rgba(242, 201, 76, 0.20)',
  coneAlert: 'rgba(231, 76, 60, 0.34)',
  lootGlow: 'rgba(242, 201, 76, 0.35)',
  exit: '#27ae60',
  exitGlow: 'rgba(39, 174, 96, 0.35)',
  text: '#eef1f5',
  muted: '#9aa1b5',
  gold: '#f2c94c',
  red: '#e74c3c',
  green: '#2ecc71',
  panel: 'rgba(10, 10, 18, 0.82)',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

export const BEST_KEY = 'midnight-vault.best';

/** Three hand-designed floors. Walls are {x, y, w, h} rectangles; guards walk their
 *  waypoints in order and loop; cameras sweep around their base angle. */
export const LEVELS = [
  {
    name: 'LEVEL 1 — THE GALLERY',
    subtitle: 'Steal 4 treasures, then slip out the green exit.',
    playerStart: { x: 80, y: 640 },
    exit: { x: 1210, y: 60, w: 56, h: 56 },
    walls: [
      { x: 0, y: 300, w: 480, h: 24 },
      { x: 700, y: 300, w: 580, h: 24 },
      { x: 560, y: 80, w: 24, h: 220 },
      { x: 900, y: 420, w: 24, h: 220 },
      { x: 180, y: 120, w: 60, h: 60 },
      { x: 1050, y: 120, w: 60, h: 60 },
    ],
    loot: [
      { kind: 'diamond', x: 210, y: 90 },
      { kind: 'gold', x: 1080, y: 90 },
      { kind: 'painting', x: 640, y: 180 },
      { kind: 'crown', x: 1150, y: 600 },
    ],
    guards: [
      { waypoints: [{ x: 260, y: 520 }, { x: 940, y: 520 }, { x: 940, y: 640 }, { x: 260, y: 640 }] },
      { waypoints: [{ x: 640, y: 110 }, { x: 640, y: 260 }] },
    ],
    cameras: [
      { x: 640, y: 324, baseAngle: Math.PI / 2, sweep: 0.9 },
    ],
  },
  {
    name: 'LEVEL 2 — THE VAULT HALL',
    subtitle: 'More guards, more eyes. Steal 5 treasures and vanish.',
    playerStart: { x: 80, y: 640 },
    exit: { x: 1210, y: 60, w: 56, h: 56 },
    walls: [
      { x: 0, y: 240, w: 400, h: 24 },
      { x: 560, y: 240, w: 720, h: 24 },
      { x: 0, y: 480, w: 560, h: 24 },
      { x: 760, y: 480, w: 520, h: 24 },
      { x: 420, y: 80, w: 24, h: 160 },
      { x: 860, y: 480, w: 24, h: 160 },
      { x: 200, y: 100, w: 60, h: 60 },
      { x: 1080, y: 560, w: 60, h: 60 },
    ],
    loot: [
      { kind: 'diamond', x: 230, y: 80 },
      { kind: 'gold', x: 1110, y: 540 },
      { kind: 'painting', x: 640, y: 120 },
      { kind: 'crown', x: 640, y: 600 },
      { kind: 'safe', x: 1200, y: 360 },
    ],
    guards: [
      { waypoints: [{ x: 200, y: 360 }, { x: 1100, y: 360 }] },
      { waypoints: [{ x: 640, y: 560 }, { x: 640, y: 660 }] },
      { waypoints: [{ x: 1000, y: 120 }, { x: 1000, y: 220 }] },
    ],
    cameras: [
      { x: 480, y: 264, baseAngle: Math.PI / 2, sweep: 0.8 },
      { x: 660, y: 480, baseAngle: -Math.PI / 2, sweep: 0.8 },
    ],
  },
  {
    name: 'LEVEL 3 — THE GRAND VAULT',
    subtitle: 'The final floor. Six treasures. No mistakes.',
    playerStart: { x: 80, y: 660 },
    exit: { x: 1210, y: 60, w: 56, h: 56 },
    walls: [
      { x: 0, y: 180, w: 360, h: 24 },
      { x: 520, y: 180, w: 760, h: 24 },
      { x: 0, y: 360, w: 480, h: 24 },
      { x: 640, y: 360, w: 640, h: 24 },
      { x: 0, y: 540, w: 380, h: 24 },
      { x: 560, y: 540, w: 720, h: 24 },
      { x: 300, y: 180, w: 24, h: 180 },
      { x: 980, y: 360, w: 24, h: 180 },
    ],
    loot: [
      { kind: 'diamond', x: 180, y: 90 },
      { kind: 'gold', x: 1180, y: 90 },
      { kind: 'painting', x: 640, y: 270 },
      { kind: 'crown', x: 180, y: 450 },
      { kind: 'safe', x: 1180, y: 630 },
      { kind: 'ruby', x: 640, y: 630 },
    ],
    guards: [
      { waypoints: [{ x: 120, y: 90 }, { x: 440, y: 90 }, { x: 440, y: 150 }, { x: 120, y: 150 }] },
      { waypoints: [{ x: 700, y: 270 }, { x: 1180, y: 270 }] },
      { waypoints: [{ x: 120, y: 450 }, { x: 480, y: 450 }] },
      { waypoints: [{ x: 700, y: 630 }, { x: 1080, y: 630 }, { x: 1080, y: 470 }, { x: 700, y: 470 }] },
    ],
    cameras: [
      { x: 440, y: 204, baseAngle: Math.PI / 2, sweep: 0.9 },
      { x: 560, y: 384, baseAngle: -Math.PI / 2, sweep: 0.7 },
      { x: 1004, y: 360, baseAngle: Math.PI / 2, sweep: 0.7 },
    ],
  },
];
