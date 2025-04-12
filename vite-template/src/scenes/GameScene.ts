/**
 * @file GameScene.ts
 * @description The main scene where the gameplay takes place.
 * It initializes the Box2D physics world, creates the player, level elements (platforms, etc.),
 * UI components (coin counter, overlays, mobile controls), handles input, manages game state,
 * and runs the game loop (physics updates, player updates).
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import * as Phaser from "phaser";

import { PHYSICS, WORLD, SCENES, ASSETS } from "@constants";
import Coin from "@entities/Coin";
import Crate from "@entities/Crate";
import DeathSensor from "@entities/DeathSensor";
import Enemy from "@entities/Enemy";
import Platform from "@entities/Platform";
import Player from "@entities/Player";
import { gameState } from "@gameState";
import {
  b2Vec2,
  b2CreateWorld,
  b2CreateWorldArray,
  b2DefaultWorldDef,
  b2WorldId,
  UpdateWorldSprites,
  AddSpriteToWorld,
  b2World_Step,
  b2World_Draw,
  b2World_GetContactEvents,
  b2World_SetGravity,
  b2World_GetSensorEvents,
  b2World_GetBodyEvents,
  b2Shape_GetUserData,
  b2Shape_SetUserData,
  b2Body_GetShapes,
  b2Body_IsAwake,
  b2Body_SetAwake,
  b2Body_SetTransform,
  b2Body_SetGravityScale,
  b2Body_GetLinearVelocity,
  b2Body_ApplyLinearImpulseToCenter,
  b2Body_GetMass,
  b2Shape_IsSensor,
} from "@PhaserBox2D";
import CoinCounter from "@ui/CoinCounter";
import GameOverOverlay from "@ui/GameOverOverlay";
import GameStartScreen from "@ui/GameStartScreen";
import MobileControls from "@ui/MobileControls";

import {
  generateLevel,
  GeneratedLevelData,
} from "../lib/levelGenerator/levelGenerator";
import {
  initPhysicsData,
  verifyPhysicsData,
} from "../lib/physics/PhysicsBodyFactory";

type b2WorldIdInstance = InstanceType<typeof b2WorldId>;
type MappedSprite = Phaser.GameObjects.Sprite | Crate | Enemy;

interface ShapeUserData {
  type: string;
  [key: string]: unknown;
}

// Define an interface for our debug draw implementation
interface CustomDebugDraw {
  DrawPolygon: (
    xf: any,
    vertices: any,
    vertexCount: number,
    color: number,
    context?: any
  ) => void;
  DrawSolidPolygon: (
    xf: any,
    vertices: any,
    vertexCount: number,
    radius: number,
    color: number,
    context?: any
  ) => void;
  DrawCircle: (
    center: any,
    radius: number,
    color: number,
    context?: any
  ) => void;
  DrawSolidCircle: (
    xf: any,
    radius: number,
    axis?: any,
    color?: number,
    context?: any
  ) => void;
  DrawSegment: (p1: any, p2: any, color: number, context?: any) => void;
  DrawTransform: (xf: any, context?: any) => void;
  DrawPoint: (
    x: number,
    y: number,
    radius: number,
    color: number,
    context?: any
  ) => void;
  DrawString: (pos: any, text: string, context?: any) => void;
  flags: number;
  drawShapes: boolean;
  drawJoints: boolean;
  drawAABBs: boolean;
  drawMass: boolean;
  drawContacts: boolean;
  drawContactNormals?: boolean;
  drawContactImpulses?: boolean;
  drawFrictionImpulses?: boolean;
  context: any;
}

export default class GameScene extends Phaser.Scene {
  player!: Player;
  deathSensor!: DeathSensor;
  controls: Phaser.Types.Input.Keyboard.CursorKeys | null = null;
  coinCounter!: CoinCounter;
  startScreen!: GameStartScreen;
  gameOverOverlay!: GameOverOverlay;
  mobileControls!: MobileControls;
  coins!: Phaser.GameObjects.Group;
  enemies: Enemy[] = [];
  platforms: Platform[] = []; // Array to store all Platform instances
  crates: Crate[] = []; // Array to store all Crate instances

  bodyIdToSpriteMap = new Map<number, MappedSprite>();

  // Debug draw related properties
  debugDraw: CustomDebugDraw | null = null;
  debugGraphics!: Phaser.GameObjects.Graphics;
  debugEnabled: boolean = false;
  debugKey!: Phaser.Input.Keyboard.Key;
  debugText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: SCENES.GAME });
  }

  async create() {
    console.log("GameScene: Creating game...");

    // Set up basic scene requirements first
    this.setupDebugDraw();
    this.createUI();
    this.setupInput();

    // Ensure physics data is loaded first
    let physicsLoaded = false;
    let retryCount = 0;
    const maxRetries = 3;

    while (!physicsLoaded && retryCount < maxRetries) {
      try {
        await initPhysicsData();
        console.log("Physics data initialized successfully");

        // Verify that all required physics bodies are loaded
        if (!verifyPhysicsData()) {
          console.error(
            "Critical physics bodies are missing - game objects may not function correctly"
          );
          retryCount++;
          console.log(`Retry attempt ${retryCount} of ${maxRetries}...`);
        } else {
          physicsLoaded = true;
        }
      } catch (error) {
        console.error("Failed to initialize physics data:", error);
        retryCount++;
        console.log(`Retry attempt ${retryCount} of ${maxRetries}...`);
      }

      // Add a small delay before retrying
      if (!physicsLoaded && retryCount < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }

    if (!physicsLoaded) {
      console.warn(
        "Could not load physics data after multiple attempts. Using fallback physics."
      );
    }

    // Initialize game world
    b2CreateWorldArray();
    const worldDef = b2DefaultWorldDef();
    worldDef.gravity = new b2Vec2(0, PHYSICS.GRAVITY.y);
    worldDef.maximumLinearVelocity = 4000;

    const worldId = b2CreateWorld(worldDef);
    gameState.setWorldId(worldId);

    // Clear any existing entities
    this.bodyIdToSpriteMap.clear();
    this.platforms = [];
    this.enemies = [];
    this.crates = [];
    this.coins = this.add.group();

    // Generate level with physics bodies from the preloaded physics data
    const levelData: GeneratedLevelData = generateLevel(this, this.coins);
    this.enemies = levelData.enemies;
    this.platforms = levelData.platforms;
    this.crates = levelData.crates;

    // Create player with physics body from the preloaded data
    this.player = new Player(
      this,
      levelData.playerSpawnPosition.x,
      levelData.playerSpawnPosition.y
    );

    // Initial setup of player
    this.setupPlayerState();
    this.deathSensor = new DeathSensor(this);

    // Set up input controls
    if (this.input.keyboard) {
      this.controls = this.input.keyboard.createCursorKeys();
      this.debugKey = this.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes.D
      );
    }

    // Set up camera
    this.cameras.main.setBounds(0, 0, WORLD.WIDTH, WORLD.HEIGHT);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.centerOn(
      levelData.playerSpawnPosition.x,
      levelData.playerSpawnPosition.y
    );

    // Verify physics are ready before showing start screen
    this.time.delayedCall(200, () => {
      if (this.player && this.player.bodyId && gameState.worldId) {
        console.log("Physics initialization verified, showing start screen");
        this.startScreen.show();
      } else {
        console.warn("Physics not ready, delaying start screen");
        // Try again in a bit
        this.time.delayedCall(300, () => {
          console.log("Second attempt to verify physics and show start screen");
          this.startScreen.show();
        });
      }
    });

    console.log("Game scene creation complete");
  }

  /**
   * Reusable method to reset and setup the player's initial state
   * Works for both initial spawn and respawn after death
   */
  setupPlayerState() {
    if (!this.player) return;

    console.log("GameScene: Setting up player state");

    // Set initial gravity based on game state
    if (this.player.bodyId) {
      // Disable gravity at start (will be enabled when game starts)
      b2Body_SetGravityScale(this.player.bodyId, 0);
    }

    // Move camera to player
    this.cameras.main.centerOn(this.player.x, this.player.y);

    console.log("GameScene: Player setup complete", {
      x: this.player.x,
      y: this.player.y,
      hasPhysics: !!this.player.bodyId,
    });
  }

  createUI() {
    this.coinCounter = new CoinCounter(this);
    this.startScreen = new GameStartScreen(this);
    this.gameOverOverlay = new GameOverOverlay(this);

    // Set depth for the underlying Phaser GameObjects
    this.coinCounter.text?.setDepth(100); // Access the 'text' property
    this.startScreen.overlay?.setDepth(100); // Access the 'overlay' property
    this.gameOverOverlay.overlay?.setDepth(100); // Access the 'overlay' property
  }

  setupInput() {
    this.mobileControls = new MobileControls(this);
    // Set depth for mobile control buttons
    this.mobileControls.leftButton?.setDepth(100);
    this.mobileControls.rightButton?.setDepth(100);
    this.mobileControls.jumpButton?.setDepth(100);
  }

  /**
   * Sets up the Box2D debug drawing functionality
   */
  setupDebugDraw() {
    // Create a graphics object for Box2D debug rendering
    this.debugGraphics = this.add.graphics();
    this.debugGraphics.setDepth(1000);

    // Initialize as disabled
    this.debugEnabled = false;
    this.debugGraphics.visible = false;

    // Create help text for debug mode
    const debugText = this.add.text(
      10,
      10,
      "Press D to toggle physics debug view",
      {
        fontFamily: "Arial",
        fontSize: "18px",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 4,
      }
    );
    debugText.setScrollFactor(0);
    debugText.setDepth(2000);
    debugText.visible = false;

    this.debugText = debugText;

    // Create Box2D debug draw object
    this.debugDraw = {
      DrawPolygon: (
        xf: any,
        vertices: any,
        vertexCount: number,
        color: number,
        context?: any
      ) => {
        // Draw outlines of physics bodies with thicker lines
        this.debugGraphics.lineStyle(4, color, 1);

        // Calculate transformed vertices for the shape
        const transformedVertices = [];

        for (let i = 0; i < vertexCount; i++) {
          const v = vertices[i];
          // Calculate world position with the proper transformation matrix
          const worldX =
            (xf.p.x + (v.x * xf.q.c - v.y * xf.q.s)) * PHYSICS.SCALE;
          const worldY =
            (-xf.p.y + (-v.y * xf.q.c - v.x * xf.q.s)) * PHYSICS.SCALE;
          transformedVertices.push({ x: worldX, y: worldY });
        }

        // Draw the polygon
        this.debugGraphics.beginPath();
        for (let i = 0; i < transformedVertices.length; i++) {
          const point = transformedVertices[i];
          if (i === 0) {
            this.debugGraphics.moveTo(point.x, point.y);
          } else {
            this.debugGraphics.lineTo(point.x, point.y);
          }
        }
        this.debugGraphics.closePath();
        this.debugGraphics.strokePath();
      },
      DrawSolidPolygon: (
        xf: any,
        vertices: any,
        vertexCount: number,
        radius: number,
        color: number,
        context?: any
      ) => {
        // Extract RGB components from color (which is a number)
        const r = (color >> 16) & 0xff;
        const g = (color >> 8) & 0xff;
        const b = color & 0xff;

        // Enhanced visibility for physics bodies (thicker lines, more opacity)
        this.debugGraphics.lineStyle(4, color, 1);
        this.debugGraphics.fillStyle(color, 0.5); // More opaque fill

        // Calculate transformed vertices for the shape
        const transformedVertices = [];

        for (let i = 0; i < vertexCount; i++) {
          const v = vertices[i];
          // Calculate world position with the proper transformation matrix
          const worldX =
            (xf.p.x + (v.x * xf.q.c - v.y * xf.q.s)) * PHYSICS.SCALE;
          const worldY =
            (-xf.p.y + (-v.y * xf.q.c - v.x * xf.q.s)) * PHYSICS.SCALE;
          transformedVertices.push({ x: worldX, y: worldY });
        }

        // Draw the polygon
        this.debugGraphics.beginPath();
        for (let i = 0; i < transformedVertices.length; i++) {
          const point = transformedVertices[i];
          if (i === 0) {
            this.debugGraphics.moveTo(point.x, point.y);
          } else {
            this.debugGraphics.lineTo(point.x, point.y);
          }
        }
        this.debugGraphics.closePath();
        this.debugGraphics.fillPath();
        this.debugGraphics.strokePath();
      },
      DrawCircle: (
        center: any,
        radius: number,
        color: number,
        context?: any
      ) => {
        this.debugGraphics.lineStyle(4, color, 1);
        const worldX = center.x * PHYSICS.SCALE;
        const worldY = -center.y * PHYSICS.SCALE;
        this.debugGraphics.strokeCircle(worldX, worldY, radius * PHYSICS.SCALE);
      },
      DrawSolidCircle: (
        xf: any,
        radius: number,
        axis?: any,
        color?: number,
        context?: any
      ) => {
        // Use default color if not provided
        const actualColor = color ?? 0xff00ff;

        this.debugGraphics.lineStyle(4, actualColor, 1);
        this.debugGraphics.fillStyle(actualColor, 0.5); // More opaque fill

        // Apply the proper transformation
        const worldX = xf.p.x * PHYSICS.SCALE;
        const worldY = -xf.p.y * PHYSICS.SCALE;

        this.debugGraphics.fillCircle(worldX, worldY, radius * PHYSICS.SCALE);
        this.debugGraphics.strokeCircle(worldX, worldY, radius * PHYSICS.SCALE);
      },
      DrawSegment: (p1: any, p2: any, color: number, context?: any) => {
        this.debugGraphics.lineStyle(2, color, 1);
        this.debugGraphics.beginPath();
        this.debugGraphics.moveTo(p1.x * PHYSICS.SCALE, -p1.y * PHYSICS.SCALE);
        this.debugGraphics.lineTo(p2.x * PHYSICS.SCALE, -p2.y * PHYSICS.SCALE);
        this.debugGraphics.strokePath();
      },
      DrawTransform: (xf: any, context?: any) => {
        // Draw a small cross to indicate transforms
        const center = xf.p;
        const worldX = center.x * PHYSICS.SCALE;
        const worldY = -center.y * PHYSICS.SCALE;

        this.debugGraphics.lineStyle(2, 0xff0000, 1);
        this.debugGraphics.beginPath();
        this.debugGraphics.moveTo(worldX - 5, worldY);
        this.debugGraphics.lineTo(worldX + 5, worldY);
        this.debugGraphics.moveTo(worldX, worldY - 5);
        this.debugGraphics.lineTo(worldX, worldY + 5);
        this.debugGraphics.strokePath();
      },
      DrawPoint: (
        x: number,
        y: number,
        radius: number,
        color: number,
        context?: any
      ) => {
        this.debugGraphics.fillStyle(color, 1);
        this.debugGraphics.fillCircle(
          x * PHYSICS.SCALE,
          -y * PHYSICS.SCALE,
          radius
        );
      },
      DrawString: (pos: any, text: string, context?: any) => {
        const tempText = this.add.text(
          pos.x * PHYSICS.SCALE,
          -pos.y * PHYSICS.SCALE,
          text,
          { fontSize: "11px", color: "#ffffff", backgroundColor: "#000000" }
        );
        tempText.setOrigin(0.5);
        tempText.setDepth(2000);

        // Remove text after a short delay
        this.time.delayedCall(100, () => {
          tempText.destroy();
        });
      },
      flags: 0,
      drawShapes: true,
      drawJoints: true,
      drawAABBs: true,
      drawMass: true,
      drawContacts: false,
      drawContactNormals: false,
      drawContactImpulses: false,
      drawFrictionImpulses: false,
      context: null,
    } as CustomDebugDraw;
  }

  update(_time: number, delta: number) {
    const { worldId } = gameState;
    if (!worldId) return;

    // Check for debug toggle - add null check for debugKey
    if (this.debugKey && Phaser.Input.Keyboard.JustDown(this.debugKey)) {
      this.debugEnabled = !this.debugEnabled;
      this.debugGraphics.visible = this.debugEnabled;
      if (this.debugText) {
        this.debugText.visible = this.debugEnabled;
      }

      // When debug mode is enabled, force all crates to wake up
      if (this.debugEnabled) {
        this.crates.forEach((crate) => {
          if (crate.bodyId) {
            b2Body_SetAwake(crate.bodyId, true);
          }
        });

        // Also wake up all enemies for consistent behavior in debug mode
        this.enemies.forEach((enemy) => {
          if (enemy.bodyId) {
            b2Body_SetAwake(enemy.bodyId, true);
          }
        });
      }

      console.log("Debug drawing:", this.debugEnabled ? "enabled" : "disabled");
    }

    // Update platform sleep states based on visibility
    // This needs to be done before physics step for proper culling
    let activePlatformCount = 0;
    let sleepingPlatformCount = 0;

    // Update platform sleep states based on visibility to camera
    this.platforms.forEach((platform: Platform) => {
      const isVisible = platform.updateSleepState();
      if (isVisible) {
        activePlatformCount++;
      } else {
        sleepingPlatformCount++;
      }
    });

    // Update sleep states for coins based on visibility
    let activeCoinsCount = 0;
    let sleepingCoinsCount = 0;

    if (this.coins) {
      this.coins.getChildren().forEach((coin: any) => {
        if (coin instanceof Coin && !coin.isCollected) {
          const isVisible = coin.updateSleepState();
          if (isVisible) {
            activeCoinsCount++;
          } else {
            sleepingCoinsCount++;
          }
        }
      });
    }

    // Update sleep states for enemies based on visibility
    let activeEnemiesCount = 0;
    let sleepingEnemiesCount = 0;

    this.enemies.forEach((enemy: Enemy) => {
      // Skip sleep state updates if in debug mode
      if (!this.debugEnabled) {
        const isVisible = enemy.updateSleepState();
        if (isVisible) {
          activeEnemiesCount++;
        } else {
          sleepingEnemiesCount++;
        }
      } else {
        // In debug mode, all enemies are considered active
        activeEnemiesCount++;
        // Force enemies to be awake in debug mode
        if (enemy.bodyId) {
          b2Body_SetAwake(enemy.bodyId, true);
        }
      }
    });

    // Update sleep states for crates based on visibility
    let activeCratesCount = 0;
    let sleepingCratesCount = 0;

    // Use the crates array directly instead of filtering from bodyIdToSpriteMap
    this.crates.forEach((crate: Crate) => {
      const isVisible = crate.updateSleepState();
      if (isVisible) {
        activeCratesCount++;
      } else {
        sleepingCratesCount++;
      }
    });

    b2World_Step(worldId, delta / 1000, 60);
    UpdateWorldSprites(worldId);

    // Draw debug graphics if enabled
    if (this.debugEnabled && this.debugDraw) {
      // Clear previous debug drawing
      this.debugGraphics.clear();

      // Verify worldId is valid before drawing
      if (!worldId) {
        console.error("Cannot draw debug graphics: worldId is null");
        return;
      }

      // Use Box2D's built-in debug drawing functionality
      b2World_Draw(worldId, this.debugDraw);

      // Draw world bounds - WHITE DASHED
      this.debugGraphics.lineStyle(2, 0xffffff, 0.5);
      this.debugGraphics.strokeRect(0, 0, WORLD.WIDTH, WORLD.HEIGHT);

      // Draw death sensor - RED LINE
      if (this.deathSensor) {
        this.debugGraphics.lineStyle(6, 0xff0000, 0.8);
        this.debugGraphics.lineBetween(
          0,
          WORLD.DEATH_SENSOR_Y,
          WORLD.WIDTH,
          WORLD.DEATH_SENSOR_Y
        );
      }

      // Display debug information with more details
      const debugInfo = [
        `Player position: (${Math.floor(this.player.x)}, ${Math.floor(
          this.player.y
        )})`,
        `Grounded: ${this.player.playerState.isGrounded}`,
        `Collected coins: ${this.coinCounter.text?.text ?? "0"}`,
        `Game Entities:`,
        `  Player: 1`,
        `  Enemies: ${this.enemies.length} (${activeEnemiesCount} active, ${sleepingEnemiesCount} sleeping)`,
        `  Coins: ${
          this.coins.getChildren().length
        } (${activeCoinsCount} active, ${sleepingCoinsCount} sleeping)`,
        `  Crates: ${this.crates.length} (${activeCratesCount} active, ${sleepingCratesCount} sleeping)`,
        `Camera: (${Math.floor(this.cameras.main.scrollX)}, ${Math.floor(
          this.cameras.main.scrollY
        )})`,
        `Platforms: ${this.platforms.length} total (${activePlatformCount} active, ${sleepingPlatformCount} sleeping)`,
      ].join("\n");

      if (this.debugText) {
        this.debugText.setText(
          "Press D to toggle physics debug view\n" + debugInfo
        );
      }
    }

    if (gameState.isPlaying) {
      this.processPhysicsEvents(worldId);

      if (this.player) {
        // Add check to ensure player's bodyId and gameState.worldId are both initialized
        if (this.player.bodyId && gameState.worldId) {
          // Update player if it exists, regardless of controls
          if (this.controls) {
            this.player.update(this.controls);
          } else {
            // If controls aren't available, still update player without controls
            this.player.update({} as Phaser.Types.Input.Keyboard.CursorKeys);
          }

          // Ensure camera is properly following the player every frame
          this.cameras.main.scrollX = Phaser.Math.Linear(
            this.cameras.main.scrollX,
            this.player.x - this.cameras.main.width / 2,
            0.1
          );
          this.cameras.main.scrollY = Phaser.Math.Linear(
            this.cameras.main.scrollY,
            this.player.y - this.cameras.main.height / 2,
            0.1
          );
        } else if (!this.player.playerState.hasLoggedPhysicsWarning) {
          // If physics aren't ready, log a warning once
          console.warn(
            "GameScene: Skipping player update until physics are ready"
          );
          this.player.playerState.hasLoggedPhysicsWarning = true;

          // Try to reinitialize player physics if needed
          if (!this.player.bodyId) {
            console.log("Attempting to reinitialize player physics...");
            this.player.initPhysics();
          }
        }
      }

      // Update enemies
      this.enemies.forEach((enemy) => {
        enemy.update();
      });

      this.mobileControls.getState();
      this.coinCounter.updateCount();
    }

    if (gameState.isGameOver && this.input.activePointer.isDown) {
      this.startGame();
    }
  }

  processPhysicsEvents(worldId: b2WorldIdInstance) {
    const sensorEvents = b2World_GetSensorEvents(worldId);

    // Debug logging for sensor events
    if (sensorEvents.beginEvents.length > 0) {
      console.log(
        `Processing ${sensorEvents.beginEvents.length} sensor begin events`
      );
    }

    for (const event of sensorEvents.beginEvents) {
      const sensorShapeId = event.sensorShapeId;
      const visitorShapeId = event.visitorShapeId;
      const sensorUserData = b2Shape_GetUserData(
        sensorShapeId
      ) as ShapeUserData;
      const visitorUserData = b2Shape_GetUserData(
        visitorShapeId
      ) as ShapeUserData;

      // Debug logging for user data
      console.log("Sensor event userData:", {
        sensorType: sensorUserData?.type,
        visitorType: visitorUserData?.type,
        sensorData: sensorUserData,
        visitorData: visitorUserData,
      });

      let coinInstance: Coin | null = null;
      if (
        sensorUserData?.type === "coin" &&
        visitorUserData?.type === "player"
      ) {
        console.log("Coin-Player collision detected");
        coinInstance = sensorUserData.coinInstance as Coin;
        if (!coinInstance) {
          console.error(
            "Missing coinInstance in sensorUserData:",
            sensorUserData
          );
        }
      } else if (
        sensorUserData?.type === "player" &&
        visitorUserData?.type === "coin"
      ) {
        console.log("Player-Coin collision detected");
        coinInstance = visitorUserData.coinInstance as Coin;
        if (!coinInstance) {
          console.error(
            "Missing coinInstance in visitorUserData:",
            visitorUserData
          );
        }
      }

      if (coinInstance && !coinInstance.isCollected) {
        console.log("Collecting coin:", coinInstance);
        coinInstance.collect();
        gameState.incrementCoins();
      }

      if (
        (sensorUserData?.type === "player" &&
          visitorUserData?.type === "deathSensor") ||
        (visitorUserData?.type === "player" &&
          sensorUserData?.type === "deathSensor")
      ) {
        // Log position and reset player
        console.log("Player contacted death sensor at position:", {
          x: this.player?.x,
          y: this.player?.y,
        });

        // Kill the player which stops movement and plays death animation
        this.player.kill();

        // Call killPlayer to handle game over state change
        this.killPlayer();
      }
    }

    const contactEvents = b2World_GetContactEvents(worldId);

    if (this.player && this.player.bodyId) {
      // First, check for begin/hit contact events
      for (const event of contactEvents.beginEvents) {
        this.processContactEvent(event, true);
      }

      for (const event of contactEvents.hitEvents) {
        this.processContactEvent(event, true);
      }

      // Then check for end contact events
      for (const event of contactEvents.endEvents) {
        this.processContactEvent(event, false);
      }
    }
  }

  /**
   * Process a single contact event to determine player grounding
   * @param event The contact event to process
   * @param isBeginningContact Whether this is a beginning/continuing contact (true) or ending contact (false)
   */
  private processContactEvent(
    event: {
      shapeIdA: unknown;
      shapeIdB: unknown;
      normal?: { x: number; y: number };
    },
    isBeginningContact: boolean
  ) {
    if (!this.player || !this.player.bodyId) return;

    const shapeIdA = event.shapeIdA;
    const shapeIdB = event.shapeIdB;
    const userDataA = b2Shape_GetUserData(shapeIdA) as ShapeUserData;
    const userDataB = b2Shape_GetUserData(shapeIdB) as ShapeUserData;
    const isSensorA = b2Shape_IsSensor(shapeIdA);
    const isSensorB = b2Shape_IsSensor(shapeIdB);

    // Only check solid collisions (not sensors)
    if (!isSensorA && !isSensorB) {
      // Check for player-platform or player-crate contact
      let playerUserData: ShapeUserData | null = null;
      let otherUserData: ShapeUserData | null = null;

      if (userDataA?.type === "player") {
        playerUserData = userDataA;
        otherUserData = userDataB;
      } else if (userDataB?.type === "player") {
        playerUserData = userDataB;
        otherUserData = userDataA;
      }

      // Check if player is contacting an enemy
      if (playerUserData && otherUserData?.type === "enemy") {
        if (isBeginningContact) {
          console.log("Player contacted enemy!");
          this.killPlayer();
          // No need to process grounding for enemy contact
          return; // Exit early
        }
      }

      // Check if player is contacting a groundable surface
      const isGroundableContact =
        playerUserData &&
        (otherUserData?.type === "platform" || otherUserData?.type === "crate");

      if (isGroundableContact) {
        // --- Add Logging --- Start
        if (otherUserData?.type === "crate") {
          console.log(
            `Player-Crate Contact Detected. UserData:`,
            otherUserData,
            `EventNormal:`,
            event.normal
          );
        }
        // --- Add Logging --- End

        // Determine if player is above the surface
        const velocity = b2Body_GetLinearVelocity(this.player.bodyId);
        let isBottomContact = false;

        // --- Check for missing normal but low velocity --- Start
        // For crates, we'll be more lenient with the velocity threshold
        const velocityThreshold = otherUserData?.type === "crate" ? 0.5 : 0.2;

        if (
          !event.normal &&
          isBeginningContact &&
          Math.abs(velocity.y) < velocityThreshold
        ) {
          console.log(
            "Grounding player due to low velocity despite missing contact normal."
          );
          isBottomContact = true; // Infer bottom contact
        }
        // --- Check for missing normal but low velocity --- End

        // Existing check for when normal IS defined
        else if (event.normal) {
          // Check if the player feet are contacting platform (y normal > 0)
          // For crates, be more lenient with the normal threshold
          const normalThreshold = otherUserData?.type === "crate" ? 0.05 : 0.1;
          isBottomContact = event.normal.y > normalThreshold;

          console.log(
            `Contact normal.y: ${event.normal.y}, isBottomContact: ${isBottomContact}`
          );
        }

        // If this is a new contact and player is contacting platform from bottom/feet
        if (isBeginningContact) {
          // For crates, also check small downward velocity as an additional condition
          if (
            isBottomContact ||
            Math.abs(velocity.y) < velocityThreshold ||
            (otherUserData?.type === "crate" && velocity.y < 0.1)
          ) {
            this.player.setGrounded(true);

            // Apply a small additional downward impulse for platforms to stabilize
            // But use a gentler impulse for crates to prevent sinking/clipping
            if (this.player.bodyId) {
              let impulseStrength = -0.1; // Default for platforms

              if (otherUserData?.type === "crate") {
                impulseStrength = -0.05; // Gentler for crates
              }

              const stabilizeImpulse = new b2Vec2(0, impulseStrength);
              b2Body_ApplyLinearImpulseToCenter(
                this.player.bodyId,
                stabilizeImpulse,
                true
              );
            }

            console.log(
              `Player grounded on ${otherUserData?.type} from bottom contact or low vertical movement`
            );
          }
        } else {
          // Ending contact
          if (this.player.playerState.isGrounded && isBottomContact) {
            // Check if there are any other groundable contacts still active
            let hasOtherGroundableContact = false;

            // Look through current begin/hit events
            for (const otherEvent of [
              ...(b2World_GetContactEvents(gameState.worldId).beginEvents ||
                []),
              ...(b2World_GetContactEvents(gameState.worldId).hitEvents || []),
            ]) {
              // Skip if it's the same event
              if (otherEvent === event) continue;

              const otherShapeIdA = otherEvent.shapeIdA;
              const otherShapeIdB = otherEvent.shapeIdB;
              const otherUserDataA = b2Shape_GetUserData(
                otherShapeIdA
              ) as ShapeUserData;
              const otherUserDataB = b2Shape_GetUserData(
                otherShapeIdB
              ) as ShapeUserData;

              // Check if this is another groundable contact
              let otherEventPlayerUserData: ShapeUserData | null = null;
              let otherEventOtherUserData: ShapeUserData | null = null;

              if (otherUserDataA?.type === "player") {
                otherEventPlayerUserData = otherUserDataA;
                otherEventOtherUserData = otherUserDataB;
              } else if (otherUserDataB?.type === "player") {
                otherEventPlayerUserData = otherUserDataB;
                otherEventOtherUserData = otherUserDataA;
              }

              if (
                !b2Shape_IsSensor(otherShapeIdA) &&
                !b2Shape_IsSensor(otherShapeIdB) &&
                otherEventPlayerUserData &&
                (otherEventOtherUserData?.type === "platform" ||
                  otherEventOtherUserData?.type === "crate")
              ) {
                hasOtherGroundableContact = true;
                break;
              }
            }

            // Only set ungrounded if there are no other groundable contacts
            if (!hasOtherGroundableContact) {
              this.player.setGrounded(false);
              console.log(
                "Player ungrounded from end contact with platform/crate"
              );
            }
          }
        }
      }
    }
  }

  killPlayer() {
    if (!gameState.isPlaying || gameState.isGameOver) return;

    console.log("Executing killPlayer...");
    // Ensure player exists before killing
    if (this.player && !this.player.playerState.isDead) {
      this.player.kill();
    }
    gameState.endGame();
    this.gameOverOverlay.show();
  }

  startGame() {
    if (gameState.isGameOver) {
      // If restarting from game over, do a full restart
      this.restart();
      return; // Exit early after restarting
    }

    if (gameState.isReady) {
      if (this.player && this.player.bodyId) {
        // Enable gravity when game starts (this is what makes the player start falling)
        b2Body_SetGravityScale(this.player.bodyId, 1);
        console.log("Enabled gravity for player body");
      }

      gameState.startGame();
      this.startScreen.hide();
      this.gameOverOverlay.hide();
    }
  }

  /**
   * Restarts the game logic without reloading the scene or destroying the Box2D world.
   * Resets player position, state, collected coins, and UI elements.
   */
  restart() {
    console.log("Restarting game logic (persistent world)...");

    // --- First reset the game state to ensure proper sequence --- //
    console.log("Resetting game state...");
    gameState.restartGame(); // Reset game state to READY
    console.log("Game state reset complete. Now resetting entities...");

    // --- Update UI first to avoid potential physics issues --- //
    console.log("Updating UI...");
    this.gameOverOverlay.hide();
    this.startScreen.show(); // Show start screen to initiate playing again
    this.coinCounter.updateCount(); // Update coin counter display to show 0

    // Add a short delay to ensure UI updates are processed before physics changes
    this.time.delayedCall(0, () => {
      // --- Reset the player first as it's most important --- //
      if (this.player) {
        // Regenerate level data to get player spawn position only
        const levelData = generateLevel(this, this.coins, true);

        // Reset player state and position using the new spawn point
        this.player.startPosition.set(
          levelData.playerSpawnPosition.x,
          levelData.playerSpawnPosition.y
        );

        // Reset player (which resets physics)
        this.player.reset();

        // Update camera position
        this.cameras.main.centerOn(this.player.x, this.player.y);
      }

      // Add a small delay before resetting other entities to avoid physics conflicts
      this.time.delayedCall(50, () => {
        // --- Reset existing entities instead of destroying and recreating them --- //

        // Reset all existing coins instead of destroying them
        console.log(`Resetting ${this.coins.getChildren().length} coins...`);
        let resetCoinsCount = 0;

        this.coins.getChildren().forEach((coin: any) => {
          if (coin instanceof Coin) {
            // Check if this coin was collected
            const wasCollected = coin.isCollected;
            coin.reset();
            if (wasCollected) {
              resetCoinsCount++;
            }
          }
        });
        console.log(`Reset ${resetCoinsCount} previously collected coins`);

        // Reset all existing crates
        console.log(`Resetting ${this.crates.length} crates...`);
        this.crates.forEach((crate) => {
          if (typeof crate.reset === "function") {
            crate.reset();
          }
        });

        // Reset all existing enemies instead of destroying them
        console.log(`Resetting ${this.enemies.length} enemies...`);
        this.enemies.forEach((enemy) => {
          if (typeof enemy.reset === "function") {
            enemy.reset();
          }
        });

        // Verify all coins are now properly visible and awake
        this.time.delayedCall(100, () => {
          let invisibleCoins = 0;
          let sleepingCoins = 0;

          this.coins.getChildren().forEach((coin: any) => {
            if (coin instanceof Coin) {
              // Check visibility
              if (!coin.visible || coin.isCollected) {
                console.log(
                  `Found invisible coin at (${coin.x}, ${coin.y}), forcing visibility`
                );
                coin.setVisible(true);
                coin.setActive(true);
                coin.isCollected = false;
                invisibleCoins++;
              }

              // Check if the coin is awake
              if (coin.bodyId && !coin.isAwake()) {
                console.log(
                  `Found sleeping coin at (${coin.x}, ${coin.y}), waking it up`
                );
                b2Body_SetAwake(coin.bodyId, true);
                sleepingCoins++;
              }

              // Ensure it's in the bodyIdToSpriteMap
              if (
                coin.bodyId &&
                !this.bodyIdToSpriteMap.has(coin.bodyId.index1)
              ) {
                console.log(
                  `Adding coin back to bodyIdToSpriteMap at (${coin.x}, ${coin.y})`
                );
                this.bodyIdToSpriteMap.set(coin.bodyId.index1, coin);
              }
            }
          });

          if (invisibleCoins > 0 || sleepingCoins > 0) {
            console.log(
              `Fixed ${invisibleCoins} invisible coins and ${sleepingCoins} sleeping coins`
            );
          } else {
            console.log("All coins verified visible and awake");
          }
        });

        console.log("Game logic restart complete.");
      });
    });
  }
}
