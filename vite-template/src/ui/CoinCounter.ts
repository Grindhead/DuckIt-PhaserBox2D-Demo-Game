/**
 * @file CoinCounter.ts
 * @description Manages the display of the player's collected coin count.
 * Creates and updates a text object in the top-right corner of the screen.
 */
import * as Phaser from "phaser";

import { UI } from "@constants";
import { gameState } from "@gameState";

export default class CoinCounter {
  scene: Phaser.Scene;
  text: Phaser.GameObjects.Text | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.createText();
  }

  createText() {
    const initialCoins = gameState.getCoins();
    this.text = this.scene.add
      .text(
        this.scene.cameras.main.width - UI.COIN_COUNTER.OFFSET.x,
        UI.COIN_COUNTER.OFFSET.y,
        `Coins: ${initialCoins}`,
        {
          fontSize: UI.COIN_COUNTER.FONT_SIZE,
          color: UI.COIN_COUNTER.COLOR,
          align: "right",
        }
      )
      .setOrigin(1, 0);
    this.text.setScrollFactor(0);
  }

  updateCount() {
    if (this.text) {
      const currentCoins = gameState.getCoins();
      this.text.setText(`Coins: ${currentCoins}`);
    }
  }

  destroy() {
    if (this.text) {
      this.text.destroy();
    }
  }
}
