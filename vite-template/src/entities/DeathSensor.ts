import * as Phaser from "phaser";

import { PHYSICS, WORLD } from "@constants";
import { gameState } from "@gameState";
// Import runtime values/functions via alias
import {
  AddSpriteToWorld,
  STATIC,
  b2DefaultBodyDef,
  b2DestroyBody,
  b2Vec2,
  b2CreateBody,
  b2DefaultShapeDef,
  b2MakeBox,
  b2CreatePolygonShape,
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
      position: new b2Vec2(this.x / PHYSICS.SCALE, -this.y / PHYSICS.SCALE), // Scale and negate Y for Box2D
    };

    // Create the body directly
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bodyId = b2CreateBody(gameState.worldId as any, bodyDef);
    this.bodyId = bodyId;

    if (!bodyId) {
      console.error("Failed to create death sensor physics body!");
      return;
    }

    // Define the shape
    const shapeDef = {
      ...b2DefaultShapeDef(),
      isSensor: true,
      enableContactEvents: true,
      density: PHYSICS.DEATH_SENSOR.DENSITY,
      friction: PHYSICS.DEATH_SENSOR.FRICTION,
      restitution: PHYSICS.DEATH_SENSOR.RESTITUTION,
      userData: { type: "deathSensor" },
    };

    // Create the box geometry with proper scaling (in meters)
    const halfWidth = this.width / (2 * PHYSICS.SCALE);
    const halfHeight = this.height / (2 * PHYSICS.SCALE);

    const box = b2MakeBox(halfWidth, halfHeight);

    // Create the polygon shape and attach it to the body
    b2CreatePolygonShape(bodyId, shapeDef, box);

    if (bodyId) {
      // Pass an object with bodyId property
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      AddSpriteToWorld(gameState.worldId as any, this, { bodyId });
    }
  }
}
