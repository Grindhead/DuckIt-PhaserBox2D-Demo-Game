/**
 * @file GameScene.ts
 * @description The main scene where the gameplay takes place.
 * It initializes the Box2D physics world, creates the player, level elements (platforms, etc.),
 * UI components (coin counter, overlays, mobile controls), handles input, manages game state,
 * and runs the game loop (physics updates, player updates).
 */
import * as Phaser from "phaser";

import { PHYSICS, WORLD, SCENES, ASSETS } from "@constants";
import Coin from "@entities/Coin";
import DeathSensor from "@entities/DeathSensor";
import Player from "@entities/Player";
import { gameState, GameStates } from "@gameState";
import {
  CreateWorld,
  b2BodyId,
  b2DestroyBody,
  STATIC,
  b2DefaultBodyDef,
  b2World_Step,
  SpriteToBox,
  pxmVec2,
  UpdateWorldSprites,
  ClearWorldSprites,
  AddSpriteToWorld,
  b2World_GetSensorEvents,
  b2Shape_GetUserData,
} from "@PhaserBox2D";
import CoinCounter from "@ui/CoinCounter";
import GameOverOverlay from "@ui/GameOverOverlay";
import GameStartScreen from "@ui/GameStartScreen";
import MobileControls from "@ui/MobileControls";

import { generateLevel } from "../lib/levelGenerator";

export default class GameScene extends Phaser.Scene {
  player!: Player;
  deathSensor!: DeathSensor;
  controls: Phaser.Types.Input.Keyboard.CursorKeys | null = null;
  coinCounter!: CoinCounter;
  startScreen!: GameStartScreen;
  gameOverOverlay!: GameOverOverlay;
  mobileControls!: MobileControls;

  // Queue for delayed body destruction
  bodiesToDestroy: (typeof b2BodyId)[] = [];

  constructor() {
    super({ key: SCENES.GAME });
  }

  create() {
    const world = CreateWorld({ x: 0, y: PHYSICS.GRAVITY.y });
    gameState.setWorldId(world.worldId);

    this.player = new Player(this);
    this.deathSensor = new DeathSensor(this);

    if (this.input.keyboard) {
      this.controls = this.input.keyboard.createCursorKeys();
    }

    this.cameras.main.setBounds(0, 0, WORLD.WIDTH, WORLD.HEIGHT);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    this.createUI();
    generateLevel(this); // Uncomment level generation
    this.setupInput();

    this.startScreen.show();

    // Listen for coin collection event to queue body destruction
    this.events.on("queueBodyDestruction", (bodyId: typeof b2BodyId) => {
      if (bodyId) {
        this.bodiesToDestroy.push(bodyId);
      }
    });
  }

  createUI() {
    this.coinCounter = new CoinCounter(this);
    this.startScreen = new GameStartScreen(this);
    this.gameOverOverlay = new GameOverOverlay(this);
  }

  setupInput() {
    this.mobileControls = new MobileControls(this);
  }

  /**
   * Creates a single platform segment (sprite and physics body).
   *
   * @param x The center x position in pixels.
   * @param y The center y position in pixels.
   * @param type The type of platform segment ('left', 'middle', 'right').
   */
  createPlatformSegment(
    x: number,
    y: number,
    type: "left" | "middle" | "right"
  ) {
    let assetKey: string;
    switch (type) {
      case "left":
        assetKey = ASSETS.PLATFORM.LEFT;
        break;
      case "middle":
        assetKey = ASSETS.PLATFORM.MIDDLE;
        break;
      case "right":
        assetKey = ASSETS.PLATFORM.RIGHT;
        break;
    }

    const image = this.add.image(x, y, ASSETS.ATLAS, assetKey);

    const bodyDef = {
      ...b2DefaultBodyDef(),
      type: STATIC,
      position: pxmVec2(x, y),
    };

    // Use SpriteToBox to create the physics body
    const { bodyId } = SpriteToBox(gameState.worldId, image, {
      bodyDef,
      density: 0, // Static bodies have 0 density
      friction: PHYSICS.PLATFORM.FRICTION,
      restitution: 0,
      userData: { type: "platform" },
    });

    // Explicitly add the sprite and body to the tracking map
    AddSpriteToWorld(gameState.worldId, image, { bodyId });
  }

  update(_time: number, delta: number) {
    // Destroy bodies queued for removal
    if (this.bodiesToDestroy.length > 0) {
      for (const bodyId of this.bodiesToDestroy) {
        if (bodyId) {
          b2DestroyBody(bodyId);
        }
      }
      this.bodiesToDestroy.length = 0;
    }

    if (gameState.isPlaying) {
      const timeStep = delta / 1000;
      const subStepCount = 3;

      b2World_Step(gameState.worldId, timeStep, subStepCount);

      if (this.player && this.controls) {
        this.player.update(this.controls);
      }
      this.mobileControls.getState();
      this.coinCounter.updateCount();

      UpdateWorldSprites(gameState.worldId);

      // --- Process Sensor Events (Replaces Contact Events) ---
      const sensorEvents = b2World_GetSensorEvents(gameState.worldId);

      // Process Begin Sensor Events
      for (const event of sensorEvents.beginEvents) {
        const sensorShapeId = event.sensorShapeId;
        const visitorShapeId = event.visitorShapeId;

        // Get user data from the shapes involved
        const sensorUserData = b2Shape_GetUserData(sensorShapeId);
        const visitorUserData = b2Shape_GetUserData(visitorShapeId);

        // Add console log for debugging sensor events
        console.log(
          "Sensor Begin Event - Sensor Data:",
          sensorUserData,
          "Visitor Data:",
          visitorUserData
        );

        // Check for player-coin sensor collision
        let coinInstance: Coin | null = null;

        if (
          sensorUserData?.type === "coin" &&
          visitorUserData?.type === "player"
        ) {
          coinInstance = sensorUserData.coinInstance as Coin;
        } else if (
          sensorUserData?.type === "player" &&
          visitorUserData?.type === "coin"
        ) {
          // Player might also be a sensor in some cases, handle if needed
          // This case shouldn't happen for coin collection based on current setup
          // but included for completeness if player shape also becomes a sensor
          coinInstance = visitorUserData.coinInstance as Coin;
        }

        // If it's a player-coin collision, collect the coin
        if (coinInstance && !coinInstance.isCollected) {
          coinInstance.collect();
          gameState.incrementCoins();
        }

        // TODO: Add checks for other sensor interactions if needed
      }

      // Process End Sensor Events (Optional: if logic is needed when player leaves coin area)
      // for (const event of sensorEvents.endEvents) {
      //   const sensorShapeId = event.sensorShapeId;
      //   const visitorShapeId = event.visitorShapeId;
      //   const sensorUserData = b2Shape_GetUserData(sensorShapeId);
      //   const visitorUserData = b2Shape_GetUserData(visitorShapeId);
      //   // ... logic for end overlap ...
      // }
      // -------------------------------------------------------
    }
  }

  killPlayer() {
    if (!gameState.isPlaying) return;

    this.player.kill();
    gameState.endGame();
    this.gameOverOverlay.show();
  }

  startGame() {
    // Add log to check if startGame is called and the state (using getters)
    // console.log(`GameScene.startGame() called. isReady: ${gameState.isReady}, isPlaying: ${gameState.isPlaying}, isGameOver: ${gameState.isGameOver}`); // Remove log
    if (gameState.isReady) {
      const success = gameState.startGame();
      // Add log to check transition result
      console.log(
        `gameState.startGame() transition success: ${success}, newState isPlaying: ${gameState.isPlaying}`
      ); // Remove log
    }
  }

  restart() {
    if (gameState.isGameOver) {
      // Clear sprites associated with the old world BEFORE creating a new one
      ClearWorldSprites(gameState.worldId);

      gameState.reset();
      // ---> REVERT TO POSITIVE GRAVITY ON RESTART <--- //
      const worldData = CreateWorld({ x: 0, y: PHYSICS.GRAVITY.y });
      gameState.setWorldId(worldData.worldId);

      this.player?.reset();
      this.deathSensor?.reset();

      // Regenerate the level (platforms, coins) in the new world
      generateLevel(this);

      gameState.transition(GameStates.READY);
      this.startGame();
    }
  }
}
