/**
 * @file Coin.ts
 * @description Represents a collectible coin entity in the game.
 */
import * as Phaser from "phaser";

import { ASSETS, PHYSICS } from "@constants";
import { gameState } from "@gameState";
import {
  AddSpriteToWorld,
  STATIC,
  b2BodyId,
  b2DefaultBodyDef,
  b2DefaultShapeDef,
  b2CreateBody,
  b2CreatePolygonShape,
  b2CreateCircleShape,
  b2MakeBox,
  b2Vec2,
  b2Body_Disable,
  b2Body_Enable,
  b2Body_EnableSleep,
  b2Body_SetAwake,
  b2Body_IsAwake,
} from "@PhaserBox2D";
import GameScene from "@scenes/GameScene";

import { createPhysicsBody } from "../lib/physics/PhysicsBodyFactory";

export default class Coin extends Phaser.GameObjects.Sprite {
  scene: Phaser.Scene;
  bodyId: InstanceType<typeof b2BodyId> | null = null;
  isCollected: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, ASSETS.ATLAS, ASSETS.COIN.FRAME);
    this.scene = scene;
    this.scene.add.existing(this);
    this.initPhysics();
    this.play(ASSETS.COIN.IDLE.KEY);
  }

  initPhysics() {
    // Remove existing physics body if it exists
    if (this.bodyId) {
      if (this.scene instanceof GameScene) {
        (this.scene as GameScene).bodyIdToSpriteMap.delete(this.bodyId.index1);
      }
      b2Body_Disable(this.bodyId);
      this.bodyId = null;
    }

    // Create the physics body using the PhysicsBodyFactory
    // 'coin' is the name of the body in physics.xml
    try {
      // Pass 'this' as the entityInstance parameter to include it in the userData
      this.bodyId = createPhysicsBody("coin", this.x, this.y, false, this);
      console.log("Coin physics body created with instance reference");
    } catch (error) {
      console.error("Error creating coin physics body:", error);
      this.bodyId = null;
    }

    if (!this.bodyId) {
      console.error("Failed to create coin physics body!");
      return;
    }

    // Link the sprite to the body for rendering updates
    AddSpriteToWorld(gameState.worldId, this, { bodyId: this.bodyId });

    // Enable sleep for this coin's body
    if (this.bodyId) {
      b2Body_EnableSleep(this.bodyId, true);
    }

    // Register this coin's bodyId and sprite instance in the GameScene map
    if (this.bodyId && this.scene instanceof GameScene) {
      (this.scene as GameScene).bodyIdToSpriteMap.set(this.bodyId.index1, this);
    } else if (this.bodyId) {
      console.warn(
        "Coin added to a scene that is not GameScene. Cannot register in bodyIdToSpriteMap."
      );
    } else {
      console.warn(
        "Failed to register coin in bodyIdToSpriteMap. BodyId invalid."
      );
    }

    console.log("Coin physics body created successfully");
  }

  /**
   * Creates a fallback physics body if the XML data isn't available
   * Uses the same values as before for compatibility
   */
  createFallbackPhysicsBody() {
    const bodyDef = {
      ...b2DefaultBodyDef(),
      type: STATIC,
      position: new b2Vec2(this.x / PHYSICS.SCALE, -this.y / PHYSICS.SCALE),
      userData: { type: "coin" },
      allowSleep: true,
    };

    this.bodyId = b2CreateBody(gameState.worldId, bodyDef);

    if (!this.bodyId) {
      console.error("Failed to create fallback coin physics body!");
      return;
    }

    const shapeDef = {
      ...b2DefaultShapeDef(),
      isSensor: true,
      enableContactEvents: true,
      density: 0,
      friction: 0,
      restitution: 0,
      userData: { type: "coin", coinInstance: this },
    };

    const radius = 12.0 / PHYSICS.SCALE; // Default radius from physics.xml

    // Create a properly formatted circle shape that Box2D can work with
    // The center must be a b2Vec2, not a plain object
    const circleShape = {
      center: new b2Vec2(0, 0),
      radius,
    };

    b2CreateCircleShape(this.bodyId, shapeDef, circleShape);
    AddSpriteToWorld(gameState.worldId, this, { bodyId: this.bodyId });

    console.log("Created fallback coin physics body");
  }

  /**
   * Checks if the coin is visible to the camera.
   *
   * @returns True if the coin is visible to the camera, false otherwise.
   */
  isVisibleToCamera(): boolean {
    if (
      !this.scene ||
      !this.scene.cameras ||
      !this.scene.cameras.main ||
      this.isCollected
    ) {
      return false; // Default to not visible if we can't check or the coin is collected
    }

    const camera = this.scene.cameras.main;

    // Get camera bounds
    const cameraBounds = {
      left: camera.scrollX,
      right: camera.scrollX + camera.width,
      top: camera.scrollY,
      bottom: camera.scrollY + camera.height,
    };

    // Calculate coin bounds
    const coinBounds = {
      left: this.x - this.width / 2,
      right: this.x + this.width / 2,
      top: this.y - this.height / 2,
      bottom: this.y + this.height / 2,
    };

    // Check if coin is visible (overlaps with camera)
    return !(
      coinBounds.right < cameraBounds.left ||
      coinBounds.left > cameraBounds.right ||
      coinBounds.bottom < cameraBounds.top ||
      coinBounds.top > cameraBounds.bottom
    );
  }

  /**
   * Updates the coin's sleep state based on visibility.
   * Coins not visible to the camera will be put to sleep for performance.
   *
   * @returns True if the coin is visible and awake, false if sleeping
   */
  updateSleepState(): boolean {
    if (!this.bodyId || this.isCollected) return false;

    const isVisible = this.isVisibleToCamera();

    // Set awake or asleep based on visibility
    b2Body_SetAwake(this.bodyId, isVisible);

    return isVisible;
  }

  /**
   * Checks if the coin's physics body is currently awake.
   *
   * @returns True if the physics body is awake, false if asleep.
   */
  isAwake(): boolean {
    if (!this.bodyId || this.isCollected) return false;
    return b2Body_IsAwake(this.bodyId);
  }

  collect() {
    if (this.isCollected) return;
    this.isCollected = true;

    // Disable the physics body immediately to prevent further collisions and debug drawing
    if (this.bodyId) {
      b2Body_Disable(this.bodyId);

      // Also remove this coin from the bodyIdToSpriteMap to prevent debug drawing
      if (this.scene instanceof GameScene) {
        (this.scene as GameScene).bodyIdToSpriteMap.delete(this.bodyId.index1);
      }
    }

    // Play the collect animation
    this.play(ASSETS.COIN.COLLECT.KEY);

    // Hide the coin *after* the animation completes
    this.on(
      Phaser.Animations.Events.ANIMATION_COMPLETE,
      () => {
        this.setVisible(false);
        this.setActive(false); // Also set inactive
      },
      this
    );
  }

  /**
   * Resets the coin to its initial state (not collected, visible).
   */
  reset() {
    this.isCollected = false;
    this.setVisible(true);
    this.setActive(true);

    // Re-enable the physics body if it was disabled
    if (this.bodyId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      b2Body_Enable(this.bodyId);

      // Re-add this coin to the bodyIdToSpriteMap for proper rendering
      if (this.scene instanceof GameScene) {
        (this.scene as GameScene).bodyIdToSpriteMap.set(
          this.bodyId.index1,
          this
        );
      }
    }

    this.play(ASSETS.COIN.IDLE.KEY);
  }
}
