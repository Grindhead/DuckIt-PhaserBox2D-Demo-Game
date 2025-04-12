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

import { createPhysicsBody } from "../lib/physics/PhysicsBodyFactory";

// Define collision categories - add these constants
const CATEGORY_DEFAULT = 0x0001;
const CATEGORY_ENEMY = 0x0002;
const CATEGORY_CRATE = 0x0004;
const CATEGORY_PLAYER = 0x0008;

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
   * Creates a new enemy entity
   * @param scene The game scene
   * @param x The initial x position
   * @param y The initial y position
   * @param platformMinX The minimum x-coordinate of the platform the enemy is on
   * @param platformMaxX The maximum x-coordinate of the platform the enemy is on
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
    this.speed = PHYSICS.PLAYER.SPEED * ASSETS.ENEMY.SPEED_FACTOR;
    this.halfWidthMeters = ASSETS.ENEMY.WIDTH / 2 / PHYSICS.SCALE;

    // Add to scene
    this.scene.add.existing(this);

    // Initialize physics
    this.initPhysics();
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

    // Create the physics body using the PhysicsBodyFactory
    // 'enemy' is the name of the body in physics.xml
    this.bodyId = createPhysicsBody("enemy", this.x, this.y, true);

    if (!this.bodyId) {
      console.error("Failed to create enemy physics body!");
      return;
    }

    // Link sprite to Box2D body and add to the scene's body-sprite map
    AddSpriteToWorld(this.bodyId, this);

    // Set initial velocity for patrolling
    b2Body_SetLinearVelocity(
      this.bodyId,
      new b2Vec2((this.speed / PHYSICS.SCALE) * this.direction, 0)
    );

    // Enable sleep for this enemy's body when off-screen
    if (this.bodyId) {
      b2Body_EnableSleep(this.bodyId, true);
    }

    console.log("Enemy physics body created using physics.xml data");
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

  /**
   * Resets the enemy to its initial state.
   */
  reset() {
    // Restore initial direction
    this.direction = 1;
    this.flipX = false;

    // Reset physics body if needed
    if (this.bodyId) {
      // Reset velocity to initial state
      b2Body_SetLinearVelocity(
        this.bodyId,
        new b2Vec2((this.speed / PHYSICS.SCALE) * this.direction, 0)
      );

      // Make sure body is awake
      b2Body_SetAwake(this.bodyId, true);
    }

    // Make sure sprite is visible
    this.setVisible(true);
    this.setActive(true);
  }
}
