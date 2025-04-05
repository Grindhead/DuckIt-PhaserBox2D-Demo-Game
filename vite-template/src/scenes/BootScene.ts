/**
 * @file BootScene.ts
 * @description The very first scene that runs when the game starts.
 * Its primary role is to immediately transition to the PreloaderScene,
 * which handles asset loading.
 */
import * as Phaser from "phaser";

import { SCENES } from "@constants";

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.BOOT });
  }

  create() {
    this.scene.start(SCENES.PRELOADER);
  }
}
