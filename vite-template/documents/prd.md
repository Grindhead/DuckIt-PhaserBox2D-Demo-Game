# Product Requirements Document (PRD): Duck Platformer

## 1. Overview

### 1.1 Product Name

DuckIt

### 1.2 Genre

2D Physics-Based Platformer

### 1.3 Purpose

Develop a Mario-inspired platformer featuring a duck protagonist that uses physics-based mechanics to navigate procedurally generated levels. Players will jump, push crates to solve puzzles, avoid enemies, collect coins, and reach a finish entity to complete the game, offering a fresh experience with each playthrough.

### 1.4 Target Audience

- Casual gamers who enjoy platformers with moderate challenges.
- Players on desktop and mobile devices seeking replayable, physics-driven gameplay.

### 1.5 Platforms

- **Desktop:** Keyboard controls
- **Mobile:** On-screen buttons

## 2. Features

### 2.1 Core Gameplay

- **Objective:** Guide the duck through a 10,000-pixel-wide level to reach the finish entity.
- **Mechanics:** Physics-based movement and interaction using Phaser Box2D (jumping, pushing crates).
- **Level Design:** Procedurally generated, ensuring completion with medium difficulty and at least 2 crate-based puzzles.
- **Reset Mechanism:** Death or level completion displays `start.png`; clicking resets all entities to their initial state.

### 2.2 Player (Duck)

- **Description:** A duck character with physics-driven movement and distinct animations.
- **Animations:**
  - **Idle:** `duck-idle-0001` to `duck-idle-0010` (looping when stationary on a platform).
  - **Run:** `duck-run-0001` to `duck-run-0014` (looping when moving on a platform).
  - **Jump:** `duck-jump-0001` to `duck-jump-0012` (plays once when jumping).
  - **Fall:** `duck-fall-0001` to `duck-fall-0010` (looping when falling with positive Y velocity).
  - **Dead:** `duck-dead-0001` to `duck-dead-0010` (plays once when dying).
- **State Transitions:**
  - **Idle:** Stationary on a platform.
  - **Run:** Moving left/right on a platform.
  - **Jump:** Triggered by up arrow or jump button.
  - **Fall:** After jump animation completes or falling off a platform with positive Y velocity.
  - **Dead:** On enemy contact or falling off-screen.
- **Jump Ability:** Can jump 3 times their own height.
- **Starting Position:** Left edge of the level.

### 2.3 Platforms

- **Description:** Static, tiled surfaces for traversal and puzzle-solving.
- **Tiles:**
  - `platform-left`: Left end.
  - `platform-middle`: Repeatable middle (extends platform length).
  - `platform-right`: Right end.
- **Structure:** Bookended by `platform-left` and `platform-right`, with `platform-middle` repeated as needed.
- **Positioning:** Reflects player's max jump height (3x duck height); accounts for crate height when present.

### 2.4 Crates

- **Description:** Movable objects for accessing higher areas.
- **Types:**
  - `crate-big`: Larger, heavier crate.
  - `crate-small`: Smaller, lighter crate.
- **Assets:** Static PNGs in `crate/` folder.
- **Physics:** Dynamic Box2D bodies with a 2:1 mass ratio (`crate-big` = 2x `crate-small`).
- **Behavior:**
  - Pushed by the player; cannot fall off platforms.
  - Adds to jump height when stood upon.
- **Role:** At least 2 puzzles per level requiring crate movement to reach higher platforms.
- **Constraint:** Never placed on platforms with enemies.

### 2.5 Enemies

- **Description:** Ball-shaped entities patrolling platforms.
- **Asset:** `enemy` in `enemy/` folder (static PNG).
- **Type:** Single enemy type.
- **Movement:**
  - Patrols left/right on a platform at 80% of the player's run speed.
  - Reverses direction at platform edges (`platform-left`/`platform-right` tiles).
  - Cannot move through platforms or fall off.
- **Behavior:** Kills player on contact, triggering dead state.
- **Jumpable:** Player can jump over enemies (3x height ensures feasibility).

### 2.6 Coins

- **Description:** Collectible sensors for optional engagement.
- **Animations:**
  - **Idle:** `coin-idle-0001` to `coin-idle-0023` (looping).
  - **Collect:** `coin-collect-0001` to `coin-collect-0008` (plays once, then removed).
- **Quantity:** 100 per level, evenly distributed.
- **Placement:** 30px above random `platform-middle` tiles, 1 coin per tile max.
- **UI:** Coin count in top-right corner (e.g., "Coins: X/100").

### 2.7 Finish Entity

- **Description:** Goal sensor marking level completion.
- **Animations:**
  - **Idle:** `finish-idle` (static frame).
  - **Activated:** `finish-activated-0001` to `finish-activated-0019` (plays once on contact).
  - **Active:** `finish-active-0001` to `finish-active-0018` (loops after activated).
- **Behavior:**
  - Starts in idle state.
  - On player contact:
    - Plays `finish-activated` once.
    - Transitions to looping `finish-active`.
    - Disables player controls.
    - After one `finish-active` loop, displays `start.png`.
- **Position:** Furthest right platform, always accessible.

### 2.8 Level Design

- **Width:** 10,000 pixels.
- **Generation:** Procedurally generated on game start.
- **Rules:**
  - Platforms vary in length and height, respecting max jump height (3x duck height, plus crate height if applicable).
  - At least 2 crate puzzles.
  - No crates on enemy platforms.
  - 100 coins evenly spread.
  - Finish on the rightmost platform.
- **Difficulty:** Medium, with guaranteed completion.
- **Crate Stability:** Crates cannot fall off platforms.

### 2.9 Camera

- **Behavior:** Follows the player with subtle easing for smooth tracking.

### 2.10 UI

- **Coin Counter:** Top-right corner (e.g., "Coins: X/100").
- **Start Overlay:** `start.png` on death or completion; clickable to reset.

## 3. Technical Requirements

### 3.1 Engine

- **Framework:** Phaser with Box2D physics via `src/PhaserBox2D.js`.
- **Build Tool:** Vite.
- **IDE:** Cursor.

### 3.2 Canvas

- **Size:** Responsive to screen dimensions.
- **Level Width:** Fixed at 10,000 pixels.

### 3.3 Assets

- **Format:** PNG spritesheets in Phaser format via TexturePacker.
- **Files:**
  - `public/assets.png` (spritesheet).
  - `public/assets.json` (metadata).
- **Source:** `assets/` folder, exported to `public/`.
- **Structure:**

  ```text

  assets/
  ├── coin/
  │   ├── coin-collect/
  │   └── coin-idle/
  ├── finish/
  │   ├── finish-activated/
  │   ├── finish-active/
  │   └── finish-idle/
  ├── platforms/
  ├── player/
  │   ├── dead/
  │   ├── fall/
  │   ├── idle/
  │   ├── jump/
  │   └── run/
  ├── ui/
  ├── crate/
  └── enemy/
  ```

### 3.4 Physics

- **Engine:** Box2D.
- **Entities:**
  - **Player:** Dynamic body; jump impulse allows 3x height.
  - **Platforms:** Static bodies.
  - **Crates:** Dynamic bodies (2:1 mass ratio); constrained to platforms.
  - **Enemies:** Dynamic bodies with horizontal constraint.
  - **Coins/Finish:** Sensors.

### 3.5 Controls

- **Desktop:**
  - **Left Arrow:** Move left.
  - **Right Arrow:** Move right.
  - **Up Arrow:** Jump (3x duck height).
- **Mobile:**
  - On-screen buttons using `direction-button` from `ui/`:
    - **Left:** Bottom-left, 0° rotation.
    - **Right:** Bottom-left, 180° rotation.
    - **Jump:** Bottom-right, 90° rotation.
  - Hidden on desktop, visible at screen bottom on mobile.

### 3.6 Audio

- None.

## 4. Constraints

- **Enemies:** Single type.
- **Rewards:** No bonuses for collecting all coins.
- **Checkpoints:** None; full reset on death.

## 5. Success Criteria

- **Completion:** Every generated level is solvable with the duck reaching the finish.
- **Replayability:** Procedural generation ensures varied experiences.
- **Physics:** Smooth jumping (3x height) and crate interaction.
- **Usability:** Intuitive controls on desktop and mobile.
