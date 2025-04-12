/**
 * @file levelGenerator.ts
 * @description Orchestrates procedural level generation for DuckIt.
 */
import * as Phaser from "phaser";

import { WORLD, PHYSICS } from "@constants";
import Enemy from "@entities/Enemy"; // Import Enemy type
import Platform from "@entities/Platform"; // Import Platform class
import GameScene from "@scenes/GameScene"; // Import GameScene for type hinting

// Import generator modules
import { generateCoins, CoinConfig } from "./coinGenerator";
import { generateCratesForPlatform } from "./crateGenerator";
import { generateEnemyForPlatform } from "./enemyGenerator";
import { generateGap, GapConfig } from "./gapGenerator";

/**
 * Position information for player spawning
 */
export interface PlayerSpawnPosition {
  x: number;
  y: number;
}

/**
 * Configuration for platform generation
 */
interface PlatformConfig {
  scene: GameScene;
  platformY: number;
  tileWidth: number;
  minPlatformLengthTiles: number;
  maxPlatformLengthTiles: number;
  currentX: number; // Starting X position for this platform
}

/**
 * Data structure for a platform segment in the combined platform approach
 */
interface PlatformSegment {
  startX: number;
  width: number;
  centerX: number;
  totalTiles: number;
  physicsMinX: number;
  physicsMaxX: number;
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

  // Array to store platform segment data for each platform
  const platformsData: PlatformSegment[][] = [];

  // Create a new array for the first platform
  platformsData.push([]);

  let currentX = config.edgePadding;
  let playerStartX: number;
  let playerStartY: number;

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

    // Early return with only player position if skipEntityCreation is true
    return {
      playerSpawnPosition: {
        x: playerStartX,
        y: playerStartY,
      },
      enemies: [],
      platforms: [],
    };
  }

  // --- Generate Platform Data First --- //

  // --- First Platform & Player Start --- //
  const platformConfig: PlatformConfig = {
    scene: config.scene,
    platformY: config.platformY,
    tileWidth: config.tileWidth,
    minPlatformLengthTiles: config.minPlatformLengthTiles,
    maxPlatformLengthTiles: config.maxPlatformLengthTiles,
    currentX: currentX,
  };

  // Calculate first platform data
  const firstPlatformData = calculatePlatformData(platformConfig);

  // Store segment data for the first platform
  platformsData[0].push(firstPlatformData);

  // Calculate player start position above the first platform
  playerStartX = firstPlatformData.centerX;
  playerStartY = config.platformY - 100; // 100px above the platform

  // Update currentX after the first platform
  currentX += firstPlatformData.width;

  // --- First Gap --- //
  const gapConfig: GapConfig = {
    tileWidth: config.tileWidth,
    minGapWidthTiles: config.minGapWidthTiles,
    maxGapWidthTiles: config.maxGapWidthTiles,
  };
  currentX += generateGap(gapConfig);

  // Start a new platform array (after the gap)
  platformsData.push([]);
  let currentPlatformIndex = 1;

  let platformIndex = 0; // Initialize platform counter for the loop

  // --- Generate Remaining Level Data --- //
  while (currentX < WORLD.WIDTH - config.edgePadding) {
    // --- Calculate Platform Data --- //
    const nextPlatformConfig: PlatformConfig = {
      ...platformConfig, // Inherit common config
      currentX: currentX,
    };

    // Calculate platform data (without creating it yet)
    const platformData = calculatePlatformData(nextPlatformConfig);

    // Ensure the platform doesn't exceed world bounds
    if (currentX + platformData.width > WORLD.WIDTH - config.edgePadding) {
      break; // Stop generating if the next platform won't fit
    }

    // Store segment data for the current platform
    platformsData[currentPlatformIndex].push(platformData);

    platformIndex++; // Increment platform counter

    // Update currentX after this platform
    currentX += platformData.width;

    // --- Generate Gap --- //
    const gapWidth = generateGap(gapConfig);
    currentX += gapWidth;

    // If there's a gap, start a new platform array for the next sections
    if (gapWidth > 0) {
      platformsData.push([]);
      currentPlatformIndex++;
    }
  }

  // --- Create the physical platforms --- //
  // Now we create a platform entity for each logical platform
  platformsData.forEach((segments, platformIndex) => {
    if (segments.length > 0) {
      // Create a platform for this set of segments
      const platform = createCombinedPlatform(
        scene,
        config.platformY,
        segments
      );

      // Ensure physics body is created after all segments are added
      if (platform.segments.length > 0) {
        platform.createCombinedPhysicsBody();
      }

      generatedPlatforms.push(platform);

      // --- Generate Entities on Platforms --- //
      segments.forEach((segment, segmentIndex) => {
        // --- Generate Coins --- //
        const coinConfig: CoinConfig = {
          scene: config.scene,
          coinsGroup: config.coinsGroup,
          platformStartX: segment.startX,
          platformY: config.platformY,
          totalTiles: segment.totalTiles,
          tileWidth: config.tileWidth,
        };
        generateCoins(coinConfig);

        // --- Generate Crates (Probabilistic) --- //
        if (platformIndex === 1 && segmentIndex === 0) {
          // Force spawn both crates on the second platform
          generateCratesForPlatform({
            scene: config.scene,
            platformPhysicsMinX: segment.physicsMinX,
            platformPhysicsMaxX: segment.physicsMaxX,
            platformY: config.platformY,
            forceSpawnBoth: true, // Force spawn!
          });
        } else if (platformIndex > 1) {
          // Use probabilistic generation for subsequent platforms
          generateCratesForPlatform({
            scene: config.scene,
            platformPhysicsMinX: segment.physicsMinX,
            platformPhysicsMaxX: segment.physicsMaxX,
            platformY: config.platformY,
            // Use default probability from crateGenerator.ts
          });
        }

        // --- Generate Enemies (Probabilistic) --- //
        // Skip first and second platforms for enemies
        if (platformIndex > 1) {
          console.log(
            `[LevelGenerator] Attempting to generate enemy for platform segment ${segmentIndex}`
          );
          const enemy = generateEnemyForPlatform(
            config.scene,
            segment.physicsMinX,
            segment.physicsMaxX,
            config.platformY,
            segment.totalTiles - 2 // Pass middle tile count
          );
          if (enemy) {
            generatedEnemies.push(enemy);
          }
        }
      });
    }
  });

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

/**
 * Calculates platform data without creating the platform entity
 *
 * @param config The platform configuration
 * @returns Platform segment data
 */
function calculatePlatformData(config: PlatformConfig): PlatformSegment {
  // Determine the number of middle tiles for this platform
  const platformMiddleTiles = Phaser.Math.Between(
    config.minPlatformLengthTiles,
    config.maxPlatformLengthTiles
  );
  // Total tiles including left and right edges
  const totalTiles = platformMiddleTiles + 2;
  const platformWidth = totalTiles * config.tileWidth;

  // Calculate the center position for this segment
  const platformCenterX = config.currentX + platformWidth / 2;

  // Calculate physics boundaries (scaled to Box2D units)
  const physicsMinX = config.currentX / PHYSICS.SCALE;
  const physicsMaxX = (config.currentX + platformWidth) / PHYSICS.SCALE;

  return {
    startX: config.currentX,
    width: platformWidth,
    centerX: platformCenterX,
    totalTiles: totalTiles,
    physicsMinX: physicsMinX,
    physicsMaxX: physicsMaxX,
  };
}

/**
 * Creates a combined platform from multiple platform segments
 *
 * @param scene The game scene
 * @param platformY The Y position for all platforms
 * @param segments Array of platform segment data
 * @returns A single Platform instance with multiple visual segments
 */
function createCombinedPlatform(
  scene: GameScene,
  platformY: number,
  segments: PlatformSegment[]
): Platform {
  // Calculate the overall bounds of the combined platform
  let minX = Infinity;
  let maxX = -Infinity;

  segments.forEach((segment) => {
    minX = Math.min(minX, segment.startX);
    maxX = Math.max(maxX, segment.startX + segment.width);
  });

  const totalWidth = maxX - minX;
  const centerX = minX + totalWidth / 2;

  // Create a single platform with the correct total width
  // We'll pass 0 for middleTileCount as we'll handle the visuals differently
  const platform = new Platform(
    scene,
    centerX,
    platformY,
    totalWidth,
    0, // Will be properly set when adding segments
    true // This is a combined platform
  );

  // For each segment, add its visual representation to the platform
  segments.forEach((segment) => {
    platform.addPlatformSegment(
      segment.centerX,
      platformY,
      segment.width,
      segment.totalTiles - 2 // Convert total tiles to middle tiles count
    );
  });

  return platform;
}
