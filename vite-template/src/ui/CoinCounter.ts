import { UI } from "../lib/constants";

export default class CoinCounter {
  constructor(scene) {
    this.scene = scene;
    this.coins = 0;
    this.createText();
  }

  createText() {
    this.text = this.scene.add.text(
      this.scene.cameras.main.width - UI.COIN_COUNTER.OFFSET.x,
      UI.COIN_COUNTER.OFFSET.y,
      "Coins: 0",
      {
        fontSize: UI.COIN_COUNTER.FONT_SIZE,
        color: UI.COIN_COUNTER.COLOR,
      }
    );
    this.text.setScrollFactor(0);
  }

  updateCount(coins) {
    this.coins = coins;
    this.text.setText(`Coins: ${this.coins}`);
  }

  destroy() {
    if (this.text) {
      this.text.destroy();
    }
  }
}
