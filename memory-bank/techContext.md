# Tech Context: DuckIt

## 1. Technologies Used

- **Game Framework:** Phaser (version specified by project setup, likely Phaser 3)
- **Physics Engine:** Box2D (integrated via `src/PhaserBox2D.js`)
- **Build Tool:** Vite
- **Language:** JavaScript (ES6+)
- **Asset Packer:** Texture Packer (Phaser 3 JSON Hash format)
- **Version Control:** Git

## 2. Development Setup

- **IDE:** Cursor with Gemini 2.5 Pro LLM integration.
- **Node.js/npm:** Required for Vite and dependency management.
- **Development Server:** Provided by Vite (e.g., `npm run dev`).
- **Build Process:** Handled by Vite (e.g., `npm run build`).

## 3. Technical Constraints

- **Physics:** Must use the provided `src/PhaserBox2D.js` for Box2D integration.
- **Assets:** Must use the single texture atlas (`assets.png`, `assets.json`) for all game assets.
- **Animations:** Must be controlled via `Phaser.Animations.Events`; do not use the `duration` property. Target 30fps for all animations.
- **Performance:** Must maintain 60fps.
- **Responsiveness:** The game canvas must adapt to different screen sizes.
- **No Sound:** The game explicitly excludes sound effects and music.

## 4. Dependencies

- Phaser
- `src/PhaserBox2D.js` (and its Box2D dependency)
- Vite
- (Any other dependencies added during setup, managed via `package.json`)

## 5. Tool Usage Patterns

- **Vite:** Used for project scaffolding, development server, and production builds.
- **Texture Packer:** Used externally to generate the texture atlas from source PNGs in the `assets` folder.
- **Git:** Used for version control throughout development.
- **Cursor/Gemini:** Used for code generation, documentation, and pair programming.
