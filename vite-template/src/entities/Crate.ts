/**
 * @file Crate.ts
 * @description Represents a pushable crate entity in the game.
 * Crates come in two sizes: big and small, with a 2:1 mass ratio.
 * They are used to solve puzzles and reach higher areas.
 */
import * as Phaser from "phaser";

import { ASSETS, PHYSICS } from "@constants";
import { gameState } from "@gameState";
import {
  AddSpriteToWorld,
  DYNAMIC,
  b2BodyId,
  b2DefaultBodyDef,
  b2DefaultShapeDef,
  b2CreateBody,
  b2CreatePolygonShape,
  b2MakeBox,
  b2Vec2,
  b2Body_SetLinearVelocity,
  b2Body_SetAngularVelocity,
  b2Body_SetTransform,
  b2Body_SetAwake,
  b2Body_GetPosition,
  b2Body_GetLinearVelocity,
  b2Body_EnableSleep,
  b2Body_IsAwake,
} from "@PhaserBox2D";
import GameScene from "@scenes/GameScene";

import { createPhysicsBody } from "../lib/physics/PhysicsBodyFactory";

// Define collision categories - these must match those in Enemy.ts
const CATEGORY_DEFAULT = 0x0001;
const CATEGORY_ENEMY = 0x0002;
const CATEGORY_CRATE = 0x0004;
const CATEGORY_PLAYER = 0x0008;

/**
 * The size type of a crate: big or small
 */
type CrateSize = "BIG" | "SMALL";

export default class Crate extends Phaser.GameObjects.Sprite {
  scene: Phaser.Scene;
  bodyId: InstanceType<typeof b2BodyId> | null = null;
  size: CrateSize;
  private originalPosition: { x: number; y: number };
  private platformMinX: number;
  private platformMaxX: number;
  private halfWidthMeters: number = 0;

  /**
   * Creates a new crate entity
   * @param scene The game scene
   * @param x The initial x position
   * @param y The initial y position
   * @param size The size of the crate ('big' or 'small')
   * @param platformMinX The minimum x-coordinate (in physics world units) of the platform the crate is on
   * @param platformMaxX The maximum x-coordinate (in physics world units) of the platform the crate is on
   */
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    size: CrateSize,
    platformMinX: number,
    platformMaxX: number
  ) {
    // Select the correct frame data based on size
    const frameData: string = ASSETS.CRATE[size].FRAME;

    super(scene, x, y, ASSETS.ATLAS, frameData); // Use frameData.FRAME
    this.scene = scene;
    this.size = size;
    this.originalPosition = { x, y };
    this.platformMinX = platformMinX;
    this.platformMaxX = platformMaxX;

    // Add to scene
    this.scene.add.existing(this);

    // Add to the scene's crates array if it's a GameScene
    if (this.scene instanceof GameScene) {
      (this.scene as GameScene).crates.push(this);
    }

    // Initialize physics
    this.initPhysics();
  }

  /**
   * Initializes the Box2D physics body for the crate
   */
  initPhysics() {
    // Remove existing physics body if it exists
    if (this.bodyId) {
      if (this.scene instanceof GameScene) {
        (this.scene as GameScene).bodyIdToSpriteMap.delete(this.bodyId.index1);
      }
      this.bodyId = null;
    }

    // Create the physics body using the PhysicsBodyFactory
    // Use the correct crate size from physics.xml
    const entityType = this.size === "BIG" ? "crate-big" : "crate-small";
    this.bodyId = createPhysicsBody(entityType, this.x, this.y, true);

    // If createPhysicsBody failed, try using the fallback method
    if (!this.bodyId) {
      console.warn(
        `PhysicsBodyFactory failed for ${this.size} crate, trying fallback method...`
      );
      this.bodyId = this.createFallbackPhysicsBody();

      if (!this.bodyId) {
        console.error(
          `Both primary and fallback physics creation failed for ${this.size} crate!`
        );
        return;
      }
    }

    // Store the half-width for boundary checks
    const constWidth = ASSETS.CRATE[this.size].WIDTH;
    this.halfWidthMeters = constWidth / (2 * PHYSICS.SCALE);

    // Link the sprite to the body for rendering updates
    AddSpriteToWorld(gameState.worldId, this, { bodyId: this.bodyId });

    // Enable sleep for this crate's body
    if (this.bodyId) {
      b2Body_EnableSleep(this.bodyId, true);
    }

    // Register in GameScene's map if available
    if (this.bodyId && this.scene instanceof GameScene) {
      (this.scene as GameScene).bodyIdToSpriteMap.set(this.bodyId.index1, this);
    }

    console.log(
      `${this.size} crate physics body created: bodyId=${this.bodyId.index1} at position (${this.x}, ${this.y})`
    );
  }

  /**
   * Checks if the crate is visible to the camera.
   *
   * @returns True if the crate is visible to the camera, false otherwise.
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

    // Calculate crate bounds
    const crateBounds = {
      left: this.x - this.width / 2,
      right: this.x + this.width / 2,
      top: this.y - this.height / 2,
      bottom: this.y + this.height / 2,
    };

    // Check if crate is visible (overlaps with camera)
    return !(
      crateBounds.right < cameraBounds.left ||
      crateBounds.left > cameraBounds.right ||
      crateBounds.bottom < cameraBounds.top ||
      crateBounds.top > cameraBounds.bottom
    );
  }

  /**
   * Updates the crate's sleep state based on visibility.
   * Crates not visible to the camera will be put to sleep for performance.
   *
   * @returns True if the crate is visible and awake, false if sleeping
   */
  updateSleepState(): boolean {
    if (!this.bodyId) return false;

    const isVisible = this.isVisibleToCamera();

    // Check if debug mode is active in GameScene
    const isDebugActive =
      this.scene instanceof GameScene && (this.scene as GameScene).debugEnabled;

    // Only sleep if not visible AND debug mode is not active
    const shouldBeAwake = isVisible || isDebugActive;

    // Set awake or asleep based on visibility and debug state
    b2Body_SetAwake(this.bodyId, shouldBeAwake);

    return shouldBeAwake;
  }

  /**
   * Checks if the crate's physics body is currently awake.
   *
   * @returns True if the physics body is awake, false if asleep.
   */
  isAwake(): boolean {
    if (!this.bodyId) return false;
    return b2Body_IsAwake(this.bodyId);
  }

  /**
   * Prevents the crate from moving horizontally too fast
   * Called during the update cycle
   */
  update() {
    if (!this.bodyId) return;

    // Skip update if crate is asleep
    if (!this.isAwake()) return;

    const pos = b2Body_GetPosition(this.bodyId);
    const vel = b2Body_GetLinearVelocity(this.bodyId);

    // Additional stability check - always dampen velocity if very small
    if (Math.abs(vel.x) < 0.1 && Math.abs(vel.y) < 0.1) {
      b2Body_SetLinearVelocity(this.bodyId, new b2Vec2(0, 0));
    }

    // Apply stronger damping if debug mode is active
    // This helps stabilize crates during debug visualization
    if (
      this.scene instanceof GameScene &&
      (this.scene as GameScene).debugEnabled
    ) {
      // Stop horizontal movement completely when in debug mode
      if (Math.abs(vel.x) < 0.5) {
        b2Body_SetLinearVelocity(this.bodyId, new b2Vec2(0, vel.y));
      } else {
        // Apply stronger damping to slow it down more quickly
        b2Body_SetLinearVelocity(this.bodyId, new b2Vec2(vel.x * 0.8, vel.y));
      }
    }

    const crateLeftEdge = pos.x - this.halfWidthMeters;
    const crateRightEdge = pos.x + this.halfWidthMeters;

    // Check left boundary
    if (vel.x < 0 && crateLeftEdge <= this.platformMinX) {
      // Stop horizontal movement and slightly adjust position to prevent sticking
      b2Body_SetLinearVelocity(this.bodyId, new b2Vec2(0, vel.y));
      b2Body_SetTransform(
        this.bodyId,
        new b2Vec2(this.platformMinX + this.halfWidthMeters + 0.01, pos.y),
        0
      );
    }

    // Check right boundary
    if (vel.x > 0 && crateRightEdge >= this.platformMaxX) {
      // Stop horizontal movement and slightly adjust position
      b2Body_SetLinearVelocity(this.bodyId, new b2Vec2(0, vel.y));
      b2Body_SetTransform(
        this.bodyId,
        new b2Vec2(this.platformMaxX - this.halfWidthMeters - 0.01, pos.y),
        0
      );
    }
  }

  /**
   * Resets the crate to its original position
   * Called when resetting the level
   */
  reset() {
    if (this.bodyId) {
      // Stop all movement
      b2Body_SetLinearVelocity(this.bodyId, new b2Vec2(0, 0));
      b2Body_SetAngularVelocity(this.bodyId, 0);

      // Make sure the body is awake for the transform to take effect
      // Without this, sleeping bodies might not reset properly
      b2Body_SetAwake(this.bodyId, true);

      // Reset position with a small delay to ensure physics state is stable
      this.scene.time.delayedCall(10, () => {
        if (this.bodyId) {
          // Reset transform (position and rotation)
          b2Body_SetTransform(
            this.bodyId,
            new b2Vec2(
              this.originalPosition.x / PHYSICS.SCALE,
              -this.originalPosition.y / PHYSICS.SCALE
            ),
            0 // angle
          );

          // Stop velocity again to be extra sure
          b2Body_SetLinearVelocity(this.bodyId, new b2Vec2(0, 0));
          b2Body_SetAngularVelocity(this.bodyId, 0);
        }
      });
    }
  }

  /**
   * Destroys the crate and its physics body
   */
  destroy() {
    // Clean up when removing the crate
    if (this.bodyId && this.scene instanceof GameScene) {
      (this.scene as GameScene).bodyIdToSpriteMap.delete(this.bodyId.index1);

      // Remove from crates array
      const index = (this.scene as GameScene).crates.indexOf(this);
      if (index !== -1) {
        (this.scene as GameScene).crates.splice(index, 1);
      }
    }
    super.destroy();
  }

  /**
   * Creates a fallback physics body for the crate when loading from XML fails
   */
  createFallbackPhysicsBody() {
    if (!gameState.worldId) {
      console.error(
        "Game world not initialized. Cannot create fallback crate body."
      );
      return null;
    }

    try {
      console.log(
        `Creating fallback physics body for ${this.size} crate at (${this.x}, ${this.y})`
      );

      // Create basic body definition
      const bodyDef = {
        ...b2DefaultBodyDef(),
        type: DYNAMIC,
        position: new b2Vec2(this.x / PHYSICS.SCALE, -this.y / PHYSICS.SCALE),
        fixedRotation: true,
        enableContactListener: true,
        allowSleep: true,
      };

      // Create the body
      const bodyId = b2CreateBody(gameState.worldId, bodyDef);
      if (!bodyId) {
        console.error(`Failed to create fallback body for ${this.size} crate`);
        return null;
      }

      // Create shape definition
      const shapeDef = {
        ...b2DefaultShapeDef(),
        density: 2,
        friction: 0.2,
        restitution: 0,
        isSensor: false,
        userData: {
          type: "crate",
          entityType: this.size === "BIG" ? "crate-big" : "crate-small",
        },
        filter: {
          categoryBits: CATEGORY_CRATE,
          maskBits: CATEGORY_DEFAULT | CATEGORY_PLAYER | CATEGORY_ENEMY,
          groupIndex: 0,
        },
      };

      // Use the dimensions from your physics.xml file
      let width, height;
      if (this.size === "BIG") {
        // Use the known dimensions for big crate: (-35 to 21, -25 to 23)
        width = 56 / PHYSICS.SCALE; // 21 - (-35)
        height = 48 / PHYSICS.SCALE; // 23 - (-25)
      } else {
        // Use the known dimensions for small crate: (-25 to 16, -16 to 15)
        width = 41 / PHYSICS.SCALE; // 16 - (-25)
        height = 31 / PHYSICS.SCALE; // 15 - (-16)
      }

      // Create the box polygon - halve the dimensions as b2MakeBox expects half-width and half-height
      const box = b2MakeBox(width / 2, height / 2);

      // Create the shape
      const shapeId = b2CreatePolygonShape(bodyId, shapeDef, box);

      console.log(
        `Created FALLBACK physics body for ${this.size} crate: bodyId=${bodyId.index1}, with dimensions ${width}x${height}`
      );

      return bodyId;
    } catch (error) {
      console.error(
        `Error creating fallback physics body for ${this.size} crate:`,
        error
      );
      return null;
    }
  }
}
