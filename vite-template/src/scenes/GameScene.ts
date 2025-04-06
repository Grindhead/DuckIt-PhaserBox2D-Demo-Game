/**
 * @file GameScene.ts
 * @description The main scene where the gameplay takes place.
 * It initializes the Box2D physics world, creates the player, level elements (platforms, etc.),
 * UI components (coin counter, overlays, mobile controls), handles input, manages game state,
 * and runs the game loop (physics updates, player updates).
 */
import * as Phaser from "phaser";

import { PHYSICS, WORLD, SCENES, ASSETS } from "@constants";
import DeathSensor from "@entities/DeathSensor";
import Player from "@entities/Player";
import { gameState, GameStates } from "@gameState";
import {
  CreateWorld,
  STATIC,
  b2DefaultBodyDef,
  b2World_Step,
  SpriteToBox,
  pxmVec2,
  UpdateWorldSprites,
  // UpdateWorldSprites, // Keep commented out for now
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

    // Use SpriteToBox to link the sprite with a static body
    SpriteToBox(gameState.worldId, image, {
      bodyDef,
      density: 0, // Static bodies have 0 density
      friction: PHYSICS.PLATFORM.FRICTION,
      restitution: 0,
      userData: { type: "platform" },
    });

    // No need for AddSpriteToWorld explicitly here, as SpriteToBox handles the linking
  }

  update(_time: number, delta: number) {
    // Add log to see if update is running and check state (using getters)
    // console.log(`GameScene update - isPlaying: ${gameState.isPlaying}`);
    if (gameState.isPlaying) {
      // Add log inside the isPlaying check
      // console.log('Physics and player update running...'); // Remove log
      const timeStep = delta / 1000;
      const subStepCount = 3;

      b2World_Step(gameState.worldId, timeStep, subStepCount);

      if (this.player && this.controls) {
        this.player.update(this.controls);
      }
      this.mobileControls.getState();
      // Update the coin counter display
      this.coinCounter.updateCount();
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
      gameState.reset();
      // ---> REVERT TO POSITIVE GRAVITY ON RESTART <--- //
      const worldData = CreateWorld({ x: 0, y: PHYSICS.GRAVITY.y });
      gameState.setWorldId(worldData.worldId);

      this.player?.reset();
      this.deathSensor?.reset();

      gameState.transition(GameStates.READY);
      this.startGame();
    }
  }
}
