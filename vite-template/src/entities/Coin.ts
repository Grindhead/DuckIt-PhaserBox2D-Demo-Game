/**
 * @file Coin.ts
 * @description Represents a collectible coin entity in the game.
 */
import * as Phaser from "phaser";

import { ASSETS } from "@constants";
import { gameState } from "@gameState";
import {
  STATIC,
  SpriteToBox,
  b2DefaultBodyDef,
  pxmVec2,
  AddSpriteToWorld,
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
      type: STATIC, // Use STATIC type for sensor bodies
      position: pxmVec2(this.x, this.y),
    };

    // Use SpriteToBox to link the sprite with a sensor body
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = SpriteToBox(gameState.worldId as any, this, {
      bodyDef,
      density: 0, // Sensors don't need density/friction/restitution
      friction: 0,
      restitution: 0,
      isSensor: true, // Explicitly mark as sensor
      userData: { type: "coin", coinInstance: this }, // Add reference to this instance
    });

    this.bodyId = result.bodyId;

    if (this.bodyId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      AddSpriteToWorld(gameState.worldId as any, this, this.bodyId);
    }
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
        // TODO: Consider properly removing the Box2D body from the world here
      }
    );

    // Increment score (using gameState)
    gameState.incrementCoins();
    // Optionally emit an event
    // this.scene.events.emit('coinCollected');
  }
}
