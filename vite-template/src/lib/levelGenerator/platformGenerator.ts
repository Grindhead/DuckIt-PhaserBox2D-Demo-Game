import * as Phaser from "phaser";

import { PHYSICS } from "@constants"; // Moved up
import Platform from "@entities/Platform";
import GameScene from "@scenes/GameScene"; // Import GameScene for type hinting

/**
 * Configuration for platform generation.
 */
export interface PlatformConfig {
  scene: GameScene;
  platformY: number;
  tileWidth: number;
  minPlatformLengthTiles: number;
  maxPlatformLengthTiles: number;
  currentX: number; // Starting X position for this platform
}

/**
 * Represents a generated platform's properties.
 */
export interface GeneratedPlatform {
  platform: Platform; // The created Platform entity
  platformPixelWidth: number; // The total pixel width of the platform
  platformCenterX: number; // The center X coordinate of the platform
  platformStartX: number; // The starting X coordinate of the platform
  totalTiles: number; // Total number of tiles (edges + middle)
  physicsMinX: number; // Minimum X in physics units
  physicsMaxX: number; // Maximum X in physics units
}

/**
 * Generates a single platform entity based on the provided configuration.
 *
 * @param config The configuration object for platform generation.
 * @returns An object containing the generated platform instance and its properties.
 */
export function generatePlatform(config: PlatformConfig): GeneratedPlatform {
  // Determine the number of middle tiles for this platform
  const platformMiddleTiles = Phaser.Math.Between(
    config.minPlatformLengthTiles,
    config.maxPlatformLengthTiles
  );
  // Total tiles including left and right edges
  const totalTiles = platformMiddleTiles + 2;
  const platformPixelWidth = totalTiles * config.tileWidth;

  // Calculate the center position for the composite Box2D body
  const platformCenterX = config.currentX + platformPixelWidth / 2;

  // Instantiate the Platform entity
  const platform = new Platform(
    config.scene,
    platformCenterX,
    config.platformY,
    platformPixelWidth,
    platformMiddleTiles
  );

  // Calculate physics boundaries (scaled to Box2D units)
  const physicsMinX = config.currentX / PHYSICS.SCALE;
  const physicsMaxX = (config.currentX + platformPixelWidth) / PHYSICS.SCALE;

  return {
    platform: platform,
    platformPixelWidth: platformPixelWidth,
    platformCenterX: platformCenterX,
    platformStartX: config.currentX, // Use the passed currentX as startX
    totalTiles: totalTiles,
    physicsMinX: physicsMinX,
    physicsMaxX: physicsMaxX,
  };
}
