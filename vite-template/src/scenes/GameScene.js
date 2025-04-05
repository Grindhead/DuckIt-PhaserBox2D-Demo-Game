import * as Phaser from "phaser";
import {
  AddSpriteToWorld,
  CreateBoxPolygon,
  CreateWorld,
  STATIC,
  SetWorldScale,
  SpriteToBox,
  UpdateWorldSprites,
  WorldStep,
  b2DefaultBodyDef,
  b2DefaultWorldDef,
  b2Vec2,
  pxmVec2,
  DYNAMIC,
  b2Body_GetLinearVelocity,
  b2Body_SetLinearVelocity,
  b2Body_GetPosition,
} from "../PhaserBox2D.js";

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: "GameScene" });
    this.coins = 0;
    this.isGameOver = false;
    this.playerSpeed = 300;
    this.jumpForce = -400;
  }

  create() {
    // Set up Box2D world with gravity
    SetWorldScale(30); // Scale factor for Box2D units
    this.world = CreateWorld({
      worldDef: {
        ...b2DefaultWorldDef(),
        gravity: new b2Vec2(0, 9.81), // Standard gravity
      },
    });
    this.worldId = this.world.worldId;

    // Set up camera bounds (10,000px wide as per PRD)
    this.cameras.main.setBounds(0, 0, 10000, 768);

    // Create player
    this.createPlayer();

    // Create UI elements
    this.createUI();

    // Generate level
    this.generateLevel();

    // Set up input handlers
    this.setupInput();

    // Create death sensor 400px below lowest platform
    this.createDeathSensor();
  }

  createPlayer() {
    // Create player sprite with the correct frame name
    this.player = this.add.sprite(
      100,
      100,
      "assets",
      "player/idle/duck-idle-0001.png"
    );

    // Create physics body for player
    const playerBody = SpriteToBox(this.worldId, this.player, {
      density: 1.0,
      friction: 0.5,
      restitution: 0.0,
      fixedRotation: true, // Prevent rotation
    });

    AddSpriteToWorld(this.worldId, this.player, playerBody);

    // Start idle animation
    this.player.play("duck-idle");

    // Track player state
    this.playerState = {
      isJumping: false,
      isFalling: false,
      isDead: false,
      facingRight: true,
    };

    // Make camera follow player
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
  }

  createDeathSensor() {
    // TODO: Position this 400px below the lowest platform once level generation is implemented
    const sensorY = 768; // Temporary position

    CreateBoxPolygon({
      worldId: this.worldId,
      type: STATIC,
      bodyDef: {
        ...b2DefaultBodyDef(),
        isSensor: true,
      },
      position: pxmVec2(5000, sensorY), // Center of level width
      size: new b2Vec2(500, 1), // Wide enough to catch falls
      userData: { type: "deathSensor" },
    });
  }

  createUI() {
    // Create coin counter (fixed to camera)
    this.coinText = this.add.text(
      this.cameras.main.width - 100,
      20,
      "Coins: 0",
      {
        fontSize: "24px",
        color: "#000000",
      }
    );
    this.coinText.setScrollFactor(0);
  }

  setupInput() {
    // Keyboard controls
    this.cursors = this.input.keyboard.createCursorKeys();

    // Mobile controls (only show on touch devices)
    if (this.sys.game.device.input.touch) {
      this.createMobileControls();
    }
  }

  createMobileControls() {
    const buttonScale = 0.5;
    const padding = 20;

    // Left button (bottom-left)
    this.leftButton = this.add
      .image(
        padding + 64 * buttonScale,
        this.cameras.main.height - padding - 64 * buttonScale,
        "assets",
        "direction-button"
      )
      .setScrollFactor(0)
      .setScale(buttonScale)
      .setInteractive()
      .setAngle(180);

    // Right button (to the right of left button)
    this.rightButton = this.add
      .image(
        padding + 192 * buttonScale,
        this.cameras.main.height - padding - 64 * buttonScale,
        "assets",
        "direction-button"
      )
      .setScrollFactor(0)
      .setScale(buttonScale)
      .setInteractive();

    // Jump button (bottom-right)
    this.jumpButton = this.add
      .image(
        this.cameras.main.width - padding - 64 * buttonScale,
        this.cameras.main.height - padding - 64 * buttonScale,
        "assets",
        "direction-button"
      )
      .setScrollFactor(0)
      .setScale(buttonScale)
      .setInteractive()
      .setAngle(-90);

    // Set up touch handlers
    this.leftButton.on("pointerdown", () => (this.mobileControls.left = true));
    this.leftButton.on("pointerup", () => (this.mobileControls.left = false));
    this.leftButton.on("pointerout", () => (this.mobileControls.left = false));

    this.rightButton.on(
      "pointerdown",
      () => (this.mobileControls.right = true)
    );
    this.rightButton.on("pointerup", () => (this.mobileControls.right = false));
    this.rightButton.on(
      "pointerout",
      () => (this.mobileControls.right = false)
    );

    this.jumpButton.on("pointerdown", () => (this.mobileControls.up = true));
    this.jumpButton.on("pointerup", () => (this.mobileControls.up = false));
    this.jumpButton.on("pointerout", () => (this.mobileControls.up = false));

    // Initialize mobile controls state
    this.mobileControls = {
      left: false,
      right: false,
      up: false,
    };
  }

  generateLevel() {
    // Create a temporary ground platform for testing
    CreateBoxPolygon({
      worldId: this.worldId,
      type: STATIC,
      bodyDef: b2DefaultBodyDef(),
      position: pxmVec2(500, 700),
      size: new b2Vec2(50, 1),
      friction: 0.5,
    });
  }

  update(time, delta) {
    if (this.isGameOver) return;

    // Update Box2D world
    WorldStep({ worldId: this.worldId, deltaTime: delta });
    UpdateWorldSprites(this.worldId);

    // Update game state
    this.updatePlayer();
    this.updateCamera();
  }

  updatePlayer() {
    if (this.playerState.isDead) return;

    const velocity = b2Body_GetLinearVelocity(this.worldId, this.player.body);
    const position = b2Body_GetPosition(this.worldId, this.player.body);

    // Handle movement
    let moveX = 0;

    // Combine keyboard and mobile input
    if (
      this.cursors.left.isDown ||
      (this.mobileControls && this.mobileControls.left)
    ) {
      moveX = -this.playerSpeed;
      if (this.playerState.facingRight) {
        this.player.setFlipX(true);
        this.playerState.facingRight = false;
      }
    } else if (
      this.cursors.right.isDown ||
      (this.mobileControls && this.mobileControls.right)
    ) {
      moveX = this.playerSpeed;
      if (!this.playerState.facingRight) {
        this.player.setFlipX(false);
        this.playerState.facingRight = true;
      }
    }

    // Apply horizontal movement
    b2Body_SetLinearVelocity(
      this.worldId,
      this.player.body,
      new b2Vec2(moveX / 30, velocity.y)
    );

    // Handle jumping
    if (
      (this.cursors.up.isDown ||
        (this.mobileControls && this.mobileControls.up)) &&
      !this.playerState.isJumping
    ) {
      b2Body_SetLinearVelocity(
        this.worldId,
        this.player.body,
        new b2Vec2(velocity.x, this.jumpForce / 30)
      );
      this.playerState.isJumping = true;
      this.player.play("duck-jump");
    }

    // Update animations based on state
    if (this.playerState.isJumping) {
      if (velocity.y > 0) {
        this.playerState.isJumping = false;
        this.playerState.isFalling = true;
        this.player.play("duck-fall");
      }
    } else if (this.playerState.isFalling) {
      if (Math.abs(velocity.y) < 0.1) {
        this.playerState.isFalling = false;
        if (moveX === 0) {
          this.player.play("duck-idle");
        } else {
          this.player.play("duck-run");
        }
      }
    } else {
      if (moveX === 0 && !this.player.anims.currentAnim?.key.includes("idle")) {
        this.player.play("duck-idle");
      } else if (
        moveX !== 0 &&
        !this.player.anims.currentAnim?.key.includes("run")
      ) {
        this.player.play("duck-run");
      }
    }

    // Check if player has fallen below death sensor
    if (position.y > 768 / 30) {
      // Convert to Box2D units
      this.killPlayer();
    }
  }

  updateCamera() {
    // Camera following is handled by Phaser's built-in follow system with easing
  }

  killPlayer() {
    if (this.playerState.isDead) return;

    this.playerState.isDead = true;
    this.player.play("duck-dead");

    // Listen for animation completion
    this.player.once("animationcomplete", () => {
      this.gameOver();
    });
  }

  gameOver() {
    this.isGameOver = true;
    // Show start.png overlay
    const overlay = this.add
      .image(
        this.cameras.main.centerX,
        this.cameras.main.centerY,
        "assets",
        "start"
      )
      .setScrollFactor(0)
      .setInteractive();

    overlay.on("pointerdown", () => {
      this.scene.restart();
    });
  }
}
