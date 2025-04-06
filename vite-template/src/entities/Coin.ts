/**
 * @file Coin.ts
 * @description Represents a collectible coin entity in the game.
 */
import * as Phaser from "phaser";

import { ASSETS, PHYSICS, ANIMATION } from "@constants";
import { gameState } from "@gameState";
import {
  AddSpriteToWorld,
  STATIC,
  b2BodyId,
  b2DefaultBodyDef,
  b2DefaultShapeDef,
  b2CreateBody,
  b2CreatePolygonShape,
  b2MakeBox,
  b2Vec2,
  RemoveSpriteFromWorld,
} from "@PhaserBox2D";
import GameScene from "@scenes/GameScene";

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
    const bodyDef = {
      ...b2DefaultBodyDef(),
      type: STATIC,
      position: new b2Vec2(this.x / PHYSICS.SCALE, -this.y / PHYSICS.SCALE), // Scale and negate Y for Box2D
      userData: { type: "coin", coinInstance: this },
    };

    // Create the body directly
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bodyId = b2CreateBody(gameState.worldId as any, bodyDef);
    this.bodyId = bodyId;

    if (!bodyId) {
      console.error("Failed to create coin physics body!");
      return;
    }

    // Define the shape
    const shapeDef = {
      ...b2DefaultShapeDef(),
      isSensor: true,
      enableContactEvents: true,
      density: 0,
      friction: 0,
      restitution: 0,
      userData: { type: "coin", coinInstance: this },
    };

    // Create box geometry with proper scaling for Box2D (in meters)
    const scaleX = this.scaleX;
    const scaleY = this.scaleY;
    const halfWidth = (this.width * scaleX) / (2 * PHYSICS.SCALE);
    const halfHeight = (this.height * scaleY) / (2 * PHYSICS.SCALE);

    const box = b2MakeBox(halfWidth, halfHeight);

    b2CreatePolygonShape(bodyId, shapeDef, box);

    // Link the sprite to the body for rendering updates
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    AddSpriteToWorld(gameState.worldId as any, this, { bodyId: this.bodyId });

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
  }

  collect() {
    if (this.isCollected) return;
    this.isCollected = true;

    this.setVisible(false);

    if (this.bodyId) {
      // Immediately remove from GameScene map upon collection
      if (this.scene instanceof GameScene) {
        (this.scene as GameScene).bodyIdToSpriteMap.delete(this.bodyId.index1);
      } else {
        console.warn("Cannot remove coin from map: Scene is not GameScene.");
      }

      // Nullify the reference to the orphaned body
      this.bodyId = null;
    }

    // Increment score
    gameState.incrementCoins();
  }

  /**
   * Resets the coin to its initial state (not collected, visible).
   */
  reset() {
    this.isCollected = false;
    this.setVisible(true);
    this.setActive(true);
    // Re-initialize physics if the body was orphaned on collect
    if (!this.bodyId) {
      this.initPhysics(); // This will create a new body and register it
    }
    this.play(ASSETS.COIN.IDLE.KEY);
  }

  // Override destroy to clean up the physics body
  destroy(fromScene?: boolean): void {
    // Properly remove the sprite-body link and destroy the body
    if (this.bodyId) {
      // Remove from map if it exists (might be destroyed without collecting)
      if (this.scene instanceof GameScene) {
        (this.scene as GameScene).bodyIdToSpriteMap.delete(this.bodyId.index1);
      }

      // Nullify the reference
      this.bodyId = null;
    }

    // Destroy the Phaser GameObject itself
    super.destroy(fromScene);
  }
}
