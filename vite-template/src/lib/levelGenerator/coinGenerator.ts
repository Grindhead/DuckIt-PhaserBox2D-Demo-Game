import * as Phaser from "phaser";

import Coin from "@entities/Coin";
import GameScene from "@scenes/GameScene";

/**
 * Configuration for coin generation.
 */
export interface CoinConfig {
  scene: GameScene;
  coinsGroup: Phaser.GameObjects.Group;
  platformStartX: number;
  platformY: number;
  totalTiles: number;
  tileWidth: number;
}

/**
 * Generates coins and places them on a platform.
 *
 * @param config The configuration object for coin generation.
 */
export function generateCoins(config: CoinConfig): void {
  const coinY = config.platformY - 40; // Place coins slightly above the platform
  // Place coins based on the number of *tiles* (edges + middle)
  for (let i = 0; i < config.totalTiles; i++) {
    const coinX =
      config.platformStartX + config.tileWidth / 2 + i * config.tileWidth;
    // Add a small random horizontal offset
    const offsetX = Phaser.Math.Between(-5, 5);
    const coin = new Coin(config.scene, coinX + offsetX, coinY); // Create coin
    config.coinsGroup.add(coin); // Add to group
  }
}
