import { UI, ASSETS } from "../lib/constants";

export default class MobileControls {
  constructor(scene) {
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
      .setInteractive()
      .setAngle(180);

    // Right button (to the right of left button)
    this.rightButton = this.scene.add
      .image(
        padding + buttonSize * 3 * buttonScale,
        this.scene.cameras.main.height - padding - buttonSize * buttonScale,
        ASSETS.ATLAS,
        ASSETS.UI.DIRECTION_BUTTON
      )
      .setScrollFactor(0)
      .setScale(buttonScale)
      .setInteractive();

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
      .setInteractive()
      .setAngle(-90);

    this.setupEventHandlers();
  }

  setupEventHandlers() {
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

  getState() {
    return this.state;
  }

  destroy() {
    if (this.leftButton) {
      this.leftButton.destroy();
      this.rightButton.destroy();
      this.jumpButton.destroy();
    }
  }
}
