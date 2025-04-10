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
  b2ShapeDef,
} from "@PhaserBox2D";
import GameScene from "@scenes/GameScene";

/**
 * The size type of a crate: big or small
 */
type CrateSize = "BIG" | "SMALL";

export default class Crate extends Phaser.GameObjects.Sprite {
  scene: Phaser.Scene;
  bodyId: InstanceType<typeof b2BodyId> | null = null;
  size: CrateSize;
  private originalPosition: { x: number; y: number };
  private platformId: number | null = null;

  /**
   * Creates a new crate entity
   * @param scene The game scene
   * @param x The initial x position
   * @param y The initial y position
   * @param size The size of the crate ('big' or 'small')
   * @param platformId Optional ID of the platform this crate is on (for reset purposes)
   */
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    size: CrateSize,
    platformId: number | null = null
  ) {
    // Select the correct frame data based on size
    const frameData: string = ASSETS.CRATE[size].FRAME;

    super(scene, x, y, ASSETS.ATLAS, frameData); // Use frameData.FRAME
    this.scene = scene;
    this.size = size;
    this.originalPosition = { x, y };
    this.platformId = platformId;

    // Add to scene
    this.scene.add.existing(this);

    // Initialize physics
    this.initPhysics();
  }

  /**
   * Initializes the Box2D physics body for the crate
   */
  initPhysics() {
    const bodyDef = {
      ...b2DefaultBodyDef(),
      type: DYNAMIC,
      position: new b2Vec2(this.x / PHYSICS.SCALE, -this.y / PHYSICS.SCALE), // Scale and negate Y for Box2D
      fixedRotation: true, // Prevent rotation for better gameplay
      userData: { type: "crate", crateInstance: this, size: this.size },
    };

    // Create the body
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bodyId = b2CreateBody(gameState.worldId as any, bodyDef);
    this.bodyId = bodyId;

    if (!bodyId) {
      console.error(`Failed to create ${this.size} crate physics body!`);
      return;
    }

    // Create default shape definition (type is inferred)
    const shapeDef = b2DefaultShapeDef();

    // Set specific properties on the shapeDef object
    shapeDef.density = ASSETS.CRATE[this.size].DENSITY;
    shapeDef.friction = ASSETS.CRATE[this.size].FRICTION;
    shapeDef.restitution = ASSETS.CRATE[this.size].RESTITUTION;
    shapeDef.userData = { type: "crate", crateInstance: this, size: this.size };
    // Invalid properties like isSensor are not set

    // Define the shape

    // Create box geometry with proper scaling for Box2D (in meters)
    const scaleX = this.scaleX;
    const scaleY = this.scaleY;
    // Make the collision box slightly smaller than the visual to prevent getting stuck on edges
    const halfWidth = (this.width * scaleX * 0.9) / (2 * PHYSICS.SCALE);
    const halfHeight = (this.height * scaleY * 0.9) / (2 * PHYSICS.SCALE);

    const box = b2MakeBox(halfWidth, halfHeight);

    b2CreatePolygonShape(bodyId, shapeDef, box);

    // Link the sprite to the body for rendering updates
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    AddSpriteToWorld(gameState.worldId as any, this, { bodyId: this.bodyId });

    // Register in GameScene's map if available
    if (this.bodyId && this.scene instanceof GameScene) {
      (this.scene as GameScene).bodyIdToSpriteMap.set(this.bodyId.index1, this);
    }
  }

  /**
   * Prevents the crate from moving horizontally too fast
   * Called during the update cycle
   */
  update() {
    if (this.bodyId) {
      // Additional logic could be added here if needed
      // For example, preventing the crate from falling off platforms
      // Note: to make the crates feel more natural, we don't need
      // to artificially limit their horizontal velocity during normal gameplay.
      // Box2D will handle the physics appropriately.
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
    }
    super.destroy();
  }
}
