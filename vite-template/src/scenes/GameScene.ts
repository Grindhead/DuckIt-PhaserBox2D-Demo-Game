import * as Phaser from "phaser";
import {
  CreateBoxPolygon,
  CreateWorld,
  STATIC,
  b2DefaultBodyDef,
  b2Vec2,
  pxmVec2,
  b2World_Step,
} from "@PhaserBox2D";
import { PHYSICS, WORLD, SCENES } from "@constants";
import { gameState } from "@gameState";
import Player from "../entities/Player";
import DeathSensor from "../entities/DeathSensor";
import CoinCounter from "../ui/CoinCounter";
import MobileControls from "../ui/MobileControls";
import GameStartScreen from "../ui/GameStartScreen";
import GameOverOverlay from "../ui/GameOverOverlay";

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
    const world = CreateWorld();
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
      this.matter.world.on("collisionstart", (event: any) => {
        event.pairs.forEach((pair: any) => {
          const { bodyA, bodyB } = pair;
          const userDataA = bodyA.gameObject?.userData;
          const userDataB = bodyB.gameObject?.userData;

          if (
            (userDataA?.type === "player" &&
              userDataB?.type === "deathSensor") ||
            (userDataA?.type === "deathSensor" && userDataB?.type === "player")
          ) {
            this.killPlayer();
          }
        });
      });
    }
  }

  update(delta: number) {
    if (gameState.isPlaying) {
      const timeStep = delta / 1000;
      const subStepCount = 3;
      b2World_Step(gameState.worldId, timeStep, subStepCount);

      if (this.controls) {
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
    gameState.startGame();
  }

  restart() {
    gameState.reset();
    this.player.reset();
    this.coinCounter.updateCount(0);

    if (this.gameOverOverlay) {
      this.gameOverOverlay.hide();
    }
    if (this.startScreen) {
      this.startScreen.show();
    }
  }
}
