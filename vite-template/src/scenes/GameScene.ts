/**
 * @file GameScene.ts
 * @description The main scene where the gameplay takes place.
 * It initializes the Box2D physics world, creates the player, level elements (platforms, etc.),
 * UI components (coin counter, overlays, mobile controls), handles input, manages game state,
 * and runs the game loop (physics updates, player updates).
 */
import constants from "constants";
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

export default class GameScene extends Phaser.Scene {
  player!: Player;
  deathSensor!: DeathSensor;
  controls: Phaser.Types.Input.Keyboard.CursorKeys | null = null;
  coinCounter!: CoinCounter;
  startScreen!: GameStartScreen;
  gameOverOverlay!: GameOverOverlay;
  mobileControls!: MobileControls;
  playerStartPosition: { x: number; y: number } | null = null;

  // Queue for delayed body destruction
  bodiesToDestroy: (typeof b2BodyId)[] = [];

  constructor() {
    super({ key: SCENES.GAME });
  }

  create() {
    // Initialize physics world first
    b2CreateWorldArray();
    const worldDef = b2DefaultWorldDef();
    // Box2D expects gravity in meters/second^2, so we scale it
    // In Box2D, negative Y means downward
    worldDef.gravity = new b2Vec2(0, PHYSICS.GRAVITY.y);

    const worldId = b2CreateWorld(worldDef);
    gameState.setWorldId(worldId);

    // Create level before player and get player start position
    const playerPos = generateLevel(this);

    // Log the player position for debugging
    console.log("Player spawn position from level generator:", playerPos);

    // Store the position for future reference (resets, etc.)
    this.playerStartPosition = playerPos;

    // Create player at the position determined by the level generator
    this.player = new Player(this, playerPos.x, playerPos.y);

    console.log("GameScene: Player created", {
      visible: this.player.visible,
      active: this.player.active,
      x: this.player.x,
      y: this.player.y,
      texture: this.player.texture.key,
      frame: this.player.frame.name,
      inDisplayList: this.player.displayList !== null,
    });

    // Disable gravity for the player initially
    if (this.player.bodyId) {
      b2Body_SetGravityScale(this.player.bodyId, 0);
    }

    // Create death sensor after player
    this.deathSensor = new DeathSensor(this);

    // Set up input
    if (this.input.keyboard) {
      this.controls = this.input.keyboard.createCursorKeys();
    }

    // Set up camera
    this.cameras.main.setBounds(0, 0, WORLD.WIDTH, WORLD.HEIGHT);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    // Reset camera to initial position
    this.cameras.main.centerOn(playerPos.x, playerPos.y);

    // Create UI elements
    this.createUI();
    this.setupInput();
    this.startScreen.show();

    // Set up event listeners
    this.events.on("queueBodyDestruction", (bodyId: typeof b2BodyId) => {
      if (bodyId) {
        this.bodiesToDestroy.push(bodyId);
      }
    });

    // Double check player is in display list
    if (!this.player.displayList) {
      console.warn("Player not in display list after creation, re-adding...");
      this.add.existing(this.player);
    }

    // Log camera position
    console.log("Camera position:", {
      scrollX: this.cameras.main.scrollX,
      scrollY: this.cameras.main.scrollY,
      midPoint: {
        x: this.cameras.main.midPoint.x,
        y: this.cameras.main.midPoint.y,
      },
      worldView: this.cameras.main.worldView,
      playerVisible: this.player.visible,
      playerPosition: { x: this.player.x, y: this.player.y },
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

  update(_time: number, delta: number) {
    // Process physics regardless of game state to maintain world stability
    const { worldId } = gameState;
    if (!worldId) return;

    const timeStep = 1 / 60; // Fixed timestep for stability
    const subStepCount = 8;

    // Step the physics world
    b2World_Step(worldId, timeStep, subStepCount);

    // Update sprites to match physics state
    UpdateWorldSprites(worldId);

    // Only process game logic if playing
    if (gameState.isPlaying) {
      // Process physics events
      this.processPhysicsEvents(worldId);

      // Update player if controls exist
      if (this.player && this.controls) {
        this.player.update(this.controls);
      }

      // Update mobile controls and UI
      this.mobileControls.getState();
      this.coinCounter.updateCount();

      // Process body destruction queue
      if (this.bodiesToDestroy.length > 0) {
        for (const bodyId of this.bodiesToDestroy) {
          if (bodyId) {
            try {
              b2DestroyBody(bodyId);
            } catch (e) {
              console.warn(
                `Error destroying body ${JSON.stringify(bodyId)}:`,
                e
              );
            }
          }
        }
        this.bodiesToDestroy.length = 0;
      }
    } else if (gameState.isReady && this.player && this.player.bodyId) {
      // If in READY state, ensure player stays in position by resetting velocity
      b2Body_SetLinearVelocity(this.player.bodyId, new b2Vec2(0, 0));
    }

    // Handle potential restart input outside the isPlaying block
    if (gameState.isGameOver && this.input.activePointer.isDown) {
      this.restart();
    }
  }

  processPhysicsEvents(worldId: b2WorldIdInstance) {
    // Process sensor events
    const sensorEvents = b2World_GetSensorEvents(worldId);
    for (const event of sensorEvents.beginEvents) {
      const sensorShapeId = event.sensorShapeId;
      const visitorShapeId = event.visitorShapeId;
      const sensorUserData = b2Shape_GetUserData(sensorShapeId);
      const visitorUserData = b2Shape_GetUserData(visitorShapeId);

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
    }

    // Process contact events
    const contactEvents = b2World_GetContactEvents(worldId);

    // Log overall contact counts for debugging
    if (contactEvents) {
      const hitCount = contactEvents.hitEvents?.length || 0;
      const beginCount = contactEvents.beginEvents?.length || 0;
      const endCount = contactEvents.endEvents?.length || 0;

      // Only log if there are actually events to report
      if (hitCount > 0 || beginCount > 0 || endCount > 0) {
        console.log(
          `Contact events: hit=${hitCount}, begin=${beginCount}, end=${endCount}`
        );
      }
    }

    // Process hit events (immediate collision impacts)
    if (contactEvents.hitEvents && contactEvents.hitEvents.length > 0) {
      for (const event of contactEvents.hitEvents) {
        const shapeIdA = event.shapeIdA;
        const shapeIdB = event.shapeIdB;
        const userDataA = b2Shape_GetUserData(shapeIdA);
        const userDataB = b2Shape_GetUserData(shapeIdB);

        const isSensorA = b2Shape_IsSensor(shapeIdA);
        const isSensorB = b2Shape_IsSensor(shapeIdB);

        // Log all hit events for debugging
        console.log(
          `Hit event: typeA=${userDataA?.type}, typeB=${userDataB?.type}, isSensorA=${isSensorA}, isSensorB=${isSensorB}`
        );

        // Only process non-sensor collisions (solid collisions)
        if (!isSensorA && !isSensorB) {
          // Check for player-platform collision
          if (
            (userDataA?.type === "player" && userDataB?.type === "platform") ||
            (userDataB?.type === "player" && userDataA?.type === "platform")
          ) {
            // Hit events are good indicators of actual collisions
            console.log("Player hit platform - grounded");

            // Check velocity - if moving down, player is landing on platform
            const velocity = b2Body_GetLinearVelocity(this.player.bodyId);
            if (velocity.y <= 0) {
              // Moving down or stationary in Box2D coords
              this.player.setGrounded(true);
              console.log(
                `Setting player grounded=true on hit, velocity.y=${velocity.y}`
              );
            }
          }
        }
      }
    }

    // Process begin contact events
    for (const event of contactEvents.beginEvents) {
      const shapeIdA = event.shapeIdA;
      const shapeIdB = event.shapeIdB;
      const isSensorA = b2Shape_IsSensor(shapeIdA);
      const isSensorB = b2Shape_IsSensor(shapeIdB);
      const userDataA = b2Shape_GetUserData(shapeIdA);
      const userDataB = b2Shape_GetUserData(shapeIdB);

      // Only process non-sensor collisions for platform interactions
      if (!isSensorA && !isSensorB) {
        if (
          (userDataA?.type === "player" && userDataB?.type === "platform") ||
          (userDataB?.type === "player" && userDataA?.type === "platform")
        ) {
          // Begin contact is the start of any collision
          const velocity = b2Body_GetLinearVelocity(this.player.bodyId);
          console.log(
            "Player began contact with platform, velocity:",
            velocity
          );

          // Set grounded true if the player's y velocity is near zero or negative
          // (moving down in Box2D coordinates, as positive y is up)
          if (velocity.y <= 0.1) {
            this.player.setGrounded(true);
            console.log("Player is now grounded");
          }
        }
      }

      // Process death sensor contacts
      if (
        (userDataA?.type === "player" &&
          userDataB?.type === "deathSensor" &&
          isSensorB) ||
        (userDataB?.type === "player" &&
          userDataA?.type === "deathSensor" &&
          isSensorA)
      ) {
        this.killPlayer();
      }
    }

    // Process end contact events
    for (const event of contactEvents.endEvents) {
      const shapeIdA = event.shapeIdA;
      const shapeIdB = event.shapeIdB;
      const isSensorA = b2Shape_IsSensor(shapeIdA);
      const isSensorB = b2Shape_IsSensor(shapeIdB);

      // Skip sensor contacts for platform collision handling
      if (isSensorA || isSensorB) continue;

      const userDataA = b2Shape_GetUserData(shapeIdA);
      const userDataB = b2Shape_GetUserData(shapeIdB);

      // Check if player is leaving platform contact
      if (
        (userDataA?.type === "player" && userDataB?.type === "platform") ||
        (userDataB?.type === "player" && userDataA?.type === "platform")
      ) {
        const velocity = b2Body_GetLinearVelocity(this.player.bodyId);

        // Only set not grounded if we're actually leaving the platform
        // We're not leaving if we're moving upward (velocity.y > 0 in Box2D)
        if (velocity.y <= 0) {
          this.player.setGrounded(false);
          console.log(
            "Player ended contact with platform - not grounded, velocity:",
            velocity
          );
        }
      }
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
      // Enable gravity for the player when the game starts
      if (this.player && this.player.bodyId) {
        b2Body_SetGravityScale(this.player.bodyId, 1);
        console.log("Enabled gravity for player body");

        // Log player position and velocity at game start
        const velocity = b2Body_GetLinearVelocity(this.player.bodyId);
        console.log("Player at game start:", {
          position: { x: this.player.x, y: this.player.y },
          box2dPosition: {
            x: this.player.x / PHYSICS.SCALE,
            y: -this.player.y / PHYSICS.SCALE,
          },
          velocity: { x: velocity.x, y: velocity.y },
        });
      }

      // Give physics a moment to initialize
      this.time.delayedCall(100, () => {
        const success = gameState.startGame();
        console.log("GameScene.startGame: Game started", {
          success,
          isPlaying: gameState.isPlaying,
          playerVisible: this.player?.visible,
          playerActive: this.player?.active,
        });
      });
    }
  }

  restart() {
    if (gameState.isGameOver) {
      gameState.reset();

      // If we have stored the start position, use it for reset
      if (this.playerStartPosition) {
        // Reset the player to the initial spawn position
        this.player.x = this.playerStartPosition.x;
        this.player.y = this.playerStartPosition.y;
      }

      this.player?.reset();
      this.deathSensor?.reset();

      // Disable gravity when resetting to READY state
      if (this.player && this.player.bodyId) {
        b2Body_SetGravityScale(this.player.bodyId, 0);
      }

      gameState.transition(GameStates.READY);
      this.startGame();
    }
  }
}
