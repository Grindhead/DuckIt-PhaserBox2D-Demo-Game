# Tech Context: DuckIt

## 1. Technologies Used

- **Game Framework:** Phaser (version specified by project setup, likely Phaser 3)
- **Physics Engine:** Box2D (integrated via `src/PhaserBox2D.js`)
- **Build Tool:** Vite
- **Language:** TypeScript
- **Asset Packer:** Texture Packer (Phaser 3 JSON Hash format)
- **Version Control:** Git
- **Type Definitions:**
  - Phaser: Bundled with the library.
  - Box2D: Custom definitions provided in `types` directory.

## 2. Development Setup

- **IDE:** Cursor with Gemini 2.5 Pro LLM integration.
- **Node.js/npm:** Required for Vite and dependency management.
- **TypeScript Compiler:** `tsc` (via `npm` scripts or IDE integration).
- **Development Server:** Provided by Vite (e.g., `npm run dev`).
- **Build Process:** Handled by Vite (e.g., `npm run build`), to be updated to include type checking.

## 3. Technical Constraints

- **Physics:** Must use the provided `src/PhaserBox2D.js` for Box2D integration (imported into TS using `allowJs`).
- **Assets:** Must use the single texture atlas (`assets.png`, `assets.json`) for all game assets.
- **Animations:** Must be controlled via `Phaser.Animations.Events`; do not use the `duration` property. Target 30fps for all animations.
- **Performance:** Must maintain 60fps.
- **Responsiveness:** The game canvas must adapt to different screen sizes.
- **No Sound:** The game explicitly excludes sound effects and music.
- **Type Safety:** Aim for strong type coverage using TypeScript.

## 4. Dependencies

- Phaser
- `src/PhaserBox2D.js` (and its Box2D dependency)
- Vite
- TypeScript
- `@types/node`
- (Any other dependencies added during setup, managed via `vite-template/package.json`)

## 5. Tool Usage Patterns

- **Vite:** Used for project scaffolding, development server, and production builds.
- **TypeScript (`tsc`):** Used for static type checking (`tsconfig.json` configured).
- **Texture Packer:** Used externally to generate the texture atlas from source PNGs in the `assets` folder.
- **Git:** Used for version control throughout development.
- **Cursor/Gemini:** Used for code generation, refactoring (JS to TS), documentation, and pair programming.

## 6. Physics Tuning (Added Section)

- `PHYSICS.PLAYER.JUMP_THRESHOLD` in `constants.ts` was increased from 0.5 to 1.0 to attempt to resolve animation issues when landing on dynamic crates.
