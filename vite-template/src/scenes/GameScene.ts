import * as Phaser from "phaser";
import {
  CreateBoxPolygon,
  CreateWorld,
  DestroyWorld,
  STATIC,
  b2DefaultBodyDef,
  b2Vec2,
  pxmVec2,
  StepWorld,
} from "../lib/PhaserBox2D.js";
import { PHYSICS, WORLD, SCENES, ASSETS } from "../lib/constants.js";
import { gameState, GameStates } from "../lib/gameState.js";
import Player from "../entities/Player.js";
import DeathSensor from "../entities/DeathSensor.js";
import CoinCounter from "../ui/CoinCounter.js";
import MobileControls from "../ui/MobileControls.js";
import GameStartScreen from "../ui/GameStartScreen.js";
import GameOverOverlay from "../ui/GameOverOverlay.js";

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.GAME });
  }

  create() {
    // Create Box2D world
    const world = CreateWorld();

    gameState.setWorldId(world.worldId);

    // Create background
    this.add
      .tileSprite(
        0,
        0,
        WORLD.WIDTH,
        WORLD.HEIGHT,
        ASSETS.ATLAS,
        ASSETS.BACKGROUND
      )
      .setOrigin(0, 0);

    // Create player
    this.player = new Player(this);

    // Create death sensor
    this.deathSensor = new DeathSensor(this);

    // Setup collision detection
    this.setupCollisions();

    // Setup controls
    this.controls = this.input.keyboard.createCursorKeys();

    // Initialize game state
    gameState.transition(GameStates.READY);

    // Set up camera bounds
    this.cameras.main.setBounds(0, 0, WORLD.WIDTH, WORLD.HEIGHT);

    // Create UI elements
    this.createUI();

    // Generate level
    this.generateLevel();

    // Set up input handlers
    this.setupInput();

    // Show start screen
    this.startScreen.show(false);
  }

  createUI() {
    this.coinCounter = new CoinCounter(this);
    this.startScreen = new GameStartScreen(this);
    this.gameOverOverlay = new GameOverOverlay(this);
  }

  setupInput() {
    // Mobile controls
    this.mobileControls = new MobileControls(this);
  }

  generateLevel() {
    // Create a temporary ground platform for testing
    CreateBoxPolygon({
      worldId: gameState.worldId,
      type: STATIC,
      bodyDef: b2DefaultBodyDef(),
      position: pxmVec2(500, 700),
      size: new b2Vec2(50, 1),
      friction: PHYSICS.PLATFORM.FRICTION,
    });
  }

  setupCollisions() {
    this.matter.world.on("collisionstart", (event) => {
      event.pairs.forEach((pair) => {
        const { bodyA, bodyB } = pair;
        const userDataA = bodyA.gameObject?.userData;
        const userDataB = bodyB.gameObject?.userData;

        if (
          (userDataA?.type === "player" && userDataB?.type === "deathSensor") ||
          (userDataA?.type === "deathSensor" && userDataB?.type === "player")
        ) {
          this.killPlayer();
        }
      });
    });
  }

  update() {
    if (gameState.currentState === GameStates.PLAYING) {
      // Update physics world
      StepWorld(gameState.worldId);

      // Update player
      this.player.update(this.controls);
    }
  }

  killPlayer() {
    if (gameState.currentState !== GameStates.PLAYING) return;

    this.player.kill();
    gameState.transition(GameStates.GAME_OVER);
    this.gameOverOverlay.show();
  }

  startGame() {
    gameState.startGame();
  }

  restart() {
    // Reset all entities
    this.player.reset();
    this.deathSensor.reset();

    // Reset game state
    gameState.reset();

    // Now the scene can be restarted
    this.scene.restart();
  }

  shutdown() {
    // Clean up physics bodies
    if (this.player) {
      this.player.destroy();
    }
    if (this.deathSensor) {
      this.deathSensor.destroy();
    }

    // Clean up UI components
    this.coinCounter.destroy();
    this.mobileControls.destroy();
    this.startScreen.destroy();
    if (this.gameOverOverlay) {
      this.gameOverOverlay.destroy();
    }

    // Destroy Box2D world
    DestroyWorld(gameState.worldId);
  }
}
