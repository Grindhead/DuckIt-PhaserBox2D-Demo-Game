/**
 * @file enemyGenerator.ts
 * @description Module for generating enemies on platforms within the level.
 */
import { ASSETS, PHYSICS } from "@constants";
import Enemy from "@entities/Enemy";
import GameScene from "@scenes/GameScene";

// Probability of an enemy spawning on a suitable platform
const ENEMY_SPAWN_PROBABILITY = 0.3; // 30% chance
// Minimum platform width (in tiles) required to spawn an enemy
const MIN_PLATFORM_TILES_FOR_ENEMY = 5;

/**
 * Tries to generate an enemy for a given platform based on probability.
 *
 * @param scene - The GameScene instance.
 * @param platformMinX - The minimum x boundary (pixels) of the platform.
 * @param platformMaxX - The maximum x boundary (pixels) of the platform.
 * @param platformY - The y position (pixels) of the platform surface.
 * @param platformTileCount - The number of middle tiles in the platform.
 * @returns The created Enemy instance, or null if no enemy was spawned.
 */
export function generateEnemyForPlatform(
  scene: GameScene,
  platformMinX: number,
  platformMaxX: number,
  platformY: number,
  platformTileCount: number
): Enemy | null {
  console.log(
    `[EnemyGenerator] Called for platform tiles: ${platformTileCount}`
  ); // Log entry

  // Don't spawn enemies on very short platforms
  if (platformTileCount < MIN_PLATFORM_TILES_FOR_ENEMY) {
    console.log(
      `[EnemyGenerator] Platform too short (${platformTileCount} < ${MIN_PLATFORM_TILES_FOR_ENEMY}). Skipping.`
    );
    return null;
  }

  const randomRoll = Math.random();
  console.log(
    `[EnemyGenerator] Probability check: Rolled ${randomRoll.toFixed(
      2
    )} vs threshold ${ENEMY_SPAWN_PROBABILITY}`
  ); // Log probability
  // Check probability
  if (randomRoll > ENEMY_SPAWN_PROBABILITY) {
    console.log(`[EnemyGenerator] Probability failed. Skipping.`);
    return null;
  }

  // Calculate spawn position (somewhere in the middle of the platform)
  const spawnPadding = ASSETS.ENEMY.WIDTH * 1.5; // Ensure enemy doesn't spawn right at the edge

  // Convert platform boundaries from physics (meters) to pixels
  const platformMinXPixels = platformMinX * PHYSICS.SCALE;
  const platformMaxXPixels = platformMaxX * PHYSICS.SCALE;

  // Calculate spawn boundaries in pixels
  const minSpawnX = platformMinXPixels + spawnPadding;
  const maxSpawnX = platformMaxXPixels - spawnPadding;

  // Ensure valid spawn range
  if (minSpawnX >= maxSpawnX) {
    console.log(
      `[EnemyGenerator] Platform too narrow after padding (${minSpawnX.toFixed(
        2
      )} >= ${maxSpawnX.toFixed(2)}). Skipping.`
    );
    return null; // Platform too narrow even with padding logic
  }

  const spawnX = Phaser.Math.Between(minSpawnX, maxSpawnX);
  const spawnY = platformY - ASSETS.ENEMY.HEIGHT / 2 - 2; // Place slightly above the platform surface

  // Create the enemy
  const enemy = new Enemy(scene, spawnX, spawnY, platformMinX, platformMaxX);

  console.log(
    `[EnemyGenerator] Successfully generated enemy at (${spawnX.toFixed(
      2
    )}, ${spawnY.toFixed(2)})`
  ); // Log success
  return enemy;
}
