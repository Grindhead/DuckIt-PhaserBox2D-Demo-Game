# Active Context: DuckIt - Crate Generation & Interaction

## 1. Current Work Focus

The primary focus is on testing the newly implemented Crate generation and interaction mechanics (pushing, boundary constraints) and then moving on to Box2D collision handling for coin collection.

## 2. Recent Changes

- Refactored `GameOverOverlay.ts` to create its image element in the constructor for reliable depth setting.
- Refactored `levelGenerator.ts` into smaller, dedicated modules (`platformGenerator.ts`, `coinGenerator.ts`, `gapGenerator.ts`).
- Updated `Crate.ts`:
  - Modified constructor to accept platform physics boundaries (`platformMinX`, `platformMaxX`) instead of `platformId`.
  - Added `halfWidthMeters` property.
  - Implemented logic in `update()` to check `platformMinX` and `platformMaxX` and prevent the crate from moving beyond these boundaries by adjusting velocity and position.
  - Added required imports (`b2Body_GetPosition`, `b2Body_GetLinearVelocity`).
- Updated `platformGenerator.ts`:
  - Added `physicsMinX` and `physicsMaxX` to the `GeneratedPlatform` interface.
  - Calculated and returned these values (scaled pixel coordinates) in `generatePlatform`.
  - Fixed import order.
- Added `WIDTH` and `HEIGHT` properties (pixels) to `ASSETS.CRATE.BIG` and `ASSETS.CRATE.SMALL` in `constants.ts`.
- Created `crateGenerator.ts`:
  - Defined `generateCratesForPlatform` function.
  - Takes platform boundaries, scene, and platform Y as input.
  - Uses probability to decide whether to place a crate.
  - Calculates spawn position (pixels) on the platform.
  - Instantiates `Crate` with correct size and platform boundaries.
  - Added basic check to avoid placing crates on very narrow platforms.
  - Fixed import order issues.
- Updated `levelGenerator.ts`:
  - Imported `generateCratesForPlatform`.
  - Called `generateCratesForPlatform` after generating subsequent platforms (but _not_ the first one) within the loop, passing necessary data (`scene`, `physicsMinX`, `physicsMaxX`, `platformY`).
  - Commented out the call to `generateCratesForPlatform` for the initial platform to provide a clear starting area.

## 3. Next Steps

1.  **Test Crate Functionality:** Run the game to verify:
    - Crates are generated probabilistically on platforms.
    - Crates have correct sizes (visual and physics density/mass).
    - Crates can be pushed by the player.
    - Crates stop at the edges of their platform and do not fall off.
2.  **Test Refactored Level Generation:** Verify:
    - Player physics are active after starting the game.
    - Multiple platforms with gaps are generated correctly using the new modules.
    - Coins are visible on the platforms.
    - UI elements (Counter, Start/Game Over, Controls) render _above_ the player.
3.  **Implement Box2D Collision Handling:** Set up a contact listener in `GameScene.ts` (or a dedicated physics manager) to handle collisions between the player and coins (triggering `coin.collect()`).
4.  **Update Coin Counter UI:** Connect the `gameState.coins` value to the `CoinCounter` UI element so it updates visually.
5.  **Continue TypeScript Transition:** Incrementally convert remaining JS files and add types.
6.  **Implement Other Entities:** Add Enemies as per PRD.

## 4. Active Decisions and Considerations

- Level generation logic is now separated into smaller, focused modules for better organization and reusability.
- Coins use Box2D sensors for collection detection.
- `gameState` manages the coin count.
- Need to implement Box2D contact listeners for interactions (player-coin, player-enemy, etc.) instead of Phaser's Matter integration.
- UI elements require explicit `setDepth` to ensure correct rendering order.
- Crates store their platform's horizontal boundaries (`physicsMinX`, `physicsMaxX`) directly to enforce movement constraints.
- Do not spawn crates on the initial platform.

## 5. Important Patterns and Preferences

- Keep core logic (like level generation) in separate, reusable modules within `src/lib`.
- Use `gameState` for managing global game state variables like score.
- Entities manage their own physics bodies and state (e.g., `Coin.isCollected`).

## 6. Learnings and Project Insights

- Linter rules for import order can be very specific and require careful manual adjustment.
- Physics simulation (`b2World_Step`) needs to be called explicitly in the game loop and is tied to the `gameState` (only runs when `isPlaying`).
- Separating concerns (like level generation) into smaller modules improves maintainability and testability.
- Box2D sensors are appropriate for non-physical collision detection (like coin pickup).
- Phaser's rendering order depends on creation order unless `setDepth` is used explicitly.
- Generating physics-based objects like crates requires careful calculation of spawn position relative to platforms and consideration of object dimensions (e.g., needing crate WIDTH/HEIGHT in `constants.ts`).
