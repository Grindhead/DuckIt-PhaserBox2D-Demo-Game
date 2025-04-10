/**
 * @file levelGenerator.ts
 * @description Orchestrates procedural level generation for DuckIt.
 */
import * as Phaser from "phaser";

import { WORLD } from "@constants";
import GameScene from "@scenes/GameScene"; // Import GameScene for type hinting

// Import generator modules
import { generateCoins, CoinConfig } from "./coinGenerator";
import { generateGap, GapConfig } from "./gapGenerator";
import {
  generatePlatform,
  PlatformConfig,
  GeneratedPlatform,
} from "./platformGenerator";

/**
 * Position information for player spawning
 */
export interface PlayerSpawnPosition {
  x: number;
  y: number;
}

/**
 * Configuration for the overall level generation process.
 */
interface LevelGenerationConfig {
  scene: GameScene;
  coinsGroup: Phaser.GameObjects.Group;
  platformY: number;
  tileWidth: number;
  minPlatformLengthTiles: number;
  maxPlatformLengthTiles: number;
  minGapWidthTiles: number;
  maxGapWidthTiles: number;
  edgePadding: number;
}

/**
 * Generates the level by orchestrating platform, coin, and gap generation.
 * @param scene The GameScene instance to add elements to.
 * @param coinsGroup The Phaser Group to add created Coin instances to.
 * @returns Player spawn position calculated based on the first platform.
 */
export function generateLevel(
  scene: GameScene,
  coinsGroup: Phaser.GameObjects.Group
): PlayerSpawnPosition {
  // --- Configuration --- //
  const config: LevelGenerationConfig = {
    scene: scene,
    coinsGroup: coinsGroup,
    platformY: 600,
    tileWidth: 26,
    minPlatformLengthTiles: 3,
    maxPlatformLengthTiles: 10,
    minGapWidthTiles: 2,
    maxGapWidthTiles: 5,
    edgePadding: 100,
  };

  let currentX = config.edgePadding;

  // --- First Platform & Player Start --- //
  const platformConfig: PlatformConfig = {
    scene: config.scene,
    platformY: config.platformY,
    tileWidth: config.tileWidth,
    minPlatformLengthTiles: config.minPlatformLengthTiles,
    maxPlatformLengthTiles: config.maxPlatformLengthTiles,
    currentX: currentX,
  };

  const firstPlatformData: GeneratedPlatform = generatePlatform(platformConfig);

  // Calculate player start position above the first platform
  const playerStartX = firstPlatformData.platformCenterX;
  const playerStartY = config.platformY - 100; // 100px above the platform

  // --- Coins for First Platform --- //
  const firstCoinConfig: CoinConfig = {
    scene: config.scene,
    coinsGroup: config.coinsGroup,
    platformStartX: firstPlatformData.platformStartX,
    platformY: config.platformY,
    totalTiles: firstPlatformData.totalTiles,
    tileWidth: config.tileWidth,
  };
  generateCoins(firstCoinConfig);

  // Update currentX after the first platform
  currentX += firstPlatformData.platformPixelWidth;

  // --- First Gap --- //
  const gapConfig: GapConfig = {
    tileWidth: config.tileWidth,
    minGapWidthTiles: config.minGapWidthTiles,
    maxGapWidthTiles: config.maxGapWidthTiles,
  };
  currentX += generateGap(gapConfig);

  // --- Generate Remaining Level --- //
  while (currentX < WORLD.WIDTH - config.edgePadding) {
    // --- Generate Platform --- //
    const nextPlatformConfig: PlatformConfig = {
      ...platformConfig, // Inherit common config
      currentX: currentX,
    };
    const platformData: GeneratedPlatform =
      generatePlatform(nextPlatformConfig);

    // Ensure the platform doesn't exceed world bounds
    if (
      currentX + platformData.platformPixelWidth >
      WORLD.WIDTH - config.edgePadding
    ) {
      break; // Stop generating if the next platform won't fit
    }

    // --- Generate Coins --- //
    const coinConfig: CoinConfig = {
      scene: config.scene,
      coinsGroup: config.coinsGroup,
      platformStartX: platformData.platformStartX,
      platformY: config.platformY,
      totalTiles: platformData.totalTiles,
      tileWidth: config.tileWidth,
    };
    generateCoins(coinConfig);

    // Update currentX after this platform
    currentX += platformData.platformPixelWidth;

    // --- Generate Gap --- //
    currentX += generateGap(gapConfig);
  }

  // Return the player spawn position
  return {
    x: playerStartX,
    y: playerStartY,
  };
}
