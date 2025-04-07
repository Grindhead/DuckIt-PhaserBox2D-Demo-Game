/**
 * @file levelGenerator.ts
 * @description Contains the procedural level generation logic for DuckIt.
 */
import * as Phaser from "phaser";

import { WORLD } from "@constants";
import Coin from "@entities/Coin"; // Moved import order
import Crate from "@entities/Crate"; // Add import for Crate entity
import Platform from "@entities/Platform"; // Import the new Platform entity
import GameScene from "@scenes/GameScene"; // Import GameScene for type hinting and accessing its methods

/**
 * Position information for player spawning
 */
interface PlayerSpawnPosition {
  x: number;
  y: number;
}

/**
 * Generates the level by placing composite platforms procedurally.
 * @param scene The GameScene instance to add platforms to.
 * @param coinsGroup The Phaser Group to add created Coin instances to.
 * @returns Player spawn position calculated based on level generation.
 */
export function generateLevel(
  scene: GameScene,
  coinsGroup: Phaser.GameObjects.Group // Add coinsGroup parameter
): PlayerSpawnPosition {
  const platformY = 600;
  const tileWidth = 26; // Width of a single platform tile (from assets.json)
  const minPlatformLengthTiles = 3; // Min number of middle tiles
  const maxPlatformLengthTiles = 10; // Max number of middle tiles
  const minGapWidthTiles = 2; // Minimum gap width in tiles
  const maxGapWidthTiles = 5; // Maximum gap width in tiles
  const edgePadding = 100; // Padding from world edges

  let currentX = edgePadding;

  // Track platforms for puzzle generation
  const platformPositions: {
    x: number;
    y: number;
    width: number;
    id: number;
  }[] = [];

  // Create a group to track all crates
  const cratesGroup = scene.add.group();

  // First platform will determine player start position
  const firstPlatformMiddleTiles = Phaser.Math.Between(
    minPlatformLengthTiles,
    maxPlatformLengthTiles
  );
  const firstPlatformTotalTiles = firstPlatformMiddleTiles + 2;
  const firstPlatformWidth = firstPlatformTotalTiles * tileWidth;
  const firstPlatformCenterX = currentX + firstPlatformWidth / 2;

  // Calculate player start position above the first platform
  const playerStartX = firstPlatformCenterX;
  const playerStartY = platformY - 100; // 100px above the platform

  // Instantiate the first platform
  const firstPlatform = new Platform(
    scene,
    firstPlatformCenterX,
    platformY,
    firstPlatformWidth,
    firstPlatformMiddleTiles
  );

  // Track the first platform
  if (firstPlatform.bodyId) {
    platformPositions.push({
      x: firstPlatformCenterX,
      y: platformY,
      width: firstPlatformWidth,
      id: firstPlatform.bodyId.index1,
    });
  }

  // Store the start X before updating currentX for coin placement
  const platformStartX = currentX;

  // --- Coin Placement for first platform ---
  const coinY = platformY - 40; // Place coins slightly above the platform
  // Place coins based on the number of *tiles* (edges + middle)
  for (let i = 0; i < firstPlatformTotalTiles; i++) {
    const coinX = platformStartX + tileWidth / 2 + i * tileWidth;
    // Add a small random horizontal offset
    const offsetX = Phaser.Math.Between(-5, 5);
    const coin = new Coin(scene, coinX + offsetX, coinY); // Create coin
    coinsGroup.add(coin); // Add to group
  }

  // Update currentX to the position after the first platform
  currentX += firstPlatformWidth;

  // --- First Gap Generation ---
  const firstGapWidthTiles = Phaser.Math.Between(
    minGapWidthTiles,
    maxGapWidthTiles
  );
  const firstGapPixelWidth = firstGapWidthTiles * tileWidth;
  currentX += firstGapPixelWidth;

  // Variables to track puzzle creation
  let puzzlesCreated = 0;
  const requiredPuzzles = 2; // PRD requires at least 2 crate puzzles
  let platformIndex = 1; // Starting from 1 since we already created the first platform

  // Continue generating the rest of the level
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

    // Determine the Y position of the platform, occasionally creating platforms at different heights
    let thisPlatformY = platformY;

    // Every 3-5 platforms, create a higher platform to make the level more interesting
    if (platformIndex > 2 && platformIndex % Phaser.Math.Between(3, 5) === 0) {
      // Make platforms higher by a random amount, but reachable with crates
      thisPlatformY = platformY - Phaser.Math.Between(100, 150);
    }

    // Instantiate the Platform entity
    const platform = new Platform(
      scene, // Pass the scene context
      platformCenterX,
      thisPlatformY,
      platformPixelWidth,
      platformMiddleTiles
    );

    // Track this platform
    if (platform.bodyId) {
      platformPositions.push({
        x: platformCenterX,
        y: thisPlatformY,
        width: platformPixelWidth,
        id: platform.bodyId.index1,
      });
    }

    // Store the start X before updating currentX for coin and crate placement
    const platformStartX = currentX;

    // --- Coin Placement ---
    // Place coins slightly above the platform, unless it's a platform chosen for puzzle
    const coinY = thisPlatformY - 40;

    // Decide if this platform should have a crate puzzle
    // Create puzzles on regular height platforms that are large enough
    const shouldCreatePuzzle =
      puzzlesCreated < requiredPuzzles &&
      thisPlatformY === platformY &&
      platformPixelWidth >= tileWidth * 5 && // Ensure platform is large enough
      platformIndex > 1 && // Don't create a puzzle on the first few platforms
      platformIndex < 15; // Don't create puzzles too far in the level

    // If this is a puzzle platform, place crates instead of coins on part of it
    if (shouldCreatePuzzle) {
      // Place a big crate on the left side of the platform
      const bigCrateX = platformStartX + platformPixelWidth * 0.3;
      const bigCrateY = thisPlatformY - 45; // Slightly above platform
      const bigCrate = new Crate(
        scene,
        bigCrateX,
        bigCrateY,
        "big",
        platform.bodyId?.index1 || null
      );
      cratesGroup.add(bigCrate);

      // Place a small crate on the right side of the platform
      const smallCrateX = platformStartX + platformPixelWidth * 0.7;
      const smallCrateY = thisPlatformY - 30; // Slightly above platform
      const smallCrate = new Crate(
        scene,
        smallCrateX,
        smallCrateY,
        "small",
        platform.bodyId?.index1 || null
      );
      cratesGroup.add(smallCrate);

      // Place coins only on parts of the platform without crates
      for (let i = 0; i < totalTiles; i++) {
        const coinX = platformStartX + tileWidth / 2 + i * tileWidth;
        // Skip coin placement near crates
        const distanceToBigCrate = Math.abs(coinX - bigCrateX);
        const distanceToSmallCrate = Math.abs(coinX - smallCrateX);
        if (distanceToBigCrate > 30 && distanceToSmallCrate > 20) {
          const offsetX = Phaser.Math.Between(-5, 5);
          const coin = new Coin(scene, coinX + offsetX, coinY);
          coinsGroup.add(coin);
        }
      }

      puzzlesCreated++;
    } else {
      // Regular platform with coins
      for (let i = 0; i < totalTiles; i++) {
        const coinX = platformStartX + tileWidth / 2 + i * tileWidth;
        // Add a small random horizontal offset
        const offsetX = Phaser.Math.Between(-5, 5);
        const coin = new Coin(scene, coinX + offsetX, coinY);
        coinsGroup.add(coin);
      }
    }
    // --- End Coin/Crate Placement ---

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

    platformIndex++;
  }

  // If we didn't create enough puzzles, force create the remaining ones
  if (puzzlesCreated < requiredPuzzles && platformPositions.length > 3) {
    // Use the middle platforms for the remaining puzzles
    const middleIndex = Math.floor(platformPositions.length / 2);

    for (
      let i = middleIndex;
      i < platformPositions.length && puzzlesCreated < requiredPuzzles;
      i++
    ) {
      const platform = platformPositions[i];

      // Skip if platform is at a different height (puzzle platforms should be at base height)
      if (platform.y !== platformY) continue;

      // Place a big crate
      const bigCrateX = platform.x - platform.width * 0.2;
      const bigCrateY = platform.y - 45;
      const bigCrate = new Crate(
        scene,
        bigCrateX,
        bigCrateY,
        "big",
        platform.id
      );
      cratesGroup.add(bigCrate);

      // Place a small crate
      const smallCrateX = platform.x + platform.width * 0.2;
      const smallCrateY = platform.y - 30;
      const smallCrate = new Crate(
        scene,
        smallCrateX,
        smallCrateY,
        "small",
        platform.id
      );
      cratesGroup.add(smallCrate);

      puzzlesCreated++;
    }
  }

  // Add the crates group to the scene for tracking
  scene.crates = cratesGroup;

  // Return the player spawn position
  return {
    x: playerStartX,
    y: playerStartY,
  };
}
