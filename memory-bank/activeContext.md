# Active Context: DuckIt - Enemy Implementation & Testing

## 1. Current Work Focus

The primary focus is on testing the newly implemented Enemy generation and interaction mechanics (patrolling, boundary constraints, player collision).

## 2. Recent Changes

- **Constants (`constants.ts`):** Added `ASSETS.ENEMY` definition (frame, dimensions, physics, speed factor).
- **Enemy Entity (`Enemy.ts`):** Created new class extending `Phaser.GameObjects.Sprite`:
  - Initializes physics body (dynamic, fixed rotation, contact listener).
  - Calculates speed based on `PHYSICS.PLAYER.SPEED` and `ASSETS.ENEMY.SPEED_FACTOR`.
  - Stores platform boundaries (`platformMinX`, `platformMaxX`).
  - Implements `update()` method for patrolling behavior:
    - Moves left/right at calculated speed.
    - Reverses direction and flips sprite (`flipX`) upon reaching platform boundaries.
    - Added `userData: { type: "enemy" }` to physics shape.
  - Includes `destroy()` method to remove physics body and sprite.
- **Enemy Generator (`enemyGenerator.ts`):** Created new module:
  - Defines `generateEnemyForPlatform` function.
  - Uses probability (`ENEMY_SPAWN_PROBABILITY`) to decide spawning.
  - Checks for minimum platform width (`MIN_PLATFORM_TILES_FOR_ENEMY`).
  - Calculates spawn position within platform boundaries (with padding).
  - Instantiates `Enemy` with necessary parameters (scene, position, boundaries).
- **Level Generator (`levelGenerator.ts`):**
  - Imported `generateEnemyForPlatform` and `Enemy` type.
  - Updated `GeneratedLevelData` interface to include `enemies: Enemy[]`.
  - Modified `generateLevel` function:
    - Initializes `generatedEnemies` array.
    - Calls `generateEnemyForPlatform` for each platform (skipping the first).
    - Pushes created enemies to the `generatedEnemies` array.
    - Returns `GeneratedLevelData` object including the `enemies` array.
    - Refactored crate generation to use default probability and skip first platform (consistent with enemies).
- **Game Scene (`GameScene.ts`):**
  - Imported `Enemy`, `Crate` types.
  - Updated `MappedSprite` type to include `Enemy` and `Crate`.
  - Added `enemies: Enemy[]` property.
  - Updated `create()` method:
    - Clears `enemies` array.
    - Calls `generateLevel` and stores returned `levelData`.
    - Assigns `levelData.enemies` to `this.enemies`.
    - Uses `levelData.playerSpawnPosition` for player creation and camera centering.
  - Updated `update()` method:
    - Iterates through `this.enemies` and calls `enemy.update()`.
  - Updated `processContactEvent()` method:
    - Added check for player-enemy contact (`userDataA?.type === "player" && otherUserData?.type === "enemy"`).
    - Calls `this.killPlayer()` upon player-enemy contact.
  - Updated `restart()` method:
    - Destroys existing enemies (`this.enemies.forEach(e => e.destroy())`) before regenerating.
    - Clears coin group (`this.coins.clear(true, true)`).
    - Clears non-player entries from `bodyIdToSpriteMap`.
    - Calls `generateLevel` again to get new elements.
    - Stores newly generated `levelData.enemies`.
    - Updates player `startPosition` before calling `player.reset()`.

## 3. Next Steps

1.  **Test Enemy Implementation:** Run the game to verify:
    - Enemies spawn on platforms (not the first one) based on probability and platform size.
    - Enemies patrol back and forth within their platform boundaries.
    - Enemy sprites flip correctly when changing direction.
    - Player dies upon contacting an enemy.
    - Enemies are correctly removed and regenerated when the game restarts.
2.  **Implement Finish Entity:** Create `Finish.ts` and generation logic.
3.  **Refine Level Generation:** Ensure solvability, potentially refine enemy/crate placement.
4.  **Implement Player-Finish Collision:** Add logic in `GameScene`.
5.  **Complete UI Functionality:** Start/reset logic.
6.  **Continue TypeScript Transition:** Incrementally convert remaining JS files and add types.
7.  **Testing and Polishing:** General bug fixing and refinement.

## 4. Active Decisions and Considerations

- Enemies use dynamic Box2D bodies with fixed rotation.
- Enemy speed is derived from player speed.
- Enemy patrolling is constrained by platform boundaries passed during instantiation.
- Player-enemy collision results in immediate player death.
- Game restart involves destroying old enemies/coins and regenerating the level layout.

## 5. Important Patterns and Preferences

- Keep core logic (like level generation, including `enemyGenerator.ts`) in separate, reusable modules within `src/lib`.
- Use `gameState` for managing global game state variables like score.
- Entities manage their own physics bodies and state.
- Use Box2D contact listeners for interactions (player-coin, player-enemy, etc.).
- Restart logic favors regenerating dynamic elements within the existing physics world rather than full scene/world recreation.

## 6. Learnings and Project Insights

- Implementing patrolling AI requires passing boundary information to the entity.
- Calculating entity properties (like speed) based on other constants (`PHYSICS.PLAYER.SPEED`) maintains consistency.
- Collision handling logic needs specific checks for different entity types (`userData.type`).
- Restarting procedural levels requires careful management of existing entities (destroying old ones before creating new ones) to avoid duplicates or stale references.
