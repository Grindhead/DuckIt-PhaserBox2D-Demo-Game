import * as Phaser from "phaser";
import {
  AddSpriteToWorld,
  SpriteToBox,
  STATIC,
  b2DefaultBodyDef,
  pxmVec2,
  b2Body_SetTransform,
} from "../lib/PhaserBox2D.js";
import { PHYSICS, WORLD } from "../lib/constants.js";
import { gameState } from "../lib/gameState";
import { b2BodyDef } from "../../../types/include/types_h";

interface InitialConfig {
  x: number;
  y: number;
  width: number;
  height: number;
}

export default class DeathSensor extends Phaser.GameObjects.Rectangle {
  scene: Phaser.Scene;
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

  reset() {
    if (!this.initialConfig || !this.bodyId) return;
    const { x, y } = this.initialConfig;
    const pos = pxmVec2(x, y);
    b2Body_SetTransform(this.bodyId, pos);
  }

  createSensor() {
    const bodyDef: b2BodyDef = {
      ...b2DefaultBodyDef(),
      type: STATIC,
      position: pxmVec2(this.x, this.y),
      updateBodyMass: false,
    };

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
      AddSpriteToWorld(gameState.worldId as any, this, this.bodyId);
    }
  }
}
