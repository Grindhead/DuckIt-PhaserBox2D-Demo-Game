import * as Phaser from "phaser";

import { PHYSICS, WORLD } from "@constants";
import { gameState } from "@gameState";
// Import runtime values/functions via alias
import {
  AddSpriteToWorld,
  SpriteToBox,
  STATIC,
  b2DefaultBodyDef,
  pxmVec2,
  b2Body_SetTransform,
  b2DestroyBody,
} from "@PhaserBox2D";

/**
 * @file DeathSensor.ts
 * @description Represents an invisible sensor area at the bottom of the game world.
 * If the player collides with this sensor (i.e., falls off the world),
 * it triggers the player's death sequence.
 * Implemented as a static Box2D sensor body.
 */

interface InitialConfig {
  x: number;
  y: number;
  width: number;
  height: number;
}

export default class DeathSensor extends Phaser.GameObjects.Rectangle {
  scene: Phaser.Scene;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bodyId: any | null = null;
  initialConfig: InitialConfig | null = null;

  constructor(scene: Phaser.Scene) {
    super(
      scene,
      WORLD.WIDTH / 2,
      WORLD.DEATH_SENSOR_Y,
      WORLD.WIDTH,
      PHYSICS.DEATH_SENSOR.HEIGHT
    );
    this.scene = scene;
    this.initialize();
  }

  initialize() {
    this.initialConfig = {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
    };

    this.scene.add.existing(this);

    this.createSensor();
  }

  destroySensor() {
    if (this.bodyId) {
      console.log(
        `DeathSensor.destroySensor: Destroying body ${JSON.stringify(
          this.bodyId
        )} in world ${JSON.stringify(gameState.worldId)}`
      );
      b2DestroyBody(this.bodyId);
      this.bodyId = null;
    }
  }

  reset() {
    this.destroySensor();
    this.createSensor();

    if (!this.bodyId) {
      console.error("DeathSensor.reset: Failed to recreate sensor body!");
      return;
    }
  }

  createSensor() {
    if (!this.initialConfig) {
      console.error("DeathSensor.createSensor: initialConfig is null!");
      return;
    }
    this.setPosition(this.initialConfig.x, this.initialConfig.y);
    this.setSize(this.initialConfig.width, this.initialConfig.height);

    const bodyDef = {
      ...b2DefaultBodyDef(),
      type: STATIC,
      position: pxmVec2(this.x, this.y),
      updateBodyMass: false,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = SpriteToBox(gameState.worldId as any, this, {
      bodyDef,
      density: PHYSICS.DEATH_SENSOR.DENSITY,
      friction: PHYSICS.DEATH_SENSOR.FRICTION,
      restitution: PHYSICS.DEATH_SENSOR.RESTITUTION,
      isSensor: true,
      userData: { type: "deathSensor" },
    });

    this.bodyId = result.bodyId;

    if (this.bodyId) {
      // Pass an object with bodyId property
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      AddSpriteToWorld(gameState.worldId as any, this, { bodyId: this.bodyId });
    }
  }
}
