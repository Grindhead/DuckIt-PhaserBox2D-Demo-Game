/**
 * @file main.ts
 * @description This is the main entry point for the Phaser game.
 * It sets up the Phaser game configuration, including scenes, renderer settings,
 * scaling mode, and instantiates the game.
 */
import * as Phaser from "phaser";

import { RENDERER } from "@constants";
import BootScene from "@scenes/BootScene";
import GameScene from "@scenes/GameScene";
import PreloaderScene from "@scenes/PreloaderScene";

// Define type for GameConfig
type GameConfig = Phaser.Types.Core.GameConfig;

const config: GameConfig = {
  type: Phaser.AUTO,
  parent: "app",
  width: RENDERER.WIDTH,
  height: RENDERER.HEIGHT,
  transparent: true,
  // Remove the physics property as we are using external Box2D
  scene: [BootScene, PreloaderScene, GameScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};

// Create the game instance, but don't assign to unused variable
new Phaser.Game(config);
