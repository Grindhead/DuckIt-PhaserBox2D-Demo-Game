# System Patterns: DuckIt

## 1. System Architecture

DuckIt employs a standard Phaser 3 game structure, enhanced with Box2D for physics.

```mermaid
flowchart TD
    User --> Input[Input Handling (Keyboard/Touch)]
    Input --> GameScene[Game Scene]
    GameScene --> Player[Player Logic]
    GameScene --> LevelGen[Level Generation]
    GameScene --> Entities[Entity Management (Crates, Coins, Enemies, Finish)]
    GameScene --> Physics[Physics Engine (Box2D via PhaserBox2D.js)]
    GameScene --> Renderer[Phaser Renderer]

    Player --> Physics
    Entities --> Physics
    LevelGen --> Entities
    Physics --> GameScene
    Renderer --> Display[Screen]

    subgraph Phaser Scenes
        BootScene[Boot Scene] --> PreloaderScene[Preloader Scene]
        PreloaderScene --> GameScene
    end

    GameScene --> Camera[Camera Control]
    Camera --> Player
```

- **Scenes:** Follows the `Boot` -> `Preloader` -> `Game` flow.
  - `Boot`: Basic setup (scaling, background).
  - `Preloader`: Asset loading (texture atlas).
  - `Game`: Contains all gameplay logic, physics world setup, entity creation, level generation, and UI.
- **Physics:** Integrated via `PhaserBox2D.js`. Handles collisions, movement constraints (player, crates, enemies), and interactions (coin collection, enemy contact, finish activation).
- **Entity Management:** The `Game` scene manages all game objects (player, platforms, crates, coins, enemies, finish).
- **Level Generation:** A procedural algorithm within the `Game` scene creates the level layout, placing platforms, crates, enemies, coins, and the finish entity according to PRD rules.
- **Rendering:** Handled by Phaser's rendering engine.
- **Input:** Managed by Phaser's input system, mapped to player actions.
- **Camera:** Phaser's camera follows the player with subtle easing.

## 2. Key Technical Decisions

- **Phaser + Box2D:** Chosen combination for 2D game development with robust physics.
- **Vite:** Selected for fast development builds and optimized production builds.
- **Texture Atlas:** Using a single atlas optimizes asset loading and rendering performance.
- **Procedural Generation:** Provides replayability without needing pre-designed levels.
- **`PhaserBox2D.js`:** Specific requirement for integrating Box2D.

## 3. Design Patterns in Use

- **Scene Management:** Phaser's built-in scene manager organizes game flow.
- **State Pattern:** Player character uses states (`Idle`, `Run`, `Jump`, `Fall`, `Dead`) managed through animation changes and physics updates.
  The finish entity also uses states (`Idle`, `Activated`, `Active`).
- **Entity Component System (Implicit):** While not strictly ECS, Phaser's GameObjects (Sprites, Images) with added physics bodies and custom logic resemble an entity-based approach.
- **Observer Pattern:** Animation events (`Phaser.Animations.Events`) are used to trigger state changes or actions upon animation completion.
- **Factory Pattern (Implicit):** Functions will likely be used within the `Game` scene to create instances of different game entities (e.g., `createPlatform`, `createEnemy`).

## 4. Component Relationships

- The `Game` scene is the central coordinator.
- The `PhaserBox2D` world interacts with all physics-enabled entities.
- Player input directly affects the player entity's physics body and state.
- Collision/Sensor contacts detected by Box2D trigger game logic (coin collection, death, finish activation) within the `Game` scene's update loop or collision handlers.
- The level generation logic dictates the initial placement and configuration of platforms, entities, and puzzles.

## 5. Critical Implementation Paths

1.  **Project Setup:** Initialize Vite, install Phaser, integrate `PhaserBox2D.js`.
2.  **Scene Flow:** Implement `Boot`, `Preloader` (asset loading), and basic `Game` scene structure.
3.  **Physics World:** Configure the Box2D world within the `Game` scene.
4.  **Player Implementation:** Create the player sprite, define animations, implement physics-based movement (run, jump), handle state transitions, and integrate controls.
5.  **Platform Implementation:** Create static platform bodies using tiling.
6.  **Level Generation:** Develop the procedural algorithm to place platforms ensuring playability (respecting jump height and crate usage).
7.  **Core Entities:** Implement crates (pushable, 2:1 mass ratio, puzzle mechanics), enemies (patrolling at 80% player speed, physics), coins (sensors, collection), and the finish entity (sensor, state changes).
8.  **Interaction Logic:** Implement collision handling for player-enemy, player-coin, player-finish interactions, and the death sensor.
9.  **UI & Camera:** Add the coin counter, start/reset overlay, and camera follow logic (with easing).
10. **Responsiveness:** Ensure the game scales and controls adapt correctly.
