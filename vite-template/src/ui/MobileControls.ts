/**
 * @file MobileControls.ts
 * @description Creates and manages on-screen touch controls for mobile devices.
 * Displays left, right, and jump buttons if the game detects touch input.
 * Tracks the state of these buttons (pressed or not).
 */
import * as Phaser from "phaser";

import { UI, ASSETS } from "@constants";

// Define interface for control state
interface MobileControlState {
  left: boolean;
  right: boolean;
  up: boolean;
}

export default class MobileControls {
  // Declare properties
  scene: Phaser.Scene;
  state: MobileControlState;
  leftButton: Phaser.GameObjects.Image | null = null;
  rightButton: Phaser.GameObjects.Image | null = null;
  jumpButton: Phaser.GameObjects.Image | null = null;

  // Add type to scene parameter
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.state = {
      left: false,
      right: false,
      up: false,
    };

    // Only create controls on touch devices
    if (this.scene.sys.game.device.input.touch) {
      this.createControls();
    }
  }

  createControls() {
    // Check UI constant structure - assuming these exist
    const buttonScale = UI.MOBILE_CONTROLS.SCALE;
    const padding = UI.MOBILE_CONTROLS.PADDING;
    const buttonSize = UI.MOBILE_CONTROLS.BUTTON_SIZE;

    // Left button (bottom-left)
    this.leftButton = this.scene.add
      .image(
        padding + buttonSize * buttonScale,
        this.scene.cameras.main.height - padding - buttonSize * buttonScale,
        ASSETS.ATLAS,
        ASSETS.UI.DIRECTION_BUTTON
      )
      .setScrollFactor(0)
      .setScale(buttonScale)
      .setInteractive({ cursor: "pointer" })
      .setAngle(180); // Assuming angle controls orientation

    // Right button (to the right of left button)
    this.rightButton = this.scene.add
      .image(
        padding + buttonSize * 3 * buttonScale, // Adjust position as needed
        this.scene.cameras.main.height - padding - buttonSize * buttonScale,
        ASSETS.ATLAS,
        ASSETS.UI.DIRECTION_BUTTON
      )
      .setScrollFactor(0)
      .setScale(buttonScale)
      .setInteractive({ cursor: "pointer" });

    // Jump button (bottom-right)
    this.jumpButton = this.scene.add
      .image(
        this.scene.cameras.main.width - padding - buttonSize * buttonScale,
        this.scene.cameras.main.height - padding - buttonSize * buttonScale,
        ASSETS.ATLAS,
        ASSETS.UI.DIRECTION_BUTTON
      )
      .setScrollFactor(0)
      .setScale(buttonScale)
      .setInteractive({ cursor: "pointer" })
      .setAngle(-90); // Use angle for jump button orientation

    this.setupEventHandlers();
  }

  setupEventHandlers() {
    // Add null checks before setting up handlers
    if (!this.leftButton || !this.rightButton || !this.jumpButton) {
      console.error("Mobile control buttons not created!");
      return;
    }

    // Set up touch handlers
    this.leftButton.on("pointerdown", () => (this.state.left = true));
    this.leftButton.on("pointerup", () => (this.state.left = false));
    this.leftButton.on("pointerout", () => (this.state.left = false));

    this.rightButton.on("pointerdown", () => (this.state.right = true));
    this.rightButton.on("pointerup", () => (this.state.right = false));
    this.rightButton.on("pointerout", () => (this.state.right = false));

    this.jumpButton.on("pointerdown", () => (this.state.up = true));
    this.jumpButton.on("pointerup", () => (this.state.up = false));
    this.jumpButton.on("pointerout", () => (this.state.up = false));
  }

  // Specify return type
  getState(): MobileControlState {
    return this.state;
  }

  destroy() {
    // Destroy buttons if they exist
    if (this.leftButton) {
      this.leftButton.destroy();
      this.leftButton = null;
    }
    if (this.rightButton) {
      this.rightButton.destroy();
      this.rightButton = null;
    }
    if (this.jumpButton) {
      this.jumpButton.destroy();
      this.jumpButton = null;
    }
  }
}
