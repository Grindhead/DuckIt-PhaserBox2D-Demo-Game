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
  forceSpawnBoth?: boolean; // Flag to force spawning both crates
}

/**
 * Generates crates for a given platform based on configuration.
 * If `forceSpawnBoth` is true, generates BOTH a small and a big crate.
 * Otherwise, has a chance (based on `cratePlacementProbability`) to generate ONE random crate.
 *
 * @param config Configuration object for crate generation.
 * @returns Array of created Crate instances
 */
export function generateCratesForPlatform(
  config: CrateGenerationConfig
): Crate[] {
  const {
    scene,
    platformPhysicsMinX,
    platformPhysicsMaxX,
    platformY,
    cratePlacementProbability = 0.25, // Default 25% chance for single crate
    forceSpawnBoth = false, // Default to false
  } = config;

  const createdCrates: Crate[] = [];
  const platformPixelWidth =
    (platformPhysicsMaxX - platformPhysicsMinX) * PHYSICS.SCALE;
  const platformPixelCenterX =
    platformPhysicsMinX * PHYSICS.SCALE + platformPixelWidth / 2;

  // Special case: If forceSpawnBoth is true, always generate both crates
  if (forceSpawnBoth) {
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
      return createdCrates;
    }

    // Calculate positions for side-by-side placement around the center
    const smallCrateX = platformPixelCenterX - bigCrateWidth / 2 - spacing / 2;
    const bigCrateX = platformPixelCenterX + smallCrateWidth / 2 + spacing / 2;

    // Calculate Y positions (place them ON the platform)
    // Using the physics body definition from physics.xml:
    // - Small crate polygon height: 36px (from -15 to 21 vertices)
    // - Big crate polygon height: 53px (from -23 to 30 vertices)
    const smallCrateHeight = ASSETS.CRATE.SMALL.HEIGHT;
    const bigCrateHeight = ASSETS.CRATE.BIG.HEIGHT;

    // Adjust positions to align the physics bodies with the platform top surface
    // The physics vertex Y values are relative to center point
    const smallCratePhysicsBottom = 15; // Based on physics.xml definition
    const bigCratePhysicsBottom = 23; // Based on physics.xml definition

    // Position crates so their physics bodies rest exactly on the platform
    const smallCrateY = platformY - smallCratePhysicsBottom;
    const bigCrateY = platformY - bigCratePhysicsBottom;

    // Create SMALL crate instance
    const smallCrate = new Crate(
      scene,
      smallCrateX,
      smallCrateY,
      "SMALL",
      platformPhysicsMinX,
      platformPhysicsMaxX
    );
    createdCrates.push(smallCrate);

    // Create BIG crate instance
    const bigCrate = new Crate(
      scene,
      bigCrateX,
      bigCrateY,
      "BIG",
      platformPhysicsMinX,
      platformPhysicsMaxX
    );
    createdCrates.push(bigCrate);

    console.log(
      `Generated BOTH crates on platform [${(
        platformPhysicsMinX * PHYSICS.SCALE
      ).toFixed(2)} - ${(platformPhysicsMaxX * PHYSICS.SCALE).toFixed(2)}]`
    );
  } else {
    // Original logic: Chance to generate ONE random crate
    if (Phaser.Math.FloatBetween(0, 1) > cratePlacementProbability) {
      return createdCrates; // No crate this time
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
      return createdCrates;
    }

    // Calculate spawn position (slightly offset from platform center horizontally)
    const spawnX =
      platformPixelCenterX +
      Phaser.Math.Between(-platformPixelWidth * 0.1, platformPixelWidth * 0.1);

    // Position crate so its physics body rests exactly on the platform
    // The physics vertex Y values are relative to center point
    const physicsBottom = size === "BIG" ? 23 : 15; // Based on physics.xml definition
    const spawnY = platformY - physicsBottom;

    // Create the single crate instance
    const crate = new Crate(
      scene,
      spawnX,
      spawnY,
      size,
      platformPhysicsMinX,
      platformPhysicsMaxX
    );
    createdCrates.push(crate);

    console.log(
      `Generated ${size} crate at (${spawnX.toFixed(2)}, ${spawnY.toFixed(
        2
      )}) on platform [${(platformPhysicsMinX * PHYSICS.SCALE).toFixed(2)} - ${(
        platformPhysicsMaxX * PHYSICS.SCALE
      ).toFixed(2)}]`
    );
  }

  return createdCrates;
}
