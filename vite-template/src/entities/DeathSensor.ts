import * as Phaser from "phaser";

import { PHYSICS, WORLD } from "@constants";
import { gameState } from "@gameState";
// Import runtime values/functions via alias
import {
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

export default class DeathSensor {
  scene: Phaser.Scene;
  bodyId: ReturnType<typeof b2CreateBody> | null = null;
  marker: Phaser.GameObjects.Rectangle | null = null;

  /**
   * Creates a new death sensor at the specified position
   * @param scene The scene to add the sensor to
   */
  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    const { x, y, width, height } = this.calculateInitialConfig();

    // Create the body
    this.createPhysicsBody(x, y, width, height);

    // Optionally create a visual marker for debugging
    this.createDebugMarker(x, y, width, height);
  }

  /**
   * Calculate the initial configuration for the death sensor
   * @returns The initial configuration
   */
  private calculateInitialConfig(): InitialConfig {
    // Position the death sensor 200px below the lowest platform
    // The lowest platform is at y = 600 (as defined in the levelGenerator)
    const lowestPlatformY = 600;
    const sensorY = lowestPlatformY + 200; // 200px below the platform

    return {
      x: WORLD.WIDTH / 2,
      y: sensorY,
      width: WORLD.WIDTH, // Cover the entire width of the world
      height: PHYSICS.DEATH_SENSOR.HEIGHT,
    };
  }

  /**
   * Create the Box2D physics body for the death sensor
   * @param x X position
   * @param y Y position
   * @param width Width of the sensor
   * @param height Height of the sensor
   */
  private createPhysicsBody(
    x: number,
    y: number,
    width: number,
    height: number
  ) {
    // Create body definition
    const bodyDef = {
      ...b2DefaultBodyDef(),
      type: STATIC,
      position: new b2Vec2(x / PHYSICS.SCALE, -y / PHYSICS.SCALE),
      allowSleep: false,
    };

    // Create the body
    this.bodyId = b2CreateBody(gameState.worldId, bodyDef);

    if (!this.bodyId) {
      console.error("Failed to create death sensor body");
      return;
    }

    // Create shape definition
    const shapeDef = {
      ...b2DefaultShapeDef(),
      density: PHYSICS.DEATH_SENSOR.DENSITY,
      friction: PHYSICS.DEATH_SENSOR.FRICTION,
      restitution: PHYSICS.DEATH_SENSOR.RESTITUTION,
      isSensor: true, // Important: this is a sensor, not a solid body
      userData: { type: "deathSensor" }, // Used to identify collisions
    };

    // Create box shape
    const halfWidth = width / (2 * PHYSICS.SCALE);
    const halfHeight = height / (2 * PHYSICS.SCALE);
    const box = b2MakeBox(halfWidth, halfHeight);

    // Create the shape
    b2CreatePolygonShape(this.bodyId, shapeDef, box);

    console.log(
      `Death sensor created at y=${y} (${
        y / PHYSICS.SCALE
      }m), width=${width}, height=${height}`
    );
  }

  /**
   * Create a visual marker for debugging
   * @param x X position
   * @param y Y position
   * @param width Width of the sensor
   * @param height Height of the sensor
   */
  private createDebugMarker(
    x: number,
    y: number,
    width: number,
    height: number
  ) {
    if (!PHYSICS.DEATH_SENSOR.VISIBLE) return;
    // Create a visual marker for debugging (optional - can be removed in production)
    this.marker = this.scene.add.rectangle(x, y, width, height, 0xff0000, 0.3);
    this.marker.setDepth(100); // Make sure it's visible above other elements
  }

  /**
   * Clean up the death sensor (called when the scene is destroyed)
   */
  destroy() {
    if (this.bodyId) {
      b2DestroyBody(this.bodyId);
      this.bodyId = null;
    }

    if (this.marker) {
      this.marker.destroy();
      this.marker = null;
    }
  }
}
