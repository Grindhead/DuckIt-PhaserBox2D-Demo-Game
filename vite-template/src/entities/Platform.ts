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
  b2CreateBody,
  b2MakeBox,
  b2CreatePolygonShape,
  b2Vec2,
  AddSpriteToWorld,
  b2Body_EnableSleep,
  b2Body_SetAwake,
  b2Body_IsAwake,
} from "@PhaserBox2D";
import GameScene from "@scenes/GameScene"; // Import GameScene for type hinting

export default class Platform {
  scene: GameScene;
  /** Box2D body identifier */
  bodyId: ReturnType<typeof b2CreateBody> | null = null;
  /** Box2D shape identifier */
  shapeId: ReturnType<typeof b2CreatePolygonShape> | null = null;
  platformSprites: Phaser.GameObjects.Image[] = [];
  /** Width of the platform in pixels */
  width: number = 0;
  /** Height of the platform in pixels */
  height: number = 0;
  /** Center X position of the platform in pixels */
  centerX: number = 0;
  /** Center Y position of the platform in pixels */
  centerY: number = 0;

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
    this.width = width;
    this.centerX = centerX;
    this.centerY = centerY;

    // --- Physics Body Creation ---
    const tileHeight = this.scene.textures.getFrame(
      ASSETS.ATLAS,
      ASSETS.PLATFORM.MIDDLE
    ).height;
    this.height = tileHeight;

    // Get world ID from game state
    const worldId = gameState.worldId;
    // Calculate offset for better collision detection
    // Move the collision box slightly upward to create a better surface for the player
    const offsetY = (tileHeight * 0.25) / PHYSICS.SCALE; // Increased offset for better top collision

    // Create body definition with the position offset applied directly
    const bodyDef = {
      ...b2DefaultBodyDef(),
      type: STATIC,
      // Apply offset to the body position itself
      position: new b2Vec2(
        centerX / PHYSICS.SCALE,
        -centerY / PHYSICS.SCALE + offsetY
      ),
      fixedRotation: true, // Prevent rotation of the platform
      allowSleep: true, // Allow platforms to sleep when not visible
    };

    // Create the body
    const bodyId = b2CreateBody(worldId, bodyDef);
    this.bodyId = bodyId;

    // Create shape definition with high friction
    const shapeDef = {
      ...b2DefaultShapeDef(),
      density: 0, // Static bodies have 0 density
      friction: 5.0, // Higher friction for better stability
      restitution: 0.0, // No bounce at all
      userData: { type: "platform" }, // Important for collision identification
      isSensor: false, // Explicitly ensure it's not a sensor
      enableContactEvents: true, // Enable contact events for the platform
      filter: b2DefaultFilter(),
    };

    // Create box shape with proper scaling for Box2D (in meters)
    const halfWidth = width / (2 * PHYSICS.SCALE);

    // Increase the collision height to prevent tunneling
    // Use a more moderate height scale to avoid over-extension
    const heightScale = 1.2; // Slightly smaller height scale to focus on top surface
    const halfHeight = (tileHeight * heightScale) / (2 * PHYSICS.SCALE);

    // Create a standard box shape (no offset in the shape itself)
    const box = b2MakeBox(halfWidth, halfHeight);

    // Create the physics shape
    const shapeId = b2CreatePolygonShape(bodyId, shapeDef, box);
    this.shapeId = shapeId;
    // --- Visual Tiling ---
    const tileWidth = this.scene.textures.getFrame(
      ASSETS.ATLAS,
      ASSETS.PLATFORM.MIDDLE
    ).width;
    const startX = centerX - width / 2; // Left edge of the platform

    // Create a base sprite for physics visualization (will be invisible)
    // This sprite will be connected to the physics body
    const physicsSprite = this.scene.add.sprite(centerX, centerY, "__WHITE");
    physicsSprite.setVisible(false); // Hide the sprite
    physicsSprite.setScale(width / 32, (tileHeight * heightScale) / 32); // Match the physics body dimensions

    // Connect the physics body to this sprite
    AddSpriteToWorld(worldId, physicsSprite, { bodyId });

    // Add left edge sprite
    const leftSprite = this.scene.add.image(
      startX + tileWidth / 2, // Center of the left tile
      centerY,
      ASSETS.ATLAS,
      ASSETS.PLATFORM.LEFT
    );
    this.platformSprites.push(leftSprite);

    // Add middle sprites
    let currentTileX = startX + tileWidth;
    for (let i = 0; i < middleTileCount; i++) {
      const middleSprite = this.scene.add.image(
        currentTileX + tileWidth / 2, // Center of the current middle tile
        centerY,
        ASSETS.ATLAS,
        ASSETS.PLATFORM.MIDDLE
      );
      this.platformSprites.push(middleSprite);
      currentTileX += tileWidth;
    }

    // Add right edge sprite
    const rightSprite = this.scene.add.image(
      currentTileX + tileWidth / 2, // Center of the right tile
      centerY,
      ASSETS.ATLAS,
      ASSETS.PLATFORM.RIGHT
    );
    this.platformSprites.push(rightSprite);

    // Enable sleep for this platform body
    if (this.bodyId) {
      b2Body_EnableSleep(this.bodyId, true);
    }
  }

  /**
   * Checks if the platform is visible to the camera.
   *
   * @returns True if the platform is visible to the camera, false otherwise.
   */
  isVisibleToCamera(): boolean {
    if (!this.scene || !this.scene.cameras || !this.scene.cameras.main) {
      return true; // Default to visible if we can't check
    }

    const camera = this.scene.cameras.main;

    // Get camera bounds
    const cameraBounds = {
      left: camera.scrollX,
      right: camera.scrollX + camera.width,
      top: camera.scrollY,
      bottom: camera.scrollY + camera.height,
    };

    // Calculate platform bounds
    const platformBounds = {
      left: this.centerX - this.width / 2,
      right: this.centerX + this.width / 2,
      top: this.centerY - this.height / 2,
      bottom: this.centerY + this.height / 2,
    };

    // Check if platform is visible (overlaps with camera)
    return !(
      platformBounds.right < cameraBounds.left ||
      platformBounds.left > cameraBounds.right ||
      platformBounds.bottom < cameraBounds.top ||
      platformBounds.top > cameraBounds.bottom
    );
  }

  /**
   * Updates the platform's sleep state based on visibility.
   * Platforms not visible to the camera will be put to sleep for performance.
   */
  updateSleepState(): boolean {
    if (!this.bodyId) return false;

    const isVisible = this.isVisibleToCamera();

    // Set awake or asleep based on visibility
    b2Body_SetAwake(this.bodyId, isVisible);

    return isVisible;
  }

  /**
   * Checks if the platform's physics body is currently awake.
   *
   * @returns True if the physics body is awake, false if asleep.
   */
  isAwake(): boolean {
    if (!this.bodyId) return true; // Default to awake if no body
    return b2Body_IsAwake(this.bodyId);
  }
}
