# Project Brief: DuckIt

## 1. Core Requirements and Goals

DuckIt is a physics-based 2D platformer game built with Phaser and Box2D, using Vite as the build tool. The core objective is to create a functional and engaging game experience based on the specifications outlined in the `vite-template/documents/prd.md`.

**Key Features:**

- **Player Character:** A duck with physics-based movement (run, jump, fall) and distinct animations.
- **Platforms:** Tiled platforms constructed from `platform-left`, `platform-middle`, and `platform-right` assets.
- **Crates:** Pushable physics objects (`crate-big`, `crate-small`) used for puzzles, with a 2:1 mass ratio (big:small). Crates cannot fall off platforms.
- **Enemies:** A single enemy type (`enemy.png`) that patrols platforms at 80% of player speed and kills the player on contact.
- **Coins:** Collectible items (`coin` animations) placed throughout the level, with a counter displayed.
- **Finish Entity:** Marks the level end, with animations (`finish` states).
- **Procedural Levels:** Levels are generated procedurally (10,000px wide).
- **Death Conditions:** Player dies from enemy contact or falling off-screen.
- **Controls:** Keyboard (arrows) and optional on-screen mobile controls.
- **UI:** Coin counter, start/reset overlay.
- **Physics:** Box2D integration via `src/PhaserBox2D.js`.
- **Assets:** Managed via a texture atlas (`assets.png`, `assets.json`).
- **Scenes:** `Boot`, `Preloader`, `Game`.
- **Performance:** Target 60fps, responsive design.
- **Camera:** Follows player with subtle easing.

## 2. Scope

- Implement all gameplay mechanics as described in the PRD.
- Ensure procedural level generation creates playable and completable levels.
- Implement all specified animations and transitions.
- Create the required UI elements.
- Ensure the game is responsive across desktop and mobile viewport sizes.
- Integrate Box2D physics for all relevant interactions.
- No sound effects or music are required.
- No checkpoint system.

## 3. Success Criteria

- A fully playable game matching the PRD specifications.
- Stable performance at 60fps.
- Correct implementation of physics interactions.
- Functional procedural level generation.
- Responsive UI and controls.
