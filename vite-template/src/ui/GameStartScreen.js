import { ASSETS } from "../lib/constants";

export default class GameStartScreen {
  constructor(scene) {
    this.scene = scene;
  }

  show(isGameOver = false) {
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
      if (isGameOver) {
        this.scene.scene.restart();
      } else {
        this.destroy();
        this.scene.startGame();
      }
    });
  }

  destroy() {
    if (this.overlay) {
      this.overlay.destroy();
    }
  }
}
