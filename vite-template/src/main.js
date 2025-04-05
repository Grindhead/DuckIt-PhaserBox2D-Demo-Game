import * as Phaser from "phaser";
import BootScene from "./scenes/BootScene";
import PreloaderScene from "./scenes/PreloaderScene";
import GameScene from "./scenes/GameScene";
import { WORLD } from "./lib/constants";

const config = {
  type: Phaser.AUTO,
  parent: "app",
  width: WORLD.WIDTH,
  height: WORLD.HEIGHT,
  backgroundColor: "#2d2d2d",
  physics: {
    default: false, // We'll use Box2D via PhaserBox2D.js
  },
  scene: [BootScene, PreloaderScene, GameScene],
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};

const game = new Phaser.Game(config);
