/**
 * @file GameOverOverlay.ts
 * @description Manages the game over overlay screen.
 * This screen is displayed when the player dies or completes the level,
 * prompting them to restart.
 */
import * as Phaser from "phaser";

import { ASSETS } from "@constants";
import GameScene from "@scenes/GameScene";

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
          ASSETS.UI.GAME_OVER
        )
        .setScrollFactor(0)
        .setInteractive({ cursor: "pointer" })
        .setVisible(false);

      this.overlay.on("pointerdown", () => {
        // Log click for debugging
        console.log("Game over overlay clicked, restarting game");

        // Hide the overlay immediately on click
        this.hide();

        // Call restart method on the scene
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
