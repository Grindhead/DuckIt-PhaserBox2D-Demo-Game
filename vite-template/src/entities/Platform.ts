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
  b2CreateBody,
  b2MakeBox,
  b2CreatePolygonShape,
  b2Vec2,
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

    // Get world ID from game state
    const worldId = gameState.worldId;
    if (!worldId) {
      console.error("Platform: No physics world found!");
      return;
    }

    // Create body definition
    const bodyDef = {
      ...b2DefaultBodyDef(),
      type: STATIC,
      position: new b2Vec2(centerX / PHYSICS.SCALE, -centerY / PHYSICS.SCALE), // Convert to Box2D coordinates
    };

    // Create the body
    const bodyId = b2CreateBody(worldId, bodyDef);
    if (!bodyId) {
      console.error("Platform: Failed to create physics body");
      return;
    }

    console.log("Platform physics body created with ID:", bodyId);

    // Create shape definition
    const shapeDef = {
      ...b2DefaultShapeDef(),
      density: 0, // Static bodies have 0 density
      friction: PHYSICS.PLATFORM.FRICTION,
      restitution: 0, // No bounce
      userData: { type: "platform" }, // Important for collision identification
      isSensor: false, // Explicitly ensure it's not a sensor
      enableContactEvents: true, // Enable contact events for the platform
      filter: b2DefaultFilter(),
    };

    // Create box shape with proper scaling for Box2D (in meters)
    const halfWidth = width / (2 * PHYSICS.SCALE);
    // Make the collision box slightly taller to improve collision detection
    const halfHeight = (tileHeight + 4) / (2 * PHYSICS.SCALE);

    // Create the box shape
    const box = b2MakeBox(halfWidth, halfHeight);
    const shapeId = b2CreatePolygonShape(bodyId, shapeDef, box);

    // Log shape ID to ensure it's created
    console.log("Platform physics body created:", {
      shapeId,
      bodyId,
      centerX,
      centerY,
      width,
      height: tileHeight + 4, // Actual collision height is slightly taller
      box2dHalfWidth: halfWidth,
      box2dHalfHeight: halfHeight,
      box2dPosition: `${centerX / PHYSICS.SCALE}, ${-centerY / PHYSICS.SCALE}`,
      scale: PHYSICS.SCALE,
      isSensor: shapeDef.isSensor,
      enableContactEvents: shapeDef.enableContactEvents,
      friction: shapeDef.friction,
      userDataType: shapeDef.userData.type,
    });

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
