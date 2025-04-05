import { ASSETS } from "../lib/constants";

export default class GameOverOverlay {
  constructor(scene) {
    this.scene = scene;
  }

  show() {
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
      this.scene.restart();
    });
  }

  destroy() {
    if (this.overlay) {
      this.overlay.destroy();
    }
  }
}
