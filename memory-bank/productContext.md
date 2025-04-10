# Product Context: DuckIt

## 1. Problem Statement

There is a desire for a simple, classic-style 2D platformer game with physics elements that can be played casually on both desktop and mobile devices. The game needs to be engaging through core platforming challenges, collection mechanics, and light puzzle elements.

## 2. Solution

DuckIt provides this experience by combining:

- Familiar platformer controls and objectives (reach the finish).
- Physics-based movement and interaction (Box2D).
- Procedurally generated levels for replayability.
- Core mechanics like jumping, collecting coins, avoiding enemies, and pushing crates.
- A lighthearted, cartoonish visual style.

## 3. How It Should Work (User Experience)

- **Intuitive Controls:** The player should immediately understand how to move (left/right arrows) and jump (up arrow). On mobile, on-screen buttons provide the same functionality.
- **Clear Objectives:** The goal is to navigate the level from left to right, collect coins, avoid hazards, and reach the finish entity.
- **Physics Interaction:** Pushing crates should feel natural. Jumping and movement should feel responsive but grounded in physics.
- **Progression:** The player progresses horizontally through the procedurally generated level.
- **Feedback:** Visual feedback is crucial. Animations clearly indicate the duck's state (idle, run, jump, fall, dead). Coins have collection animations. The finish entity animates upon activation.
- **Challenge:** The game should offer a medium difficulty, primarily through platforming challenges, enemy avoidance, and crate puzzles.
- **Reset:** Death or level completion results in a clear overlay (`start.png`), allowing the player to instantly restart the same procedurally generated level.
- **Responsiveness:** The game adapts its layout and controls (hiding/showing mobile buttons) based on the screen size.

## 4. User Experience Goals

- **Fun and Engaging:** Provide a classic platformer feel with satisfying physics.
- **Accessible:** Easy to pick up and play for casual gamers.
- **Replayable:** Procedural generation offers a new level layout each time.
- **Clear Feedback:** Ensure the player understands game states and interactions through visuals.
- **Smooth Performance:** Maintain 60fps for a fluid experience.
