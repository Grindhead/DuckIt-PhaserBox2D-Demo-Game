/**
 * @file CoinCounter.ts
 * @description Manages the display of the player's collected coin count.
 * Creates and updates a text object in the top-right corner of the screen.
 */
import * as Phaser from "phaser";

import { UI } from "@constants";

export default class CoinCounter {
  scene: Phaser.Scene;
  coins: number;
  text: Phaser.GameObjects.Text | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.coins = 0;
    this.createText();
  }

  createText() {
    this.text = this.scene.add.text(
      this.scene.cameras.main.width - UI.COIN_COUNTER.OFFSET.x,
      UI.COIN_COUNTER.OFFSET.y,
      `Coins: ${this.coins}`,
      {
        fontSize: UI.COIN_COUNTER.FONT_SIZE,
        color: UI.COIN_COUNTER.COLOR,
      }
    );
    this.text.setScrollFactor(0);
  }

  updateCount(coins: number) {
    this.coins = coins;
    if (this.text) {
      this.text.setText(`Coins: ${this.coins}`);
    }
  }

  destroy() {
    if (this.text) {
      this.text.destroy();
    }
  }
}
