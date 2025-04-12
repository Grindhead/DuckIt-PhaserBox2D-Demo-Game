/**
 * @file Enemy.ts
 * @description Represents the patrolling enemy character in the game.
 * Handles enemy sprite creation, physics integration (using Box2D via PhaserBox2D),
 * patrolling behavior within platform boundaries, and interactions (killing the player).
 */
import * as Phaser from "phaser";

// Internal Modules
import { ASSETS, PHYSICS } from "@constants";
import { gameState } from "@gameState";
import GameScene from "@scenes/GameScene";

// Box2D Runtime values
import {
  AddSpriteToWorld,
  b2BodyId,
  b2Body_GetLinearVelocity,
  b2Body_GetPosition,
  b2Body_SetLinearVelocity,
  b2CreateBody,
  b2CreatePolygonShape,
  b2DefaultBodyDef,
  b2DefaultShapeDef,
  b2DestroyBody,
  b2MakeBox,
  b2Vec2,
  DYNAMIC,
  STATIC,
  b2Body_EnableSleep,
  b2Body_SetAwake,
  b2Body_IsAwake,
} from "@PhaserBox2D";

/**
 * Enemy class representing the patrolling character
 */
export default class Enemy extends Phaser.GameObjects.Sprite {
  scene: GameScene; // Use specific scene type
  bodyId: InstanceType<typeof b2BodyId> | null = null;
  platformMinX: number;
  platformMaxX: number;
  speed: number;
  direction: number = 1; // 1 for right, -1 for left
  halfWidthMeters: number;

  /**
   * Creates an instance of the Enemy.
   *
   * @param scene - The GameScene to add the enemy to
   * @param x - Initial x position in pixels
   * @param y - Initial y position in pixels
   * @param platformMinX - Minimum x boundary (pixels) of the platform
   * @param platformMaxX - Maximum x boundary (pixels) of the platform
   */
  constructor(
    scene: GameScene,
    x: number,
    y: number,
    platformMinX: number,
    platformMaxX: number
  ) {
    super(scene, x, y, ASSETS.ATLAS, ASSETS.ENEMY.FRAME);

    this.scene = scene;
    this.platformMinX = platformMinX;
    this.platformMaxX = platformMaxX;

    // Calculate enemy speed based on player speed
    this.speed = PHYSICS.PLAYER.SPEED * ASSETS.ENEMY.SPEED_FACTOR;
    this.halfWidthMeters = ASSETS.ENEMY.WIDTH / 2 / PHYSICS.SCALE;

    scene.add.existing(this);
    this.setDepth(9); // Render below player (player is 10)

    this.initPhysics();

    // Map bodyId to this sprite in the scene
    if (this.bodyId) {
      this.scene.bodyIdToSpriteMap.set(this.bodyId.index1, this);
    }
  }

  /**
   * Initializes the Box2D physics body for the enemy.
   */
  initPhysics() {
    if (this.bodyId) {
      this.scene.bodyIdToSpriteMap.delete(this.bodyId.index1);
      b2DestroyBody(this.bodyId);
      this.bodyId = null;
    }

    const bodyDef = {
      ...b2DefaultBodyDef(),
      type: DYNAMIC,
      position: new b2Vec2(this.x / PHYSICS.SCALE, -this.y / PHYSICS.SCALE),
      fixedRotation: true,
      enableContactListener: true,
      allowSleep: true, // Allow enemies to sleep when not visible
      linearDamping: 0.1,
      gravityScale: 1,
    };

    const bodyId = b2CreateBody(gameState.worldId, bodyDef);
    this.bodyId = bodyId;

    const halfWidth = ASSETS.ENEMY.WIDTH / 2 / PHYSICS.SCALE;
    const halfHeight = ASSETS.ENEMY.HEIGHT / 2 / PHYSICS.SCALE;

    // Generate the shape using the helper
    const boxShape = b2MakeBox(halfWidth, halfHeight);
    console.log("[Enemy.initPhysics] Shape object from b2MakeBox:", boxShape); // Log the shape object

    const shapeDef = {
      ...b2DefaultShapeDef(),
      shape: boxShape, // Use the shape from b2MakeBox
      density: ASSETS.ENEMY.DENSITY,
      friction: ASSETS.ENEMY.FRICTION,
      restitution: ASSETS.ENEMY.RESTITUTION,
      userData: { type: "enemy" }, // Add user data for collision identification
    };

    console.log(
      "[Enemy.initPhysics] Calling b2CreatePolygonShape with shapeDef:",
      shapeDef
    ); // Log the shapeDef
    b2CreatePolygonShape(bodyId, shapeDef, boxShape); // Pass boxShape as the third argument

    AddSpriteToWorld(bodyId, this); // Link sprite to Box2D body
    b2Body_SetLinearVelocity(
      this.bodyId,
      new b2Vec2((this.speed / PHYSICS.SCALE) * this.direction, 0)
    );

    // Enable sleep for this enemy's body
    if (this.bodyId) {
      b2Body_EnableSleep(this.bodyId, true);
    }
  }

  /**
   * Checks if the enemy is visible to the camera.
   *
   * @returns True if the enemy is visible to the camera, false otherwise.
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

    // Calculate enemy bounds
    const enemyBounds = {
      left: this.x - this.width / 2,
      right: this.x + this.width / 2,
      top: this.y - this.height / 2,
      bottom: this.y + this.height / 2,
    };

    // Check if enemy is visible (overlaps with camera)
    return !(
      enemyBounds.right < cameraBounds.left ||
      enemyBounds.left > cameraBounds.right ||
      enemyBounds.bottom < cameraBounds.top ||
      enemyBounds.top > cameraBounds.bottom
    );
  }

  /**
   * Updates the enemy's sleep state based on visibility.
   * Enemies not visible to the camera will be put to sleep for performance.
   *
   * @returns True if the enemy is visible and awake, false if sleeping
   */
  updateSleepState(): boolean {
    if (!this.bodyId) return false;

    const isVisible = this.isVisibleToCamera();

    // Set awake or asleep based on visibility
    b2Body_SetAwake(this.bodyId, isVisible);

    return isVisible;
  }

  /**
   * Checks if the enemy's physics body is currently awake.
   *
   * @returns True if the physics body is awake, false if asleep.
   */
  isAwake(): boolean {
    if (!this.bodyId) return false;
    return b2Body_IsAwake(this.bodyId);
  }

  /**
   * Updates the enemy's position and behavior.
   */
  update() {
    if (!this.bodyId || !gameState.isPlaying) {
      if (this.bodyId) {
        b2Body_SetLinearVelocity(this.bodyId, new b2Vec2(0, 0));
      }
      return;
    }

    // Only update behavior if the enemy is awake
    if (!this.isAwake()) {
      return;
    }

    const position = b2Body_GetPosition(this.bodyId);
    const velocity = b2Body_GetLinearVelocity(this.bodyId);
    const currentXPixels = position.x * PHYSICS.SCALE;

    if (
      (this.direction === 1 &&
        currentXPixels + ASSETS.ENEMY.WIDTH / 2 >= this.platformMaxX) ||
      (this.direction === -1 &&
        currentXPixels - ASSETS.ENEMY.WIDTH / 2 <= this.platformMinX)
    ) {
      this.direction *= -1;
      this.flipX = this.direction === -1;
      const newVelocityX = (this.speed / PHYSICS.SCALE) * this.direction;
      b2Body_SetLinearVelocity(
        this.bodyId,
        new b2Vec2(newVelocityX, velocity.y)
      );
    } else {
      const expectedVelocityX = (this.speed / PHYSICS.SCALE) * this.direction;
      if (Math.abs(velocity.x - expectedVelocityX) > 0.1 / PHYSICS.SCALE) {
        b2Body_SetLinearVelocity(
          this.bodyId,
          new b2Vec2(expectedVelocityX, velocity.y)
        );
      }
    }
  }

  /**
   * Destroys the enemy sprite and its physics body.
   */
  destroy(fromScene?: boolean | undefined): void {
    if (this.bodyId) {
      this.scene.bodyIdToSpriteMap.delete(this.bodyId.index1);
      b2DestroyBody(this.bodyId);
      this.bodyId = null;
    }
    super.destroy(fromScene);
  }
}
