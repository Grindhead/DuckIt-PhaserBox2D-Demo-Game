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
