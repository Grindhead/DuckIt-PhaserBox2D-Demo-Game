/**
 * @file Coin.ts
 * @description Represents a collectible coin entity in the game.
 */
import * as Phaser from "phaser";

import { ASSETS, PHYSICS } from "@constants";
import { gameState } from "@gameState";
import {
  STATIC,
  b2DefaultBodyDef,
  pxmVec2,
  AddSpriteToWorld,
  RemoveSpriteFromWorld,
  b2CreateBody,
  b2DefaultShapeDef,
  b2MakeBox,
  b2CreatePolygonShape,
  b2Vec2,
} from "@PhaserBox2D";

export default class Coin extends Phaser.GameObjects.Sprite {
  scene: Phaser.Scene;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bodyId: any | null = null; // To store the Box2D body reference
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

    // Create the polygon shape and attach it to the body
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    b2CreatePolygonShape(bodyId, shapeDef, box);

    // Link the sprite to the body for rendering updates
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    AddSpriteToWorld(gameState.worldId as any, this, { bodyId: this.bodyId });
  }

  collect() {
    if (this.isCollected) return;
    this.isCollected = true;

    // Play collection animation
    this.play(ASSETS.COIN.COLLECT.KEY);

    // Optionally disable physics body after starting collection animation
    // Remove the body from the physics world if needed, after animation completes
    // For now, just hide it after animation
    this.on(
      Phaser.Animations.Events.ANIMATION_COMPLETE_KEY + ASSETS.COIN.COLLECT.KEY,
      () => {
        this.setVisible(false);
        this.setActive(false);

        // Properly remove the sprite-body link and destroy the body
        if (this.bodyId) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          RemoveSpriteFromWorld(gameState.worldId as any, this);

          // Emit event to queue destruction in GameScene
          this.scene.events.emit("queueBodyDestruction", this.bodyId);
          // this.scene.bodiesToDestroy.push(this.bodyId);
          // b2DestroyBody(this.bodyId);
          this.bodyId = null; // Still nullify the reference here
        }

        // Destroy the Phaser GameObject itself
        this.destroy();
      }
    );

    // Increment score (using gameState)
    gameState.incrementCoins();
    // Optionally emit an event
    // this.scene.events.emit('coinCollected');
  }
}
