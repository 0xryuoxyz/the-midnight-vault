# The Midnight Vault — A Stealth Heist Game

[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/0xryuoxyz/the-midnight-vault/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/0xryuoxyz/the-midnight-vault/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)

A top-down stealth heist game for the make.fun bounty **"Make the best heist game"**
(`best-heist-game-20261122-0559`). Original code, art and design — no libraries, no
network requests, no downloaded assets. Everything is drawn on a canvas.

## How to play

You are a thief in a guarded museum. Sneak past the guards and the security cameras,
steal every treasure on the floor, then escape through the green EXIT.

- **WASD / Arrow keys** — move
- **Shift (hold)** — sneak: slower, but guards and cameras spot you much more slowly
- **Mouse (hold click near a camera)** — disable a security camera (+100 points)
- **P / Esc** — pause
- **Space / Click** — start, continue, retry

Guards patrol with visible vision cones. Cameras sweep back and forth with their own
cones. Being seen raises the **alarm meter** — if it hits 100%, or a guard catches
you, the heist is over. Walls block sight: use them.

Three floors, each harder than the last: more guards, more cameras, more treasure.
Your score is the loot value plus a time bonus and a stealth bonus for keeping the
alarm low. The best score is saved in your browser.

## Run it

```sh
node serve.ts
# then open http://localhost:8080
```

No build step. `game/index.html` opens in desktop Chrome and plays with no network
request.

## Screenshots

`?shot=start|play|alarm|win` (with `&seed=N`) stages a fixed scene for screenshots.

## License

MIT — see `LICENSE`.
