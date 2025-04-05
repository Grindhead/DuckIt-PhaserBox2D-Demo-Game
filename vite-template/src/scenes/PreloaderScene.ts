import * as Phaser from "phaser";
import { SCENES, ASSETS, ANIMATION } from "../lib/constants";

export default class PreloaderScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.PRELOADER });
  }

  preload() {
    // Create loading bar
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(width / 4, height / 2 - 30, width / 2, 50);

    // Loading percentage text
    const percentText = this.add.text(width / 2, height / 2, "0%", {
      fontSize: "32px",
      color: "#ffffff",
    });
    percentText.setOrigin(0.5, 0.5);

    // Loading progress callback
    this.load.on("progress", (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0xffffff, 1);
      progressBar.fillRect(
        width / 4 + 10,
        height / 2 - 20,
        (width / 2 - 20) * value,
        30
      );
      percentText.setText(Math.max(value * 100).toString() + "%");
    });

    // Load texture atlas from the correct location
    this.load.atlas(ASSETS.ATLAS, "/assets.png", "/assets.json");
  }

  create() {
    // Define animations
    this.createAnimations();

    // Start the game scene
    this.scene.start(SCENES.GAME);
  }

  createAnimations() {
    // Duck animations
    this.anims.create({
      key: ASSETS.PLAYER.IDLE.KEY,
      frames: this.anims.generateFrameNames(ASSETS.ATLAS, {
        prefix: "player/idle/duck-idle-",
        start: 1,
        end: ASSETS.PLAYER.IDLE.FRAME_COUNT,
        zeroPad: 4,
        suffix: ".png",
      }),
      frameRate: ANIMATION.FRAME_RATE,
      repeat: -1,
    });

    this.anims.create({
      key: ASSETS.PLAYER.DEAD.KEY,
      frames: this.anims.generateFrameNames(ASSETS.ATLAS, {
        prefix: ASSETS.PLAYER.DEAD.FRAME_PREFIX,
        start: 1,
        end: ASSETS.PLAYER.DEAD.FRAME_COUNT,
        zeroPad: 4,
        suffix: ".png",
      }),
      frameRate: ANIMATION.FRAME_RATE,
    });

    this.anims.create({
      key: ASSETS.PLAYER.FALL.KEY,
      frames: this.anims.generateFrameNames(ASSETS.ATLAS, {
        prefix: ASSETS.PLAYER.FALL.FRAME_PREFIX,
        start: 1,
        end: ASSETS.PLAYER.FALL.FRAME_COUNT,
        zeroPad: 4,
        suffix: ".png",
      }),
      frameRate: ANIMATION.FRAME_RATE,
    });

    this.anims.create({
      key: ASSETS.PLAYER.JUMP.KEY,
      frames: this.anims.generateFrameNames(ASSETS.ATLAS, {
        prefix: ASSETS.PLAYER.JUMP.FRAME_PREFIX,
        start: 1,
        end: ASSETS.PLAYER.JUMP.FRAME_COUNT,
        zeroPad: 4,
        suffix: ".png",
      }),
      frameRate: ANIMATION.FRAME_RATE,
    });

    this.anims.create({
      key: ASSETS.PLAYER.RUN.KEY,
      frames: this.anims.generateFrameNames(ASSETS.ATLAS, {
        prefix: ASSETS.PLAYER.RUN.FRAME_PREFIX,
        start: 1,
        end: ASSETS.PLAYER.RUN.FRAME_COUNT,
        zeroPad: 4,
        suffix: ".png",
      }),
      frameRate: ANIMATION.FRAME_RATE,
      repeat: -1,
    });

    // Coin animations
    this.anims.create({
      key: ASSETS.COIN.IDLE.KEY,
      frames: this.anims.generateFrameNames(ASSETS.ATLAS, {
        prefix: ASSETS.COIN.IDLE.FRAME_PREFIX,
        start: 1,
        end: ASSETS.COIN.IDLE.FRAME_COUNT,
        zeroPad: 4,
        suffix: ".png",
      }),
      frameRate: ANIMATION.FRAME_RATE,
      repeat: -1,
    });

    this.anims.create({
      key: ASSETS.COIN.COLLECT.KEY,
      frames: this.anims.generateFrameNames(ASSETS.ATLAS, {
        prefix: ASSETS.COIN.COLLECT.FRAME_PREFIX,
        start: 1,
        end: ASSETS.COIN.COLLECT.FRAME_COUNT,
        zeroPad: 4,
        suffix: ".png",
      }),
      frameRate: ANIMATION.FRAME_RATE,
    });

    // Finish animations
    this.anims.create({
      key: ASSETS.FINISH.ACTIVATED.KEY,
      frames: this.anims.generateFrameNames(ASSETS.ATLAS, {
        prefix: ASSETS.FINISH.ACTIVATED.FRAME_PREFIX,
        start: 1,
        end: ASSETS.FINISH.ACTIVATED.FRAME_COUNT,
        zeroPad: 4,
        suffix: ".png",
      }),
      frameRate: ANIMATION.FRAME_RATE,
    });

    this.anims.create({
      key: ASSETS.FINISH.ACTIVE.KEY,
      frames: this.anims.generateFrameNames(ASSETS.ATLAS, {
        prefix: ASSETS.FINISH.ACTIVE.FRAME_PREFIX,
        start: 1,
        end: ASSETS.FINISH.ACTIVE.FRAME_COUNT,
        zeroPad: 4,
        suffix: ".png",
      }),
      frameRate: ANIMATION.FRAME_RATE,
      repeat: -1,
    });
  }
}
