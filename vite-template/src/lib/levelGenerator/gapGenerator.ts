import * as Phaser from "phaser";

/**
 * Configuration for gap generation.
 */
export interface GapConfig {
  tileWidth: number;
  minGapWidthTiles: number;
  maxGapWidthTiles: number;
}

/**
 * Calculates the pixel width of the next gap between platforms.
 *
 * @param config The configuration object for gap generation.
 * @returns The calculated gap width in pixels.
 */
export function generateGap(config: GapConfig): number {
  const gapWidthTiles = Phaser.Math.Between(
    config.minGapWidthTiles,
    config.maxGapWidthTiles
  );
  return gapWidthTiles * config.tileWidth;
}
