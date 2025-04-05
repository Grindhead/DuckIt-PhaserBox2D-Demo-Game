import * as Phaser from "phaser";
import { ASSETS } from "../lib/constants";
import GameScene from "../scenes/GameScene";

export default class GameOverOverlay {
  scene: Phaser.Scene;
  overlay: Phaser.GameObjects.Image | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  show() {
    if (this.overlay) {
      this.overlay.destroy();
    }
    this.overlay = this.scene.add
      .image(
        this.scene.cameras.main.centerX,
        this.scene.cameras.main.centerY,
        ASSETS.ATLAS,
        ASSETS.UI.START
      )
      .setScrollFactor(0)
      .setInteractive();

    this.overlay.on("pointerdown", () => {
      (this.scene as GameScene).restart();
    });
  }

  destroy() {
    if (this.overlay) {
      this.overlay.destroy();
      this.overlay = null;
    }
  }
}
