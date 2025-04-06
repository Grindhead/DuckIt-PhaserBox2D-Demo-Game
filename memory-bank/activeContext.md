# Active Context: DuckIt - TypeScript Transition & Level Gen

## 1. Current Work Focus

The primary focus is transitioning the existing JavaScript codebase within `vite-template/src` to TypeScript and implementing core gameplay features, starting with level generation (platforms, coins) and physics setup.

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

## 3. Next Steps

1.  **Test Current Implementation:** Run the game to verify:
    - Player physics are active after starting the game.
    - Multiple platforms with gaps are generated.
    - Coins are visible on the platforms.
2.  **Implement Box2D Collision Handling:** Set up a contact listener in `GameScene.ts` (or a dedicated physics manager) to handle collisions between the player and coins (triggering `coin.collect()`).
3.  **Update Coin Counter UI:** Connect the `gameState.coins` value to the `CoinCounter` UI element so it updates visually.
4.  **Continue TypeScript Transition:** Incrementally convert remaining JS files and add types.
5.  **Implement Other Entities:** Add Crates and Enemies as per PRD.

## 4. Active Decisions and Considerations

- Level generation logic is now separated for better organization.
- Coins use Box2D sensors for collection detection.
- `gameState` manages the coin count.
- Need to implement Box2D contact listeners for interactions (player-coin, player-enemy, etc.) instead of Phaser's Matter integration.

## 5. Important Patterns and Preferences

- Keep core logic (like level generation) in separate, reusable modules within `src/lib`.
- Use `gameState` for managing global game state variables like score.
- Entities manage their own physics bodies and state (e.g., `Coin.isCollected`).

## 6. Learnings and Project Insights

- Linter rules for import order can be very specific and require careful manual adjustment.
- Physics simulation (`b2World_Step`) needs to be called explicitly in the game loop and is tied to the `gameState` (only runs when `isPlaying`).
- Separating concerns (like level generation) improves maintainability.
- Box2D sensors are appropriate for non-physical collision detection (like coin pickup).
