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
    const hx = pxm(width / 2);
    const hy = pxm(tileHeight / 2);

    const bodyDef = {
      ...b2DefaultBodyDef(),
      type: STATIC,
      position: pxmVec2(centerX, centerY),
    };

    // Create a temporary, invisible rectangle at the center for SpriteToBox
    // Its dimensions don't affect the physics body due to explicit boxSize
    const tempRect = this.scene.add.rectangle(
      centerX,
      centerY,
      width,
      tileHeight
    );
    tempRect.setVisible(false); // Make it invisible

    // Define the shape explicitly to ensure it's not a sensor
    const shapeDef = {
      ...b2DefaultShapeDef(), // Start with defaults
      density: 0, // Static bodies have 0 density
      friction: PHYSICS.PLATFORM.FRICTION,
      restitution: 0,
      userData: { type: "platform" },
      isSensor: false, // Explicitly set to false
      enableContactEvents: true, // Enable contact events for the platform
      filter: b2DefaultFilter(), // Explicitly set default filter
    };

    // Create the single physics body using the temporary rectangle
    const bodyResult = SpriteToBox(gameState.worldId, tempRect, {
      bodyDef,
      boxSize: { hx, hy },
      shapeDef: shapeDef,
    });

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
