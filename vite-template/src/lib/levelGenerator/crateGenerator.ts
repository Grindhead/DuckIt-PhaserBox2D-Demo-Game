/**
 * @file crateGenerator.ts
 * @description Handles the generation of crates on platforms within the level.
 */
import * as Phaser from "phaser";

import { ASSETS, PHYSICS } from "@constants";
import Crate from "@entities/Crate";
import GameScene from "@scenes/GameScene"; // Import GameScene for type hinting

interface CrateGenerationConfig {
  scene: GameScene;
  platformPhysicsMinX: number;
  platformPhysicsMaxX: number;
  platformY: number; // Pixel Y position of the platform surface
  cratePlacementProbability?: number; // Probability (0-1) of placing a crate
}

/**
 * Generates crates for a given platform based on configuration.
 * Currently places at most one crate per platform, near the center.
 *
 * @param config Configuration object for crate generation.
 */
export function generateCratesForPlatform(config: CrateGenerationConfig): void {
  const {
    scene,
    platformPhysicsMinX,
    platformPhysicsMaxX,
    platformY,
    cratePlacementProbability = 0.25, // Default 25% chance
  } = config;

  // Decide whether to place a crate on this platform
  if (Phaser.Math.FloatBetween(0, 1) > cratePlacementProbability) {
    return; // No crate this time
  }

  // Choose crate size (equal chance for now)
  const size = Phaser.Math.Between(0, 1) === 0 ? "BIG" : "SMALL";

  // Calculate spawn position (slightly offset from platform center horizontally)
  // Ensure the position is in *pixel* coordinates for the Crate constructor
  const platformPixelWidth =
    (platformPhysicsMaxX - platformPhysicsMinX) * PHYSICS.SCALE;
  const platformPixelCenterX =
    platformPhysicsMinX * PHYSICS.SCALE + platformPixelWidth / 2;
  const spawnX =
    platformPixelCenterX +
    Phaser.Math.Between(-platformPixelWidth * 0.1, platformPixelWidth * 0.1); // Small random offset from center

  // Calculate Y position (place it *on top* of the platform)
  // Crate constructor uses pixel coordinates, origin is center by default
  const crateHeight = ASSETS.CRATE[size].HEIGHT; // Assuming HEIGHT is defined in constants (pixels)
  const spawnY = platformY - crateHeight / 2 - 5; // Place slightly above surface

  // Check if platform is wide enough for the chosen crate (optional, but good practice)
  const crateWidth = ASSETS.CRATE[size].WIDTH; // Assuming WIDTH is defined in constants (pixels)
  if (platformPixelWidth < crateWidth * 1.2) {
    // Need some extra space
    console.warn(
      `Platform too narrow for ${size} crate. Skipping crate generation.`
    );
    return;
  }

  // Create the crate instance
  new Crate(
    scene,
    spawnX,
    spawnY,
    size,
    platformPhysicsMinX, // Pass physics boundary X min
    platformPhysicsMaxX // Pass physics boundary X max
  );

  console.log(
    `Generated ${size} crate at (${spawnX.toFixed(2)}, ${spawnY.toFixed(
      2
    )}) on platform [${(platformPhysicsMinX * PHYSICS.SCALE).toFixed(2)} - ${(
      platformPhysicsMaxX * PHYSICS.SCALE
    ).toFixed(2)}]`
  );
}
