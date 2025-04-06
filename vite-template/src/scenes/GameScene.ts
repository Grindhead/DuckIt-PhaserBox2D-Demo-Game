/**
 * @file GameScene.ts
 * @description The main scene where the gameplay takes place.
 * It initializes the Box2D physics world, creates the player, level elements (platforms, etc.),
 * UI components (coin counter, overlays, mobile controls), handles input, manages game state,
 * and runs the game loop (physics updates, player updates).
 */

import * as Phaser from "phaser";

import { PHYSICS, WORLD, SCENES } from "@constants";
import Coin from "@entities/Coin";
import DeathSensor from "@entities/DeathSensor";
import Player from "@entities/Player";
import { gameState, GameStates } from "@gameState";
import {
  b2Body_GetLinearVelocity,
  b2BodyId,
  b2CreateWorld,
  b2CreateWorldArray,
  b2DefaultWorldDef,
  b2DestroyBody,
  b2Shape_GetUserData,
  b2Shape_IsSensor,
  b2Vec2,
  b2World_GetContactEvents,
  b2World_GetSensorEvents,
  b2World_Step,
  UpdateWorldSprites,
  b2WorldId,
  b2Body_SetLinearVelocity,
  b2Body_SetGravityScale,
} from "@PhaserBox2D";
import CoinCounter from "@ui/CoinCounter";
import GameOverOverlay from "@ui/GameOverOverlay";
import GameStartScreen from "@ui/GameStartScreen";
import MobileControls from "@ui/MobileControls";

import { generateLevel } from "../lib/levelGenerator";

type b2WorldIdInstance = InstanceType<typeof b2WorldId>;
type MappedSprite = Phaser.GameObjects.Sprite;
type b2BodyIdInstance = InstanceType<typeof b2BodyId>;

interface ShapeUserData {
  type: string;
  [key: string]: unknown;
}

export default class GameScene extends Phaser.Scene {
  player!: Player;
  deathSensor!: DeathSensor;
  controls: Phaser.Types.Input.Keyboard.CursorKeys | null = null;
  coinCounter!: CoinCounter;
  startScreen!: GameStartScreen;
  gameOverOverlay!: GameOverOverlay;
  mobileControls!: MobileControls;
  playerStartPosition: { x: number; y: number } | null = null;
  coins!: Phaser.GameObjects.Group;

  bodyIdToSpriteMap = new Map<number, MappedSprite>();

  constructor() {
    super({ key: SCENES.GAME });
  }

  create() {
    b2CreateWorldArray();
    const worldDef = b2DefaultWorldDef();
    worldDef.gravity = new b2Vec2(0, PHYSICS.GRAVITY.y);
    worldDef.maximumLinearVelocity = 4000;

    const worldId = b2CreateWorld(worldDef);
    gameState.setWorldId(worldId);

    this.bodyIdToSpriteMap.clear();

    this.coins = this.add.group();

    const playerPos = generateLevel(this, this.coins);
    this.playerStartPosition = playerPos;

    this.player = new Player(this, playerPos.x, playerPos.y);
    console.log("GameScene: Player re-enabled", {
      x: this.player.x,
      y: this.player.y,
    });

    if (this.player.bodyId) {
      b2Body_SetGravityScale(this.player.bodyId, 0);
    }

    this.deathSensor = new DeathSensor(this);

    if (this.input.keyboard) {
      this.controls = this.input.keyboard.createCursorKeys();
    }

    this.cameras.main.setBounds(0, 0, WORLD.WIDTH, WORLD.HEIGHT);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.centerOn(playerPos.x, playerPos.y);

    this.createUI();
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

  update(_time: number, delta: number) {
    const { worldId } = gameState;
    if (!worldId) return;

    b2World_Step(worldId, delta / 1000, 60);

    UpdateWorldSprites(worldId);

    if (this.player && this.player.bodyId) {
      const playerY = this.player.y;
      const velocity = b2Body_GetLinearVelocity(this.player.bodyId);

      if (
        playerY >= 500 &&
        playerY <= 620 &&
        velocity.y < 0 &&
        velocity.y > -5
      ) {
        if (!this.player.playerState.isGrounded) {
          this.player.setGrounded(true);
        }
      }
    }

    if (gameState.isPlaying) {
      this.processPhysicsEvents(worldId);

      if (this.player && this.controls) {
        this.player.update(this.controls);
      }

      this.mobileControls.getState();
      this.coinCounter.updateCount();
    }

    if (gameState.isGameOver && this.input.activePointer.isDown) {
      this.restart();
    }
  }

  processPhysicsEvents(worldId: b2WorldIdInstance) {
    const sensorEvents = b2World_GetSensorEvents(worldId);
    for (const event of sensorEvents.beginEvents) {
      const sensorShapeId = event.sensorShapeId;
      const visitorShapeId = event.visitorShapeId;
      const sensorUserData = b2Shape_GetUserData(
        sensorShapeId
      ) as ShapeUserData;
      const visitorUserData = b2Shape_GetUserData(
        visitorShapeId
      ) as ShapeUserData;

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
        coinInstance = visitorUserData.coinInstance as Coin;
      }

      if (coinInstance && !coinInstance.isCollected) {
        coinInstance.collect();
        gameState.incrementCoins();
      }

      if (
        (sensorUserData?.type === "player" &&
          visitorUserData?.type === "deathSensor") ||
        (visitorUserData?.type === "player" &&
          sensorUserData?.type === "deathSensor")
      ) {
        this.killPlayer();
      }
    }

    const contactEvents = b2World_GetContactEvents(worldId);
    const allContactEvents = [
      ...(contactEvents.beginEvents || []),
      ...(contactEvents.hitEvents || []),
    ];

    let isPlayerTouchingPlatform = false;
    for (const event of allContactEvents) {
      const shapeIdA = event.shapeIdA;
      const shapeIdB = event.shapeIdB;
      const userDataA = b2Shape_GetUserData(shapeIdA) as ShapeUserData;
      const userDataB = b2Shape_GetUserData(shapeIdB) as ShapeUserData;
      const isSensorA = b2Shape_IsSensor(shapeIdA);
      const isSensorB = b2Shape_IsSensor(shapeIdB);

      if (!isSensorA && !isSensorB) {
        if (
          (userDataA?.type === "player" && userDataB?.type === "platform") ||
          (userDataB?.type === "player" && userDataA?.type === "platform")
        ) {
          isPlayerTouchingPlatform = true;
          break;
        }
      }
    }

    if (this.player) {
      const velocity = this.player.bodyId
        ? b2Body_GetLinearVelocity(this.player.bodyId)
        : { y: 0 };

      if (isPlayerTouchingPlatform) {
        if (velocity.y <= PHYSICS.PLAYER.JUMP_THRESHOLD) {
          if (!this.player.playerState.isGrounded) {
            this.player.setGrounded(true);
          }
        } else {
          if (this.player.playerState.isGrounded) {
            this.player.setGrounded(false);
          }
        }
      } else {
        const airborneThreshold = 0.1;
        if (
          Math.abs(velocity.y) > airborneThreshold ||
          !this.player.playerState.isGrounded
        ) {
          if (this.player.playerState.isGrounded) {
            this.player.setGrounded(false);
          }
        }
      }
    }
  }

  killPlayer() {
    if (!gameState.isPlaying || gameState.isGameOver) return;

    console.log("Executing killPlayer...");
    this.player?.kill();
    gameState.endGame();
    this.gameOverOverlay.show();
  }

  startGame() {
    if (gameState.isReady) {
      if (this.player && this.player.bodyId) {
        b2Body_SetGravityScale(this.player.bodyId, 1);
        console.log("Enabled gravity for player body");
      }

      const success = gameState.startGame();
      this.startScreen.hide();
      this.gameOverOverlay.hide();
    }
  }

  restart() {
    console.log("Restarting game scene...");
    gameState.restartGame();

    this.bodyIdToSpriteMap.clear();
    this.coins.clear(true, true);

    if (this.player && this.player.bodyId) {
      try {
        b2DestroyBody(this.player.bodyId);
        this.player.bodyId = null;
      } catch (e) {
        console.error("Error destroying old player body on restart:", e);
      }
    }

    if (this.player) {
      this.player.destroy();
    }

    const playerPos = generateLevel(this, this.coins);
    this.playerStartPosition = playerPos;

    this.player = new Player(this, playerPos.x, playerPos.y);
    if (this.player.bodyId) {
      b2Body_SetGravityScale(this.player.bodyId, 0);
      this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    } else {
      console.error("Failed to create player body on restart!");
    }

    this.deathSensor?.reset();

    this.gameOverOverlay.hide();
    this.startScreen.show();
    this.coinCounter.updateCount();

    if (this.playerStartPosition) {
      this.cameras.main.centerOn(
        this.playerStartPosition.x,
        this.playerStartPosition.y
      );
    }

    console.log("Game scene restart complete.");
  }
}
