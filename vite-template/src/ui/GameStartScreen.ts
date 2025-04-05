import * as Phaser from "phaser";
import { ASSETS } from "../lib/constants";

export default class GameStartScreen {
  scene: Phaser.Scene;
  overlay: Phaser.GameObjects.Image | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  show(isGameOver: boolean = false) {
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
      if (isGameOver) {
        if (typeof (this.scene as any).scene?.restart === "function") {
          (this.scene as any).scene.restart();
        } else {
          console.error("Scene does not have a scene.restart method!");
        }
      } else {
        this.destroy();
        if (typeof (this.scene as any).startGame === "function") {
          (this.scene as any).startGame();
        } else {
          console.error("Scene does not have a startGame method!");
        }
      }
    });
  }

  destroy() {
    if (this.overlay) {
      this.overlay.destroy();
      this.overlay = null;
    }
  }
}
