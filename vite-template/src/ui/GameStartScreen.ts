/**
 * @file GameStartScreen.ts
 * @description Manages the initial start screen overlay.
 * This screen is displayed when the game first loads and allows the player
 * to initiate the game start or restart after a game over.
 */
import * as Phaser from "phaser";
import { ASSETS } from "@constants";
import GameScene from "@scenes/GameScene";
import { gameState } from "@gameState";

export default class GameStartScreen {
  scene: GameScene;
  overlay: Phaser.GameObjects.Image | null = null;

  constructor(scene: GameScene) {
    this.scene = scene;
    this.createOverlay();
  }

  createOverlay() {
    if (this.overlay) return;

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
      if (gameState.isGameOver) {
        if (typeof this.scene.scene?.restart === "function") {
          this.scene.scene.restart();
        } else {
          console.error("Scene does not have a scene.restart method!");
        }
      } else {
        this.hide();
        if (typeof this.scene.startGame === "function") {
          this.scene.startGame();
        } else {
          console.error("Scene does not have a startGame method!");
        }
      }
    });
  }

  show() {
    if (this.overlay) {
      this.overlay.setVisible(true);
    }
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
