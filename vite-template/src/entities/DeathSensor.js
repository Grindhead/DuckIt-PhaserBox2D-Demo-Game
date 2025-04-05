import * as Phaser from "phaser";
import {
  AddSpriteToWorld,
  SpriteToBox,
  STATIC,
  b2DefaultBodyDef,
  pxmVec2,
  DestroyBody,
  b2Body_SetTransform,
} from "../PhaserBox2D.js";
import { PHYSICS } from "../lib/constants";
import { gameState } from "../lib/gameState";

export default class DeathSensor extends Phaser.GameObjects.Rectangle {
  constructor(scene) {
    super(
      scene,
      PHYSICS.SENSOR.X,
      PHYSICS.SENSOR.Y,
      PHYSICS.SENSOR.WIDTH,
      PHYSICS.SENSOR.HEIGHT
    );
    this.scene = scene;
    this.initialize();
  }

  initialize() {
    // Store initial position and size
    this.initialConfig = {
      x: PHYSICS.SENSOR.X,
      y: PHYSICS.SENSOR.Y,
      width: PHYSICS.SENSOR.WIDTH,
      height: PHYSICS.SENSOR.HEIGHT,
    };

    // Add rectangle to scene
    this.scene.add.existing(this);

    // Initialize physics body
    this.createSensor();
  }

  reset() {
    // Reset position
    const { x, y } = this.initialConfig;
    const pos = pxmVec2(x, y);
    b2Body_SetTransform(gameState.worldId, this.bodyId, pos, 0);
  }

  createSensor() {
    // Create physics body for death sensor
    const bodyDef = {
      ...b2DefaultBodyDef(),
      type: STATIC,
      position: pxmVec2(this.x, this.y),
    };

    // Create the Box2D body and store its ID
    const { bodyId } = SpriteToBox(gameState.worldId, this, {
      bodyDef,
      isSensor: true,
      userData: { type: "deathSensor" },
    });

    // Store the body ID for later use
    this.bodyId = bodyId;

    // Add sprite to world with the body ID
    AddSpriteToWorld(gameState.worldId, this, bodyId);
  }

  destroy() {
    if (this.bodyId) {
      DestroyBody(gameState.worldId, this.bodyId);
    }
    super.destroy();
  }
}
