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
  b2DestroyBody,
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
  /** Flag for combined platform mode */
  isCombinedPlatform: boolean = false;
  /** Physics body has been created */
  physicsCreated: boolean = false;
  /** Physics debug sprite for visualization */
  physicsSprite: Phaser.GameObjects.Sprite | null = null;
  /** Segments data for combined platforms */
  segments: Array<{
    centerX: number;
    centerY: number;
    width: number;
    middleTileCount: number;
  }> = [];

  /**
   * Creates a composite platform entity.
   *
   * @param scene The GameScene instance.
   * @param centerX The center x position of the entire platform in pixels.
   * @param centerY The center y position of the entire platform in pixels.
   * @param width The total width of the platform in pixels.
   * @param middleTileCount The number of middle section tiles.
   * @param isCombinedPlatform If true, creates a container for multiple platform segments.
   */
  constructor(
    scene: GameScene,
    centerX: number,
    centerY: number,
    width: number,
    middleTileCount: number,
    isCombinedPlatform: boolean = false
  ) {
    this.scene = scene;
    this.width = width;
    this.centerX = centerX;
    this.centerY = centerY;
    this.isCombinedPlatform = isCombinedPlatform;

    // For combined platforms, just store the base data without creating physics yet
    if (isCombinedPlatform) {
      // Store properties but don't create physics or visuals yet
      // These will be added with addPlatformSegment()
      return;
    }

    // For single platforms, proceed with normal creation
    this.createPlatformSegment(centerX, centerY, width, middleTileCount);
  }

  /**
   * Creates a physical platform segment with visuals.
   *
   * @param centerX The center x position of the segment in pixels.
   * @param centerY The center y position of the segment in pixels.
   * @param width The width of the segment in pixels.
   * @param middleTileCount The number of middle section tiles.
   */
  private createPlatformSegment(
    centerX: number,
    centerY: number,
    width: number,
    middleTileCount: number
  ): void {
    // --- Physics Body Creation ---
    const tileHeight = this.scene.textures.getFrame(
      ASSETS.ATLAS,
      ASSETS.PLATFORM.MIDDLE
    ).height;
    this.height = tileHeight;

    // Create the physics body if it hasn't been created yet
    if (!this.physicsCreated) {
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
      this.bodyId = b2CreateBody(worldId, bodyDef);

      // Create shape definition with high friction
      const shapeDef = {
        ...b2DefaultShapeDef(),
        density: 0, // Static bodies have 0 density
        friction: 5.0, // Higher friction for better stability
        restitution: 0.0, // No bounce at all
        userData: {
          type: "platform",
          platform: this, // Store reference to this platform instance
        }, // Important for collision identification
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
      this.shapeId = b2CreatePolygonShape(this.bodyId, shapeDef, box);

      // Create a base sprite for physics visualization (will be invisible)
      // This sprite will be connected to the physics body
      this.physicsSprite = this.scene.add.sprite(centerX, centerY, "__WHITE");
      this.physicsSprite.setVisible(false); // Hide the sprite
      this.physicsSprite.setScale(width / 32, (tileHeight * heightScale) / 32); // Match the physics body dimensions
      this.physicsSprite.name = "platform_physics"; // Name for debugging

      // Connect the physics body to this sprite
      AddSpriteToWorld(worldId, this.physicsSprite, { bodyId: this.bodyId });

      // Enable sleep for this platform body
      if (this.bodyId) {
        b2Body_EnableSleep(this.bodyId, true);
      }

      this.physicsCreated = true;
    }

    // --- Visual Tiling ---
    this.createVisualRepresentation(centerX, centerY, width, middleTileCount);
  }

  /**
   * Adds a platform segment to a combined platform.
   *
   * @param centerX The center x position of the segment in pixels.
   * @param centerY The center y position of the segment in pixels.
   * @param width The width of the segment in pixels.
   * @param middleTileCount The number of middle section tiles.
   */
  addPlatformSegment(
    centerX: number,
    centerY: number,
    width: number,
    middleTileCount: number
  ): void {
    if (!this.isCombinedPlatform) {
      console.error(
        "addPlatformSegment can only be called on a combined platform"
      );
      return;
    }

    // Store the segment data
    this.segments.push({
      centerX,
      centerY,
      width,
      middleTileCount,
    });

    // Create the visual representation for this segment
    this.createVisualRepresentation(centerX, centerY, width, middleTileCount);

    // Note: We don't create the physics body here anymore
    // It will be explicitly created after all segments are added
  }

  /**
   * Cleanly destroys the existing physics body if it exists.
   * Used when recreating the combined physics body.
   */
  private destroyExistingPhysics(): void {
    if (this.bodyId) {
      const worldId = gameState.worldId;
      if (worldId) {
        if (this.physicsSprite) {
          this.physicsSprite.destroy();
          this.physicsSprite = null;
        }
        b2DestroyBody(this.bodyId);
        this.bodyId = null;
        this.shapeId = null;
      }
    }
    this.physicsCreated = false;
  }

  /**
   * Creates a combined physics body for all segments.
   */
  public createCombinedPhysicsBody(): void {
    if (this.segments.length === 0) {
      return;
    }

    // Clean up any existing physics body
    this.destroyExistingPhysics();

    // Get world ID from game state
    const worldId = gameState.worldId;

    // Find the minimum x and maximum x across all segments
    // We're going to create one big box from the leftmost edge to the rightmost edge
    let minX = Infinity;
    let maxX = -Infinity;
    let avgY = 0;

    this.segments.forEach((segment) => {
      const halfWidth = segment.width / 2;
      const left = segment.centerX - halfWidth;
      const right = segment.centerX + halfWidth;

      minX = Math.min(minX, left);
      maxX = Math.max(maxX, right);
      avgY += segment.centerY;
    });

    // Calculate the average Y position
    avgY /= this.segments.length;

    // Use the texture frame to get the height
    const tileHeight = this.scene.textures.getFrame(
      ASSETS.ATLAS,
      ASSETS.PLATFORM.MIDDLE
    ).height;
    this.height = tileHeight;

    // Calculate the full width of the combined platform (from leftmost to rightmost edge)
    const totalWidth = maxX - minX;
    const centerX = minX + totalWidth / 2;
    const centerY = avgY;

    // Update platform properties
    this.width = totalWidth;
    this.centerX = centerX;
    this.centerY = centerY;

    // Calculate offset for better collision detection
    const offsetY = (tileHeight * 0.25) / PHYSICS.SCALE;

    // Create body definition - position at the center of the entire span
    const bodyDef = {
      ...b2DefaultBodyDef(),
      type: STATIC,
      position: new b2Vec2(
        centerX / PHYSICS.SCALE,
        -centerY / PHYSICS.SCALE + offsetY
      ),
      fixedRotation: true,
      allowSleep: true,
    };

    // Create the body
    this.bodyId = b2CreateBody(worldId, bodyDef);

    // Create a single physics shape for the entire platform span
    const shapeDef = {
      ...b2DefaultShapeDef(),
      density: 0,
      friction: 5.0,
      restitution: 0.0,
      userData: {
        type: "platform",
        platform: this, // Store reference to this platform instance
        isCombined: true, // Flag this as a combined platform for debugging
      },
      isSensor: false,
      enableContactEvents: true,
      filter: b2DefaultFilter(),
    };

    // Calculate the half-width and half-height for the single combined shape
    // This will be one big rectangle covering the entire span
    const halfWidth = totalWidth / (2 * PHYSICS.SCALE);
    const heightScale = 1.2;
    const halfHeight = (tileHeight * heightScale) / (2 * PHYSICS.SCALE);

    // Create a single box shape for the entire platform span
    const box = b2MakeBox(halfWidth, halfHeight);

    // Create the physics shape - just one for the entire platform
    this.shapeId = b2CreatePolygonShape(this.bodyId, shapeDef, box);

    // Create a base sprite for physics visualization (will be invisible in game but visible in debug)
    this.physicsSprite = this.scene.add.sprite(centerX, centerY, "__WHITE");
    this.physicsSprite.setVisible(false); // Hide the sprite in normal gameplay
    this.physicsSprite.setScale(
      totalWidth / 32,
      (tileHeight * heightScale) / 32
    );
    this.physicsSprite.name = "combined_platform_physics"; // Name for debugging

    // Connect the physics body to this sprite
    AddSpriteToWorld(worldId, this.physicsSprite, { bodyId: this.bodyId });

    // Enable sleep for this platform body
    if (this.bodyId) {
      b2Body_EnableSleep(this.bodyId, true);
    }

    this.physicsCreated = true;
  }

  /**
   * Creates the visual representation for a platform segment.
   *
   * @param centerX The center x position of the segment in pixels.
   * @param centerY The center y position of the segment in pixels.
   * @param width The width of the segment in pixels.
   * @param middleTileCount The number of middle section tiles.
   */
  private createVisualRepresentation(
    centerX: number,
    centerY: number,
    width: number,
    middleTileCount: number
  ): void {
    const tileWidth = this.scene.textures.getFrame(
      ASSETS.ATLAS,
      ASSETS.PLATFORM.MIDDLE
    ).width;
    const startX = centerX - width / 2; // Left edge of the platform

    // Add left edge sprite
    const leftSprite = this.scene.add.image(
      startX + tileWidth / 2, // Center of the left tile
      centerY,
      ASSETS.ATLAS,
      ASSETS.PLATFORM.LEFT
    );
    leftSprite.setData("physics", false); // Mark as a visual-only sprite
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
      middleSprite.setData("physics", false); // Mark as a visual-only sprite
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
    rightSprite.setData("physics", false); // Mark as a visual-only sprite
    this.platformSprites.push(rightSprite);
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
