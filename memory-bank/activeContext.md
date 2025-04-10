# Active Context: DuckIt - Level Gen Refactor & Collision

## 1. Current Work Focus

The primary focus is on implementing core gameplay features, starting with Box2D collision handling for coin collection, and ensuring the recently refactored level generation modules work correctly.

## 2. Recent Changes

- Refactored platform generation logic from `GameScene.ts` into `vite-template/src/lib/levelGenerator.ts`.
- Implemented basic procedural platform generation (multiple platforms with gaps) in `levelGenerator.ts`.
- Removed incorrect Matter.js collision setup from `GameScene.ts`.
- Created `Coin.ts` entity with sprite, physics sensor (Box2D), and basic `collect` method.
- Added `coins` counter and `incrementCoins` method to `gameState.ts`.
- Added coin asset constants to `constants.ts`.
- Updated `levelGenerator.ts` to place `Coin` instances on generated platforms.
- Fixed various import order and linter issues in `GameScene.ts` and `levelGenerator.ts`.
- Addressed issues with player physics initialization related to the game starting in a paused state (requires user interaction with start screen).
- Fixed UI layering issue by explicitly setting depth (`setDepth(100)`) on UI elements (`CoinCounter`, `GameStartScreen`, `GameOverOverlay`, `MobileControls`) in `GameScene.ts` to ensure they render above the player.
- Refactored `GameOverOverlay.ts` to create its image element in the constructor for reliable depth setting.
- **Refactored `levelGenerator.ts` into smaller, dedicated modules:**
  - `platformGenerator.ts`: Handles creating individual platforms.
  - `coinGenerator.ts`: Handles placing coins on platforms.
  - `gapGenerator.ts`: Handles calculating gaps between platforms.
  - The main `levelGenerator.ts` now orchestrates calls to these modules.

## 3. Next Steps

1.  **Test Refactored Level Generation:** Run the game to verify:
    - Player physics are active after starting the game.
    - Multiple platforms with gaps are generated correctly using the new modules.
    - Coins are visible on the platforms.
    - UI elements (Counter, Start/Game Over, Controls) render _above_ the player.
2.  **Implement Box2D Collision Handling:** Set up a contact listener in `GameScene.ts` (or a dedicated physics manager) to handle collisions between the player and coins (triggering `coin.collect()`).
3.  **Update Coin Counter UI:** Connect the `gameState.coins` value to the `CoinCounter` UI element so it updates visually.
4.  **Continue TypeScript Transition:** Incrementally convert remaining JS files and add types.
5.  **Implement Other Entities:** Add Crates and Enemies as per PRD.

## 4. Active Decisions and Considerations

- Level generation logic is now separated into smaller, focused modules for better organization and reusability.
- Coins use Box2D sensors for collection detection.
- `gameState` manages the coin count.
- Need to implement Box2D contact listeners for interactions (player-coin, player-enemy, etc.) instead of Phaser's Matter integration.
- UI elements require explicit `setDepth` to ensure correct rendering order.

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
