/**
 * @file PreloaderScene.ts
 * @description Handles loading of all game assets (texture atlas) before the game starts.
 * Displays a loading progress bar and percentage text.
 * Once loading is complete, it defines all necessary sprite animations
 * and then transitions to the GameScene.
 */
import * as Phaser from "phaser";

import { SCENES, ASSETS, ANIMATION } from "@constants";

import { initPhysicsData } from "../lib/physics/PhysicsBodyFactory";

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
      percentText.setText(Math.floor(value * 100).toString() + "%");
    });

    // Load texture atlas from the correct location
    this.load.atlas(ASSETS.ATLAS, "/assets.png", "/assets.json");

    // Load physics XML file - make sure the path is correct
    this.load.xml("physics", "/physics.xml");

    // Add a complete handler to verify XML was loaded
    this.load.on("complete", () => {
      console.log("All assets loaded, checking physics XML...");
      if (this.cache.xml.exists("physics")) {
        console.log("Physics XML successfully loaded into cache");
      } else {
        console.error("Failed to load physics XML into cache!");
      }
    });
  }

  async create() {
    // Create a global variable to track whether physics data was successfully initialized
    const loadingText = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2 + 50,
      "Initializing physics...",
      {
        fontSize: "24px",
        color: "#ffffff",
      }
    );
    loadingText.setOrigin(0.5, 0.5);

    try {
      // Explicitly verify the XML is loaded before initializing
      if (!this.cache.xml.exists("physics")) {
        throw new Error(
          "Physics XML not found in cache. Check file path and format."
        );
      }

      // Get the XML directly to validate content
      const physicsXml = this.cache.xml.get("physics");
      const bodyElements = physicsXml.getElementsByTagName("body");

      if (!bodyElements || bodyElements.length === 0) {
        throw new Error("Physics XML contains no body elements!");
      }

      console.log(`Found ${bodyElements.length} physics bodies in XML`);

      // Check for required physics bodies
      const bodyNames = [];
      for (let i = 0; i < bodyElements.length; i++) {
        const name = bodyElements[i].getAttribute("name");
        bodyNames.push(name);
      }

      console.log("Available physics bodies:", bodyNames.join(", "));

      if (!bodyNames.includes("duck")) {
        console.warn("Required 'duck' body not found in physics XML!");
      }

      // Initialize physics data from the loaded XML file
      await initPhysicsData();
      console.log("Physics data successfully initialized from physics.xml");

      loadingText.setText("Physics initialized successfully!");

      // Short delay to show success message
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.error("Error initializing physics data:", error);
      loadingText.setText("Physics error! Check console.");
      loadingText.setColor("#ff0000");

      // Show error for a moment instead of proceeding
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } finally {
      loadingText.destroy();
    }

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
