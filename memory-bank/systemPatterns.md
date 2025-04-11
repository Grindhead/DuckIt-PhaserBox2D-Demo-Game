# System Patterns: DuckIt

## 1. System Architecture

DuckIt employs a standard Phaser 3 game structure, enhanced with Box2D for physics.

```mermaid
flowchart TD
    User --> Input[Input Handling (Keyboard/Touch)]
    Input --> GameScene[Game Scene]
    GameScene --> Player[Player Logic]
    GameScene --> LevelGenOrchestrator[Level Generation Orchestrator (levelGenerator.ts)]
    LevelGenOrchestrator --> PlatformGen[Platform Generator (platformGenerator.ts)]
    LevelGenOrchestrator --> CoinGen[Coin Generator (coinGenerator.ts)]
    LevelGenOrchestrator --> CrateGen[Crate Generator (crateGenerator.ts)]
    LevelGenOrchestrator --> GapGen[Gap Generator (gapGenerator.ts)]
    LevelGenOrchestrator --> EnemyGen[Enemy Generator (enemyGenerator.ts)]
    PlatformGen --> Entities[Entity Management (Platforms)]
    CoinGen --> Entities[Entity Management (Coins)]
    CrateGen --> Entities[Entity Management (Crates)]
    EnemyGen --> Entities
    GameScene --> Entities[Entity Management (Enemies, Finish)]
    GameScene --> Physics[Physics Engine (Box2D via PhaserBox2D.js)]
    GameScene --> Renderer[Phaser Renderer]

    Player --> Physics
    Entities --> Physics
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
  - `Game`: Contains core gameplay logic, physics world setup, entity management, UI, and orchestrates level generation.
- **Physics:** Integrated via `PhaserBox2D.js`. Handles collisions (via contact listeners), movement constraints (player, crates, enemies), player grounding (on platforms and crates, with a small stabilization impulse applied only for platform contacts; infers bottom contact if normal is missing but velocity is low), and interactions (coin collection, enemy contact, finish activation).
- **Entity Management:** The `Game` scene manages all game objects (player, platforms, crates, coins, enemies, finish). Entities are created either directly or via the level generation modules (`platformGenerator`, `coinGenerator`, `crateGenerator`, `enemyGenerator`).
- **Level Generation:** A modular approach orchestrated by `levelGenerator.ts`, which uses `platformGenerator.ts`, `coinGenerator.ts`, `crateGenerator.ts`, `enemyGenerator.ts`, and `gapGenerator.ts` to create the level layout (platforms, coins, crates, enemies) according to PRD rules. Crate and enemy generation intentionally skips the first platform. Logic for placing the finish entity will be added later.
- **Rendering:** Handled by Phaser's rendering engine.
- **Input:** Managed by Phaser's input system, mapped to player actions.
- **Camera:** Phaser's camera follows the player with subtle easing.

## 2. Key Technical Decisions

- **Phaser + Box2D:** Chosen combination for 2D game development with robust physics.
- **Vite:** Selected for fast development builds and optimized production builds.
- **TypeScript:** Transitioning to TypeScript for improved type safety and maintainability.
- **Texture Atlas:** Using a single atlas optimizes asset loading and rendering performance.
- **Procedural Generation:** Provides replayability without needing pre-designed levels.
- **Modular Level Generation:** Separating level generation logic into focused modules (`platformGenerator.ts`, `coinGenerator.ts`, `crateGenerator.ts`, `enemyGenerator.ts`, `gapGenerator.ts`) enhances organization.
- **`PhaserBox2D.js`:** Specific requirement for integrating Box2D.

## 3. Design Patterns in Use

- **Scene Management:** Phaser's built-in scene manager organizes game flow.
- **State Pattern:** Player character uses states (`Idle`, `Run`, `Jump`, `Fall`, `Dead`). The finish entity also uses states. State transitions are handled in the Player's `update` method based on `isGrounded`, velocity checks, and animation events (for Jump->Fall transition).
- **Entity Component System (Implicit):** Phaser's GameObjects with physics bodies and custom logic.
- **Observer Pattern:** Used for animation events (e.g., `ANIMATION_COMPLETE` for Player Jump->Fall transition).
- **Module Pattern:** Level generation logic is broken down into distinct, reusable modules (`platformGenerator`, `coinGenerator`, `crateGenerator`, `enemyGenerator`, `gapGenerator`).
- **Factory Pattern (Implicit):** Functions within modules (`generatePlatform`, `generateCoins`, `generateCratesForPlatform`, `generateEnemyForPlatform`) create entity instances.

## 4. Component Relationships

- The `Game` scene is the central coordinator.
- The `PhaserBox2D` world interacts with all physics-enabled entities.
- Player input affects the player entity.
- Box2D collision/sensor contacts trigger game logic (managed in `GameScene.processContactEvent` and `GameScene.processPhysicsEvents`), including player grounding (on platforms/crates), coin collection, and death sensor activation.
- The `levelGenerator.ts` orchestrates calls to the `platformGenerator`, `coinGenerator`, `crateGenerator`, `enemyGenerator`, and `gapGenerator` modules.
- These generator modules create platform, coin, crate, and enemy entities and return data needed for further generation steps (e.g., platform boundaries).
- The `crateGenerator` and `enemyGenerator` use platform boundary data (from `platformGenerator` via `levelGenerator`) to instantiate `Crate` and `Enemy` entities correctly.

## 5. Critical Implementation Paths

1.  Project Setup (Done)
2.  Scene Flow (Done)
3.  Physics World Setup (Partial - Box2D config done, listeners pending)
4.  Player Implementation (Partial)
5.  Platform Implementation (Done - via `platformGenerator.ts`)
6.  Level Generation Orchestration (Done - `levelGenerator.ts` refactored)
7.  Core Entities (Partial - Coins done via `coinGenerator.ts`, Crates via `crateGenerator.ts`, Enemies via `enemyGenerator.ts`, others pending)
8.  Interaction Logic (Pending - Collision listeners, Crate boundary logic [Partial], Enemy collision)
9.  UI & Camera (Partial)
10. Responsiveness (Pending)
11. TypeScript Transition (Ongoing)
