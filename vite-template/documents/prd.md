# DuckIt: Product Requirements Document (PRD)

## 1. Introduction

### 1.1 Purpose

This document serves as a complete guide for the development of DuckIt, a 2D platformer game. It outlines all gameplay mechanics, technical requirements, and development processes to ensure the project is built according to specifications.

### 1.2 Overview

DuckIt is a physics-based 2D platformer where the player controls a duck character navigating through procedurally generated levels. The player must collect coins, avoid enemies, solve crate-pushing puzzles, and reach the finish while managing physics-based movement and interactions.

## 2. Game Overview

### 2.1 Genre and Style

- **Genre:** 2D platformer with physics-based mechanics.
- **Style:** Cartoonish, lighthearted, inspired by classic platformers like Mario.

### 2.2 Target Audience

- Casual gamers and fans of platformer games.

### 2.3 Platforms

- Desktop and mobile devices.
- The game must be responsive to different screen sizes.

## 3. Gameplay Mechanics

### 3.1 Player Character (Duck)

The player controls a duck with various animations and states, using physics for movement and interactions.

#### 3.1.1 Animations

- `Idle`: `duck-idle-0001` to `duck-idle-0010`
- `Dead`: `duck-dead-0001` to `duck-dead-0010`
- `Fall`: `duck-fall-0001` to `duck-fall-0010`
- `Jump`: `duck-jump-0001` to `duck-jump-0012`
- `Run`: `duck-run-0001` to `duck-run-0014`

#### 3.1.2 States

- **Idle:** When not moving on a platform.
- **Run:** When moving left or right on a platform.
- **Jump:** When the player initiates a jump.
- **Fall:** After the jump animation completes or when falling off a platform with positive Y velocity.
- **Dead:** When the player touches an enemy or falls off the screen.

#### 3.1.3 Movement

- Controlled via arrow keys (left, right, up for jump).
- The duck can jump up to 3 times its own height.
- Movement is physics-based using Box2D.

### 3.2 Platforms

Platforms are static bodies in Box2D and are constructed using tiling.

#### 3.2.1 Platform Construction

- `platform-left`: Left end of the platform.
- `platform-middle`: Repeatable tile for extending the platform.
- `platform-right`: Right end of the platform.
- Each platform must be enclosed by `platform-left` and `platform-right` tiles.

### 3.3 Crates

Crates are physics objects that the player can push to solve puzzles.

#### 3.3.1 Types

- `crate-big`: Larger crate.
- `crate-small`: Smaller crate.
- No animations.

#### 3.3.2 Physics

- Mass ratio: 2:1 (big:small).
- Can be pushed by the player.
- Cannot fall off the platform they are placed on.
- Never placed on platforms with enemies.

#### 3.3.3 Puzzles

- Used in at least two puzzles per level to reach higher areas.

### 3.4 Enemies

There is one enemy type: a ball that patrols platforms.

#### 3.4.1 Behavior

- Patrols horizontally on a platform, reversing direction at the ends.
- Moves at 80% of the player's speed.
- Kills the player on contact.
- Cannot move through platforms.
- The player can jump over enemies.

#### 3.4.2 Placement

- Only one enemy type: `enemy.png`.
- Never placed on platforms with crates.

### 3.5 Coins

Coins are collectible items placed throughout the level.

#### 3.5.1 Animations

- `Idle`: `coin-idle-0001` to `coin-idle-0023` (looping).
- `Collect`: `coin-collect-0001` to `coin-collect-0008` (plays once when collected).

#### 3.5.2 Properties

- Box2D sensors.
- 100 coins per level, placed 30px above random platforms.
- Only one coin per platform tile.
- Collected coins are removed from the game.
- Coin count is displayed in the top-right corner.
- No bonus or reward for collecting all coins.

### 3.6 Finish Entity

The finish entity marks the end of the level and has multiple states.

#### 3.6.1 States & Animations

- `Idle`: `finish-idle` (static frame).
- `Activated`: `finish-activated-0001` to `finish-activated-0019` (plays once when touched).
- `Active`: `finish-active-0001` to `finish-active-0018` (loops after `Activated` completes).

#### 3.6.2 Interaction

- Box2D sensor.
- Upon touching, disables player control.
- After the `finish-active` animation plays once, the level is complete.
- Display `start.png`; pressing it resets the level.

### 3.7 Death Conditions

The player dies if they:

- Touch an enemy.
- Fall off the bottom of the screen.
  - An invisible sensor 400px below the lowest platform detects falling deaths.
- Upon death, display `start.png`; pressing it resets the level.

## 4. Level Design

### 4.1 Procedural Generation

- Levels are procedurally generated upon starting the game.
- Level width: 10,000 pixels.
- The player starts on the left side.
- The finish entity is on the furthest right platform.

### 4.2 Platform Placement

- Platforms must be positioned to ensure all areas are accessible.
- Consider the player's maximum jump height (3x duck height) and crate usage.
- Platforms must allow the player to progress without impossible jumps.

### 4.3 Crate Puzzles

- Include at least two crate-pushing puzzles per level.
- Crates should be used to reach higher platforms or create stepping stones.
- Crates must not fall off platforms.

### 4.4 Enemy Placement

- Enemies patrol platforms without crates.
- Ensure the player can avoid or jump over enemies.

### 4.5 Coin Distribution

- 100 coins per level.
- Placed 30px above random platforms.
- Only one coin per platform tile.
- Evenly distributed across the level.

### 4.6 Difficulty

- Levels must be completable with a medium difficulty level.
- Ensure the finish is always accessible.

## 5. Controls

### 5.1 Keyboard Controls

- **Left Arrow:** Move left.
- **Right Arrow:** Move right.
- **Up Arrow:** Jump.

### 5.2 Mobile Controls

- On-screen controls (hidden on desktop):
  - **Left/Right buttons:** Bottom-left, using `direction-button` asset (rotated for direction).
  - **Jump button:** Bottom-right, using `direction-button` asset.

## 6. User Interface

### 6.1 Coin Counter

- Display the number of collected coins in the top-right corner.

### 6.2 Start Screen

- Display `start.png` when the player dies or completes the level.
- Pressing the screen resets the level to its initial state.

## 7. Technical Specifications

### 7.1 Framework and Physics

- **Framework:** Phaser with Box2D physics (`src/PhaserBox2D.js`).
- **Build Tool:** Vite.

### 7.2 Asset Management

- All assets are in the texture atlas (`assets.png` and `assets.json`).
- Created with Texture Packer (Phaser format).
- Source assets are in the `assets` folder (PNGs).
- Animations run at 30fps.

### 7.3 Scene Management

The game consists of three scenes:

- **Boot:**
  - Set up scaling and background color (white).
  - Proceed to `Preloader`.
- **Preloader:**
  - Load the texture atlas.
  - Display a loading bar and percentage.
  - Proceed to `Game` when assets are loaded.
- **Game:**
  - Set up the Box2D world and gameplay elements.

### 7.4 Performance

- The game runs at 60fps.
- The canvas is responsive to different screen sizes.

### 7.5 Animation Control

- Use `Phaser.Animations.Events` for animation control (no `duration` property).

### 7.6 Levels

- Only one level per game session.
- Levels are procedurally generated each time the game starts.

### 7.7 Camera

- The camera follows the player with subtle easing.
- No checkpoint system.

## 8. Development Process

### 8.1 Tools and IDE

- **IDE:** Cursor with Gemini 2.5 Pro LLM.
- **Developer:** Solo developer.

### 8.2 Version Control

- Use Git for version control.
- Make commits at milestones and after significant progress.
- No limit on the number of commits.

### 8.3 Development Approach

- Develop in small, incremental steps.
- Review each step to ensure functionality before proceeding.

## 9. Asset Folder Structure

The assets are organized as follows:

```text
assets/
  coin/
    coin-collect/
      coin-collect-0001.png to coin-collect-0008.png
    coin-idle/
      coin-idle-0001.png to coin-idle-0023.png
  finish/
    finish-activated/
      finish-activated-0001.png to finish-activated-0019.png
    finish-active/
      finish-active-0001.png to finish-active-0018.png
    finish-idle/
      finish-idle.png (single frame)
  platforms/
    platform-left.png
    platform-middle.png
    platform-right.png
  player/
    dead/
      duck-dead-0001.png to duck-dead-0010.png
    fall/
      duck-fall-0001.png to duck-fall-0010.png
    idle/
      duck-idle-0001.png to duck-idle-0010.png
    jump/
      duck-jump-0001.png to duck-jump-0012.png
    run/
      duck-run-0001.png to duck-run-0014.png
  ui/
    direction-button.png
    start.png
  crate/
    crate-big.png
    crate-small.png
  enemy/
    enemy.png
```

## 10. Additional Notes

- **Animations:** All animations are at 30fps.
- **Sounds:** There are no sounds in the game.
- **Death Detection:** An invisible sensor 400px below the lowest platform detects when the player falls off the screen.
- **Camera:** Follows the player with subtle easing.
- **Checkpoints:** No checkpoint system; the level resets fully upon death or completion.
