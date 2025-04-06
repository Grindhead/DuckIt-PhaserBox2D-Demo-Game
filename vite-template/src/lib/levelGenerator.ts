/**
 * @file levelGenerator.ts
 * @description Contains the procedural level generation logic for DuckIt.
 */
import * as Phaser from "phaser";

import { WORLD } from "@constants";
import Coin from "@entities/Coin"; // Moved import order
import Platform from "@entities/Platform"; // Import the new Platform entity
import GameScene from "@scenes/GameScene"; // Import GameScene for type hinting and accessing its methods

/**
 * Generates the level by placing composite platforms procedurally.
 * @param scene The GameScene instance to add platforms to.
 */
export function generateLevel(scene: GameScene): void {
  const platformY = 600;
  const tileWidth = 26; // Width of a single platform tile (from assets.json)
  const minPlatformLengthTiles = 3; // Min number of middle tiles
  const maxPlatformLengthTiles = 10; // Max number of middle tiles
  const minGapWidthTiles = 2; // Minimum gap width in tiles
  const maxGapWidthTiles = 5; // Maximum gap width in tiles
  const edgePadding = 100; // Padding from world edges

  let currentX = edgePadding;

  while (currentX < WORLD.WIDTH - edgePadding) {
    // Determine the number of middle tiles for this platform
    const platformMiddleTiles = Phaser.Math.Between(
      minPlatformLengthTiles,
      maxPlatformLengthTiles
    );
    // Total tiles including left and right edges
    const totalTiles = platformMiddleTiles + 2;
    const platformPixelWidth = totalTiles * tileWidth;

    // Calculate the center position for the composite Box2D body
    const platformCenterX = currentX + platformPixelWidth / 2;

    // Ensure the platform doesn't exceed world bounds
    if (currentX + platformPixelWidth > WORLD.WIDTH - edgePadding) {
      break; // Stop generating if the next platform won't fit
    }

    // Instantiate the Platform entity instead
    new Platform(
      scene, // Pass the scene context
      platformCenterX,
      platformY,
      platformPixelWidth,
      platformMiddleTiles
    );

    // Store the start X before updating currentX for coin placement
    const platformStartX = currentX;

    // --- Coin Placement ---
    const coinY = platformY - 40; // Place coins slightly above the platform
    // Place coins based on the number of *tiles* (edges + middle)
    for (let i = 0; i < totalTiles; i++) {
      const coinX = platformStartX + tileWidth / 2 + i * tileWidth;
      // Add a small random horizontal offset
      const offsetX = Phaser.Math.Between(-5, 5);
      new Coin(scene, coinX + offsetX, coinY);
    }
    // --- End Coin Placement ---

    // Update currentX to the position after this platform
    currentX += platformPixelWidth;

    // --- Gap Generation ---
    const gapWidthTiles = Phaser.Math.Between(
      minGapWidthTiles,
      maxGapWidthTiles
    );
    const gapPixelWidth = gapWidthTiles * tileWidth;
    currentX += gapPixelWidth;
    // --- End Gap Generation ---
  }
}
