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
      allowSleep: false,
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
