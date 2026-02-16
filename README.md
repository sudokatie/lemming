# Lemming

Browser-based puzzle game where tiny creatures march toward certain doom unless you intervene. Assign abilities. Save lives. Question the ethics of rodent labor exploitation.

## Why This Exists?

The original Lemmings (1991) was a masterpiece of puzzle design. Tiny pixel creatures, mindlessly marching, and you with godlike powers to dig, build, and block their way to safety.

Modern "remakes" are mobile-first, ad-supported, and have lost the charm. This is an attempt to bring back the pure puzzle experience - no ads, no microtransactions, just you versus the cliff.

## Features

- 5 handcrafted levels (more coming)
- 3 abilities: Blocker, Builder, Digger
- Pixel-perfect terrain collision
- Destructible terrain (dig through dirt, not steel)
- Retro synthesized sound effects (spawns, abilities, saves, wins)
- Per-level leaderboard (track best saves and times)
- Clean, no-frills UI
- Keyboard shortcuts for speed

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:3000 and start saving lemmings.

## Controls

| Key | Action |
|-----|--------|
| 1 | Select Blocker |
| 2 | Select Builder |
| 3 | Select Digger |
| P | Pause/Resume |
| R | Restart level |
| ESC | Cancel selection |
| Right-click | Cancel selection |
| Click | Assign ability to lemming |

## Abilities

**Blocker** - Stops walking, becomes a living wall. Other lemmings turn around when they hit a blocker. Permanent - can't be un-assigned.

**Builder** - Places 12 diagonal stairs in the direction they're facing. Good for bridging gaps. Returns to walking when done.

**Digger** - Digs straight down through terrain. Stops at steel or empty space. Good for creating shortcuts.

## Tech Stack

- Next.js 14 with TypeScript
- HTML5 Canvas for rendering
- Tailwind CSS for UI
- Jest for testing

## Philosophy

1. Puzzles should require thought, not reflexes
2. Simple mechanics, emergent complexity
3. Every level should be solvable (and fun to solve)
4. Failure should teach, not punish

## License

MIT

## Author

Katie

---

*They march. You think. They survive. Hopefully.*
