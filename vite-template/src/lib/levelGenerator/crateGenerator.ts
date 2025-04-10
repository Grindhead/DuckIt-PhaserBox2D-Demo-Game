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
  cratePlacementProbability?: number; // Probability (0-1) of placing a crate (will be ignored if 1)
}

/**
 * Generates crates for a given platform based on configuration.
 * If cratePlacementProbability is 1, generates BOTH a small and a big crate.
 * Otherwise, has a chance (based on cratePlacementProbability) to generate ONE random crate.
 *
 * @param config Configuration object for crate generation.
 */
export function generateCratesForPlatform(config: CrateGenerationConfig): void {
  const {
    scene,
    platformPhysicsMinX,
    platformPhysicsMaxX,
    platformY,
    cratePlacementProbability = 0.25, // Default 25% chance for single crate
  } = config;

  const platformPixelWidth =
    (platformPhysicsMaxX - platformPhysicsMinX) * PHYSICS.SCALE;
  const platformPixelCenterX =
    platformPhysicsMinX * PHYSICS.SCALE + platformPixelWidth / 2;

  // Special case: If probability is 1, always generate both crates
  if (cratePlacementProbability === 1) {
    const smallCrateWidth = ASSETS.CRATE.SMALL.WIDTH;
    const bigCrateWidth = ASSETS.CRATE.BIG.WIDTH;
    const totalCrateWidth = smallCrateWidth + bigCrateWidth;
    const spacing = 10; // Pixels between crates

    // Check if platform is wide enough for both crates + spacing
    if (platformPixelWidth < totalCrateWidth + spacing + 20) {
      // Add some buffer
      console.warn(
        `Platform too narrow for both crates. Skipping crate generation.`
      );
      return;
    }

    // Calculate positions for side-by-side placement around the center
    const smallCrateX = platformPixelCenterX - bigCrateWidth / 2 - spacing / 2;
    const bigCrateX = platformPixelCenterX + smallCrateWidth / 2 + spacing / 2;

    // Calculate Y positions (place them *on top* of the platform)
    const smallCrateHeight = ASSETS.CRATE.SMALL.HEIGHT;
    const bigCrateHeight = ASSETS.CRATE.BIG.HEIGHT;
    const smallCrateY = platformY - smallCrateHeight / 2 - 5; // Place slightly above surface
    const bigCrateY = platformY - bigCrateHeight / 2 - 5; // Place slightly above surface

    // Create SMALL crate instance
    new Crate(
      scene,
      smallCrateX,
      smallCrateY,
      "SMALL",
      platformPhysicsMinX,
      platformPhysicsMaxX
    );

    // Create BIG crate instance
    new Crate(
      scene,
      bigCrateX,
      bigCrateY,
      "BIG",
      platformPhysicsMinX,
      platformPhysicsMaxX
    );

    console.log(
      `Generated BOTH crates on platform [${(
        platformPhysicsMinX * PHYSICS.SCALE
      ).toFixed(2)} - ${(platformPhysicsMaxX * PHYSICS.SCALE).toFixed(2)}]`
    );
  } else {
    // Original logic: Chance to generate ONE random crate
    if (Phaser.Math.FloatBetween(0, 1) > cratePlacementProbability) {
      return; // No crate this time
    }

    // Choose crate size (equal chance for now)
    const size = Phaser.Math.Between(0, 1) === 0 ? "BIG" : "SMALL";
    const crateWidth = ASSETS.CRATE[size].WIDTH;
    const crateHeight = ASSETS.CRATE[size].HEIGHT;

    // Check if platform is wide enough
    if (platformPixelWidth < crateWidth * 1.2) {
      console.warn(
        `Platform too narrow for ${size} crate. Skipping crate generation.`
      );
      return;
    }

    // Calculate spawn position (slightly offset from platform center horizontally)
    const spawnX =
      platformPixelCenterX +
      Phaser.Math.Between(-platformPixelWidth * 0.1, platformPixelWidth * 0.1);
    const spawnY = platformY - crateHeight / 2 - 5; // Place slightly above surface

    // Create the single crate instance
    new Crate(
      scene,
      spawnX,
      spawnY,
      size,
      platformPhysicsMinX,
      platformPhysicsMaxX
    );

    console.log(
      `Generated ${size} crate at (${spawnX.toFixed(2)}, ${spawnY.toFixed(
        2
      )}) on platform [${(platformPhysicsMinX * PHYSICS.SCALE).toFixed(2)} - ${(
        platformPhysicsMaxX * PHYSICS.SCALE
      ).toFixed(2)}]`
    );
  }
}
