/**
 * @file levelGenerator.ts
 * @description Contains the procedural level generation logic for DuckIt.
 */
import * as Phaser from "phaser";

import { WORLD } from "@constants";
import Coin from "@entities/Coin"; // Moved import order
import GameScene from "@scenes/GameScene"; // Import GameScene for type hinting and accessing its methods

/**
 * Generates the level by placing platforms procedurally.
 * @param scene The GameScene instance to add platforms to.
 */
export function generateLevel(scene: GameScene): void {
  // Basic procedural generation logic
  const platformY = 600; // Base Y position for platforms
  const tileWidth = 26; // Width of a single platform tile (from assets.json)
  const minPlatformLength = 3; // Minimum number of tiles per platform
  const maxPlatformLength = 10; // Maximum number of tiles per platform
  const minGapWidth = 2; // Minimum gap width in tiles
  const maxGapWidth = 5; // Maximum gap width in tiles

  let currentX = 100; // Start a bit from the left edge

  while (currentX < WORLD.WIDTH - 100) {
    // Generate until near the world width
    // Determine platform length
    const platformLength = Phaser.Math.Between(
      minPlatformLength,
      maxPlatformLength
    );

    const platformStartX = currentX; // Use const as it's not reassigned
    let platformEndX = currentX; // Track where the platform ends

    // Create left edge
    scene.createPlatformSegment(platformEndX, platformY, "left");
    platformEndX += tileWidth;

    // Create middle segments
    for (let i = 0; i < platformLength; i++) {
      // Check if we are exceeding world bounds before placing tile
      if (platformEndX + tileWidth > WORLD.WIDTH - 100) break;
      scene.createPlatformSegment(platformEndX, platformY, "middle");
      platformEndX += tileWidth;
    }

    // Create right edge
    // Check if we are exceeding world bounds before placing tile
    if (platformEndX + tileWidth <= WORLD.WIDTH - 100) {
      scene.createPlatformSegment(platformEndX, platformY, "right");
      platformEndX += tileWidth;
    }

    // Update currentX to the end of the platform
    currentX = platformEndX;

    // Place coins on the platform just created
    const coinY = platformY - 40; // Place coins slightly above the platform
    const numCoins = platformLength + 1; // One coin per tile, plus one for the edges
    for (let i = 0; i < numCoins; i++) {
      const coinX = platformStartX + tileWidth / 2 + i * tileWidth;
      // Add a small random horizontal offset
      const offsetX = Phaser.Math.Between(-5, 5);
      new Coin(scene, coinX + offsetX, coinY);
    }

    // Determine gap width
    const gapWidth = Phaser.Math.Between(minGapWidth, maxGapWidth) * tileWidth;
    currentX += gapWidth;
  }
}
