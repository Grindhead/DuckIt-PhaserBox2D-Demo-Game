import * as Phaser from "phaser";
import { ASSETS } from "@constants";
import GameScene from "../scenes/GameScene";

export default class GameOverOverlay {
  scene: GameScene;
  overlay: Phaser.GameObjects.Image | null = null;

  constructor(scene: GameScene) {
    this.scene = scene;
  }

  show() {
    if (!this.overlay) {
      this.overlay = this.scene.add
        .image(
          this.scene.cameras.main.centerX,
          this.scene.cameras.main.centerY,
          ASSETS.ATLAS,
          ASSETS.UI.START
        )
        .setScrollFactor(0)
        .setInteractive()
        .setVisible(false);

      this.overlay.on("pointerdown", () => {
        this.scene.restart();
      });
    }
    this.overlay.setVisible(true);
  }

  hide() {
    if (this.overlay) {
      this.overlay.setVisible(false);
    }
  }

  destroy() {
    if (this.overlay) {
      this.overlay.destroy();
      this.overlay = null;
    }
  }
}
