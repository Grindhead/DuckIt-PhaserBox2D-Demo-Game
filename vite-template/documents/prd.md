# DuckIt Game - Product Requirements Document (PRD)

## Overview

**DuckIt** is a physics-based platformer game built using Phaser with Box2D physics integration (via `src/PhaserBox2D.js`). The game draws inspiration from classics like Mario, featuring a duck as the player character navigating procedurally generated levels. The game utilizes physics for movement and interactions, incorporates crate-pushing puzzles, and includes a single enemy type. The objective is to reach the finish entity while collecting coins, with medium difficulty and no checkpoints.

- **Genre**: Platformer
- **Engine**: Phaser with Box2D physics
- **Build Tool**: Vite
- **IDE**: Cursor
- **Target Platforms**: Desktop and Mobile (responsive canvas)
- **Current Date**: April 05, 2025

---

## Game Structure

### Scenes

The game consists of three scenes:

1. **Boot**
   - Sets up scaling and background color (white).
   - Transitions to the Preloader scene.
2. **Preloader**
   - Loads the texture atlas (`assets.png` and `assets.json`) from the `public` folder.
   - Transitions to the Game scene once assets are loaded.
3. **Game**
   - Initializes the Box2D world and all gameplay elements.
   - Contains the core gameplay loop.

---

## Technical Setup

- **Physics**: Phaser Box2D (`src/PhaserBox2D.js`) for character movement, crate interactions, and collision detection.
- **Assets**: Created with Texture Packer (Phaser format), stored in `public/assets.png` and `public/assets.json`.
- **Source Assets**: Located in `assets/` folder (all PNGs).
- **Canvas**: Responsive to screen size.
- **Animation Events**: Use `Phaser.Animations.Events` instead of the `duration` property.
- **External Dependencies**: Only the texture atlas is loaded externally.
- **Reference**: Use `/types` and `vite-template/src/PhaserBox2D.js` for Box2D implementation details.

### Asset Folder Structure

```text
assets/
├── coin/
│ ├── coin-collect/
│ └── coin-idle/
├── finish/
│ ├── finish-activated/
│ ├── finish-active/
│ └── finish-idle/
├── platforms/
├── player/
│ ├── dead/
│ ├── fall/
│ ├── idle/
│ ├── jump/
│ └── run/
├── ui/
├── crate/
└── enemy/
```

## Gameplay Mechanics

### Player Character

- **Appearance**: A duck with the following animations:
- **Idle**: `duck-idle-0001` to `duck-idle-0010` (looping when stationary).
- **Dead**: `duck-dead-0001` to `duck-dead-0010` (plays once on death).
- **Fall**: `duck-fall-0001` to `duck-fall-0010` (looping during fall).
- **Jump**: `duck-jump-0001` to `duck-jump-0012` (plays once per jump).
- **Run**: `duck-run-0001` to `duck-run-0014` (looping while moving on a platform).
- **State Transitions**:
- Enters **Fall** after **Jump** completes or when falling off a platform with positive Y velocity.
- Enters **Run** when moving horizontally on a platform.
- Enters **Idle** when stationary on a platform.
- **Movement**:
- Controlled via arrow keys (Up for jump).
- Jump height: 3x the duck’s height (Box2D physics).
- Physics-based movement for jumping and falling.
- **Starting Position**: Left side of the screen.
- **Death Conditions**:
- Falling off the bottom of the screen.
- Contact with an enemy.
- On death, display `start.png`; clicking resets the level to its initial state.

### Controls

- **Desktop**: Arrow keys (Left/Right for movement, Up for jump).
- **Mobile**:
- On-screen controls (hidden on desktop).
- Use `direction-button` asset (from `ui/` folder):
  - Left/Right buttons: Bottom-left, rotate default left orientation as needed.
  - Jump button: Bottom-right.

### Platforms

- **Construction**:
- Composed of three tiles: `platform-left`, `platform-middle`, `platform-right`.
- `platform-middle` repeats to create variable-length platforms.
- Each platform must be enclosed by `platform-left` and `platform-right`.
- **Physics**: Static Box2D bodies.
- **Positioning**: Procedurally generated, considering the player’s max jump height (including crate-assisted jumps).

### Crates

- **Types**:
- `crate-big`: Larger, heavier crate.
- `crate-small`: Smaller, lighter crate.
- **Physics**:
- Mass ratio: 2:1 (big:small).
- Pushable by the player using Box2D physics.
- Cannot fall off platforms (constrained to their initial platform).
- **Behavior**: No animations, static sprites.
- **Level Design**: Used in at least two crate-pushing puzzles per level to reach higher platforms.
- **Restriction**: Never placed on platforms with enemies.

### Enemies

- **Type**: Single enemy, a ball (`enemy` asset in `enemy/` folder).
- **Behavior**:
- Patrols horizontally across a platform, reversing direction at the ends.
- Moves at 80% of the player’s speed.
- Cannot move through platforms.
- Kills the player on contact.
- **Interaction**: Player can jump over them (jump height sufficient).
- **Placement**: Only one enemy per platform, never with crates.

### Coins

- **Appearance**:
- **Idle**: `coin-idle-0001` to `coin-idle-0023` (looping until collected).
- **Collect**: `coin-collect-0001` to `coin-collect-0008` (plays once on collection, then removed).
- **Physics**: Box2D sensors (no physical collision).
- **Placement**:
- 100 coins per level.
- Positioned 30px above random platforms, evenly spread.
- One coin per tile within a platform.
- **UI**: Display collected coin count in the top-right corner.
- **Reward**: No bonus for collecting all coins.

### Finish Entity

- **Physics**: Box2D sensor.
- **States**:
- **Idle**: `finish-idle` (static default frame).
- **Activated**: `finish-activated-0001` to `finish-activated-0019` (plays once when touched, disables player control).
- **Active**: `finish-active-0001` to `finish-active-0018` (loops after Activated completes).
- **Completion**:
- After one loop of `finish-active`, the level is complete.
- Display `start.png`; clicking resets the level.
- **Placement**: End of the furthest-right platform, always accessible.

### Level Design

- **Generation**: Procedurally generated on game start.
- **Width**: 10,000 pixels.
- **Difficulty**: Medium, always completable.
- **Requirements**:
- At least two crate-pushing puzzles.
- Platform heights respect the player’s max jump height (3x duck height, including crate boosts).
- No checkpoints.
- **Camera**: Follows the player with subtle easing.

---

## Scene Details

### Boot Scene

- **Purpose**: Initialize game settings.
- **Actions**:
- Set canvas scaling for responsiveness.
- Set background color to white.
- Transition to Preloader scene.

### Preloader Scene

- **Purpose**: Load game assets.
- **Preload Method**:
- Add texture atlas (`assets.png`, `assets.json`) to the loader.
- Call `this.load()`.
- **Create Method**:
- Automatically called when assets are loaded.
- Transition to Game scene.

### Game Scene

- **Purpose**: Core gameplay loop.
- **Setup**:
- Initialize Box2D world.
- Create player, platforms, crates, enemies, coins, and finish entity.
- Set up physics properties (e.g., crate mass, player jump force).
- Configure camera with easing.
- **Gameplay Loop**:
- Handle player input and state transitions.
- Update enemy movement.
- Detect collisions (player-enemy, player-coin, player-finish).
- Manage level reset on death or completion.

---

## Additional Notes

- **Audio**: No sounds.
- **Levels**: Single level, procedurally generated each time.
- **Performance**: Optimize for responsive canvas and mobile controls.
- **Testing**: Ensure crate puzzles and platform accessibility work with Box2D physics.

---

## Deliverables

- **Codebase**: Phaser project with Box2D integration, structured for Boot, Preloader, and Game scenes.
- **Assets**: Texture atlas (`assets.png`, `assets.json`) and source PNGs in `assets/`.
- **Documentation**: This PRD serves as the primary spec.

This PRD outlines the complete vision for **DuckIt**, ensuring a cohesive and engaging platformer experience.

```

```
