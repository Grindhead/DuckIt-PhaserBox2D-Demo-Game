import * as Phaser from "phaser";

export default class PreloaderScene extends Phaser.Scene {
  constructor() {
    super({ key: "PreloaderScene" });
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
    this.load.on("progress", (value) => {
      progressBar.clear();
      progressBar.fillStyle(0xffffff, 1);
      progressBar.fillRect(
        width / 4 + 10,
        height / 2 - 20,
        (width / 2 - 20) * value,
        30
      );
      percentText.setText(parseInt(value * 100) + "%");
    });

    // Load texture atlas from the correct location
    this.load.atlas("assets", "/assets.png", "/assets.json");
  }

  create() {
    // Define animations
    this.createAnimations();

    // Start the game scene
    this.scene.start("GameScene");
  }

  createAnimations() {
    // Duck animations
    this.anims.create({
      key: "duck-idle",
      frames: this.anims.generateFrameNames("assets", {
        prefix: "player/idle/duck-idle-",
        start: 1,
        end: 10,
        zeroPad: 4,
        suffix: ".png",
      }),
      frameRate: 30,
      repeat: -1,
    });

    this.anims.create({
      key: "duck-dead",
      frames: this.anims.generateFrameNames("assets", {
        prefix: "player/dead/duck-dead-",
        start: 1,
        end: 10,
        zeroPad: 4,
        suffix: ".png",
      }),
      frameRate: 30,
    });

    this.anims.create({
      key: "duck-fall",
      frames: this.anims.generateFrameNames("assets", {
        prefix: "player/fall/duck-fall-",
        start: 1,
        end: 10,
        zeroPad: 4,
        suffix: ".png",
      }),
      frameRate: 30,
    });

    this.anims.create({
      key: "duck-jump",
      frames: this.anims.generateFrameNames("assets", {
        prefix: "player/jump/duck-jump-",
        start: 1,
        end: 12,
        zeroPad: 4,
        suffix: ".png",
      }),
      frameRate: 30,
    });

    this.anims.create({
      key: "duck-run",
      frames: this.anims.generateFrameNames("assets", {
        prefix: "player/run/duck-run-",
        start: 1,
        end: 14,
        zeroPad: 4,
        suffix: ".png",
      }),
      frameRate: 30,
      repeat: -1,
    });

    // Coin animations
    this.anims.create({
      key: "coin-idle",
      frames: this.anims.generateFrameNames("assets", {
        prefix: "coin/coin-idle/coin-idle-",
        start: 1,
        end: 23,
        zeroPad: 4,
        suffix: ".png",
      }),
      frameRate: 30,
      repeat: -1,
    });

    this.anims.create({
      key: "coin-collect",
      frames: this.anims.generateFrameNames("assets", {
        prefix: "coin/coin-collect/coin-collect-",
        start: 1,
        end: 8,
        zeroPad: 4,
        suffix: ".png",
      }),
      frameRate: 30,
    });

    // Finish animations
    this.anims.create({
      key: "finish-activated",
      frames: this.anims.generateFrameNames("assets", {
        prefix: "finish/finish-activated/finish-activated-",
        start: 1,
        end: 19,
        zeroPad: 4,
        suffix: ".png",
      }),
      frameRate: 30,
    });

    this.anims.create({
      key: "finish-active",
      frames: this.anims.generateFrameNames("assets", {
        prefix: "finish/finish-active/finish-active-",
        start: 1,
        end: 18,
        zeroPad: 4,
        suffix: ".png",
      }),
      frameRate: 30,
      repeat: -1,
    });
  }
}
