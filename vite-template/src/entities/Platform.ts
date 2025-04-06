/**
 * @file Platform.ts
 * @description Represents a composite platform entity with a single physics body
 * and tiled visual representation.
 */

import { ASSETS, PHYSICS } from "@constants";
import { gameState } from "@gameState";
import {
  STATIC,
  b2DefaultBodyDef,
  b2DefaultShapeDef,
  b2DefaultFilter,
  pxmVec2,
  SpriteToBox,
  pxm,
  b2Shape_GetUserData,
} from "@PhaserBox2D";
import GameScene from "@scenes/GameScene"; // Import GameScene for type hinting

export default class Platform {
  scene: GameScene;

  /**
   * Creates a composite platform entity.
   *
   * @param scene The GameScene instance.
   * @param centerX The center x position of the entire platform in pixels.
   * @param centerY The center y position of the entire platform in pixels.
   * @param width The total width of the platform in pixels.
   * @param middleTileCount The number of middle section tiles.
   */
  constructor(
    scene: GameScene,
    centerX: number,
    centerY: number,
    width: number,
    middleTileCount: number
  ) {
    this.scene = scene;

    // --- Physics Body Creation ---
    const tileHeight = this.scene.textures.getFrame(
      ASSETS.ATLAS,
      ASSETS.PLATFORM.MIDDLE
    ).height;

    // Adjust collision box size to match the platform dimensions
    // For Box2D, we need half-widths, but for SpriteToBox we'll use the actual dimensions
    const hx = width / 2; // Half-width in pixels
    const hy = tileHeight / 2; // Half-height in pixels

    const bodyDef = {
      ...b2DefaultBodyDef(),
      type: STATIC,
      position: pxmVec2(centerX, -centerY),
    };

    console.log("Platform physics body:", {
      centerX,
      centerY,
      width,
      height: tileHeight,
      halfWidth: hx,
      halfHeight: hy,
      box2dPosition: `${pxm(centerX)}, ${pxm(-centerY)}`,
      negatedY: -centerY,
    });

    // Create a temporary, invisible rectangle at the center as our physics template
    const tempRect = this.scene.add.rectangle(
      centerX,
      centerY,
      width,
      tileHeight
    );
    tempRect.setVisible(false); // Make it invisible

    // Define the shape explicitly for solid collision detection
    const shapeDef = {
      ...b2DefaultShapeDef(),
      density: 0, // Static bodies have 0 density
      friction: PHYSICS.PLATFORM.FRICTION,
      restitution: 0,
      userData: { type: "platform" },
      isSensor: false, // Explicitly set to false
      enableContactEvents: true, // Enable contact events for the platform
      filter: b2DefaultFilter(),
    };

    // Create the physics body with the exact dimensions of the platform
    const bodyResult = SpriteToBox(gameState.worldId, tempRect, {
      bodyDef,
      shapeDef: shapeDef,
    });

    // Remove temporary rectangle after physics creation
    tempRect.destroy();

    // Log created shape details
    if (bodyResult?.shapeId) {
      b2Shape_GetUserData(bodyResult.shapeId);
    }

    // --- Visual Tiling ---
    const tileWidth = this.scene.textures.getFrame(
      ASSETS.ATLAS,
      ASSETS.PLATFORM.MIDDLE
    ).width;
    const startX = centerX - width / 2; // Left edge of the platform

    // Add left edge sprite
    this.scene.add.image(
      startX + tileWidth / 2, // Center of the left tile
      centerY,
      ASSETS.ATLAS,
      ASSETS.PLATFORM.LEFT
    );

    // Add middle sprites
    let currentTileX = startX + tileWidth;
    for (let i = 0; i < middleTileCount; i++) {
      this.scene.add.image(
        currentTileX + tileWidth / 2, // Center of the current middle tile
        centerY,
        ASSETS.ATLAS,
        ASSETS.PLATFORM.MIDDLE
      );
      currentTileX += tileWidth;
    }

    // Add right edge sprite
    this.scene.add.image(
      currentTileX + tileWidth / 2, // Center of the right tile
      centerY,
      ASSETS.ATLAS,
      ASSETS.PLATFORM.RIGHT
    );

    // The individual visual tiles are added directly to the scene.
    // We don't need to manage them further within this class unless
    // platforms needed to be destroyed or manipulated later.
  }
}
