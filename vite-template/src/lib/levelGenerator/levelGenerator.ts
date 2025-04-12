/**
 * @file levelGenerator.ts
 * @description Orchestrates procedural level generation for DuckIt.
 */
import * as Phaser from "phaser";

import { WORLD } from "@constants";
import Enemy from "@entities/Enemy"; // Import Enemy type
import Platform from "@entities/Platform"; // Import Platform class
import GameScene from "@scenes/GameScene"; // Import GameScene for type hinting

// Import generator modules
import { generateCoins, CoinConfig } from "./coinGenerator";
import { generateCratesForPlatform } from "./crateGenerator";
import { generateEnemyForPlatform } from "./enemyGenerator";
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
 * Data structure returned by generateLevel
 */
export interface GeneratedLevelData {
  playerSpawnPosition: PlayerSpawnPosition;
  enemies: Enemy[]; // Use imported Enemy type
  platforms: Platform[]; // Store all platform instances
}

/**
 * Modified version of GeneratedPlatform for when skipEntityCreation is true
 */
interface MockPlatformData {
  platform: null;
  platformStartX: number;
  platformCenterX: number;
  platformPixelWidth: number;
  totalTiles: number;
  physicsMinX: number;
  physicsMaxX: number;
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
 * @param skipEntityCreation If true, only calculate positions without creating entities
 * @returns Player spawn position calculated based on the first platform.
 */
export function generateLevel(
  scene: GameScene,
  coinsGroup: Phaser.GameObjects.Group,
  skipEntityCreation: boolean = false
): GeneratedLevelData {
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

  const generatedEnemies: Enemy[] = []; // Array to store generated enemies
  const generatedPlatforms: Platform[] = []; // Array to store all platforms

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

  let playerStartX: number;
  let playerStartY: number;
  let platformWidth: number;

  // If skipEntityCreation is true, we'll only calculate positions without creating entities
  if (skipEntityCreation) {
    // Create a mock platform data without creating actual entities
    const averageTiles = 5;
    const mockData: MockPlatformData = {
      platform: null,
      platformStartX: currentX,
      platformCenterX: currentX + (averageTiles * config.tileWidth) / 2,
      platformPixelWidth: averageTiles * config.tileWidth,
      totalTiles: averageTiles,
      physicsMinX: currentX,
      physicsMaxX: currentX + averageTiles * config.tileWidth,
    };

    // Calculate player start position above the mock platform
    playerStartX = mockData.platformCenterX;
    playerStartY = config.platformY - 100; // 100px above the platform
    platformWidth = mockData.platformPixelWidth;

    // Early return with only player position if skipEntityCreation is true
    return {
      playerSpawnPosition: {
        x: playerStartX,
        y: playerStartY,
      },
      enemies: [],
      platforms: [],
    };
  } else {
    // Actually generate the platform and entities
    const firstPlatformData = generatePlatform(platformConfig);
    generatedPlatforms.push(firstPlatformData.platform); // Track the first platform

    // Calculate player start position above the first platform
    playerStartX = firstPlatformData.platformCenterX;
    playerStartY = config.platformY - 100; // 100px above the platform
    platformWidth = firstPlatformData.platformPixelWidth;

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
  }

  // Update currentX after the first platform
  currentX += platformWidth;

  // --- First Gap --- //
  const gapConfig: GapConfig = {
    tileWidth: config.tileWidth,
    minGapWidthTiles: config.minGapWidthTiles,
    maxGapWidthTiles: config.maxGapWidthTiles,
  };
  currentX += generateGap(gapConfig);

  let platformIndex = 0; // Initialize platform counter for the loop

  // --- Generate Remaining Level --- //
  while (currentX < WORLD.WIDTH - config.edgePadding) {
    // --- Generate Platform --- //
    const nextPlatformConfig: PlatformConfig = {
      ...platformConfig, // Inherit common config
      currentX: currentX,
    };
    const platformData: GeneratedPlatform =
      generatePlatform(nextPlatformConfig);
    generatedPlatforms.push(platformData.platform); // Track the platform

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

    platformIndex++; // Increment platform counter

    // --- Generate Crates (Probabilistic) --- //
    if (platformIndex === 1) {
      // Force spawn both crates on the second platform (index 1)
      generateCratesForPlatform({
        scene: config.scene,
        platformPhysicsMinX: platformData.physicsMinX,
        platformPhysicsMaxX: platformData.physicsMaxX,
        platformY: config.platformY,
        forceSpawnBoth: true, // Force spawn!
      });
    } else if (platformIndex > 1) {
      // Use probabilistic generation for subsequent platforms
      generateCratesForPlatform({
        scene: config.scene,
        platformPhysicsMinX: platformData.physicsMinX,
        platformPhysicsMaxX: platformData.physicsMaxX,
        platformY: config.platformY,
        // Use default probability from crateGenerator.ts
      });
    }

    // --- Generate Enemies (Probabilistic) --- //
    console.log(
      `[LevelGenerator] Checking enemy spawn for platformIndex: ${platformIndex}`
    ); // Log index check
    // Skip first and second platforms for enemies
    if (platformIndex > 1) {
      console.log(
        `[LevelGenerator] Attempting to generate enemy for platform ${platformIndex}`
      ); // Log attempt
      const enemy = generateEnemyForPlatform(
        config.scene,
        platformData.physicsMinX,
        platformData.physicsMaxX,
        config.platformY,
        platformData.totalTiles - 2 // Pass middle tile count
      );
      if (enemy) {
        generatedEnemies.push(enemy);
      }
    }

    // Update currentX after this platform
    currentX += platformData.platformPixelWidth;

    // --- Generate Gap --- //
    currentX += generateGap(gapConfig);
  }

  // Return the player spawn position and generated enemies
  return {
    playerSpawnPosition: {
      x: playerStartX,
      y: playerStartY,
    },
    enemies: generatedEnemies,
    platforms: generatedPlatforms,
  };
}
