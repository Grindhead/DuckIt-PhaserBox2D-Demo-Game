/**
 * @file GameScene.ts
 * @description The main scene where the gameplay takes place.
 * It initializes the Box2D physics world, creates the player, level elements (platforms, etc.),
 * UI components (coin counter, overlays, mobile controls), handles input, manages game state,
 * and runs the game loop (physics updates, player updates).
 */
import * as Phaser from "phaser";

import { PHYSICS, WORLD, SCENES } from "@constants";
import DeathSensor from "@entities/DeathSensor";
import Player from "@entities/Player";
import { gameState, GameStates } from "@gameState";
import {
  CreateBoxPolygon,
  CreateWorld,
  STATIC,
  b2DefaultBodyDef,
  b2Vec2,
  pxmVec2,
  b2World_Step,
} from "@PhaserBox2D";
import CoinCounter from "@ui/CoinCounter";
import GameOverOverlay from "@ui/GameOverOverlay";
import GameStartScreen from "@ui/GameStartScreen";
import MobileControls from "@ui/MobileControls";

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

    this.setupCollisions();

    if (this.input.keyboard) {
      this.controls = this.input.keyboard.createCursorKeys();
    }

    this.cameras.main.setBounds(0, 0, WORLD.WIDTH, WORLD.HEIGHT);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    this.createUI();
    this.generateLevel();
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

  generateLevel() {
    CreateBoxPolygon({
      worldId: gameState.worldId,
      type: STATIC,
      bodyDef: b2DefaultBodyDef(),
      position: pxmVec2(500, 700),
      size: new b2Vec2(50, 1),
      friction: PHYSICS.PLATFORM.FRICTION,
      updateBodyMass: false,
    });
  }

  setupCollisions() {
    if (this.matter?.world) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.matter.world.on("collisionstart", (event: any) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        event.pairs.forEach((pair: any) => {
          const { bodyA, bodyB } = pair;
          const gameObjectA = bodyA.gameObject;
          const gameObjectB = bodyB.gameObject;

          if (
            gameObjectA instanceof Player &&
            gameObjectB instanceof DeathSensor
          ) {
            gameObjectA.kill();
          } else if (
            gameObjectB instanceof Player &&
            gameObjectA instanceof DeathSensor
          ) {
            gameObjectB.kill();
          }
        });
      });
    }
  }

  update(_time: number, delta: number) {
    if (gameState.isPlaying) {
      const timeStep = delta / 1000;
      const subStepCount = 3;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      b2World_Step(gameState.worldId as any, timeStep, subStepCount);

      if (this.player && this.controls) {
        this.player.update(this.controls);
      }
      this.mobileControls.getState();
    }
  }

  killPlayer() {
    if (!gameState.isPlaying) return;

    this.player.kill();
    gameState.endGame();
    this.gameOverOverlay.show();
  }

  startGame() {
    if (gameState.isReady) {
      gameState.startGame();
    }
  }

  restart() {
    if (gameState.isGameOver) {
      gameState.reset();
      const worldId = CreateWorld({ x: 0, y: PHYSICS.GRAVITY.y });
      gameState.setWorldId(worldId);

      this.player?.reset();
      this.deathSensor?.reset();

      gameState.transition(GameStates.READY);
      this.startGame();
    }
  }
}
