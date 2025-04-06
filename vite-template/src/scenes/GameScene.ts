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
  CreateWorld,
  b2BodyId,
  b2DestroyBody,
  b2World_Step,
  UpdateWorldSprites,
  ClearWorldSprites,
  b2World_GetSensorEvents,
  b2Shape_GetUserData,
  b2World_GetContactEvents,
  b2Shape_IsSensor,
  b2Body_GetLinearVelocity,
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
    const world = CreateWorld({
      x: 0,
      y: PHYSICS.GRAVITY.y / PHYSICS.SCALE, // Scale gravity to meters/s^2
    });
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

  update(_time: number, delta: number) {
    // --- REMOVE Body Destruction from here ---
    // if (this.bodiesToDestroy.length > 0) { ... }

    if (gameState.isPlaying) {
      const { worldId } = gameState; // Destructure worldId
      if (!worldId) return; // Guard clause if worldId is null

      const timeStep = delta / 1000;
      const subStepCount = 3; // Example sub-step count

      // 1. Step the physics world
      b2World_Step(worldId, timeStep, subStepCount);

      // 2. Process Events (Sensors & Contacts)
      // --- Process Sensor Events ---
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
          // Queue destruction via event emitter (already in place)
        }
      }
      // TODO: Add end sensor logic if needed

      // --- Process Contact Events ---
      const contactEvents = b2World_GetContactEvents(worldId);

      // Log contact events count for debugging
      if (
        contactEvents.beginEvents.length > 0 ||
        contactEvents.endEvents.length > 0
      ) {
        console.log(
          `Contact Event Counts - Begin: ${contactEvents.beginEvents.length}, End: ${contactEvents.endEvents.length}`
        );
      }

      // Process all types of contact events
      // Note: PhaserBox2D might not support preSolve/postSolve in the same
      // way as Box2D directly, but we can look for hits

      // Check for hit events (continuous contacts)
      if (contactEvents.hitEvents && contactEvents.hitEvents.length > 0) {
        for (const event of contactEvents.hitEvents) {
          const shapeIdA = event.shapeIdA;
          const shapeIdB = event.shapeIdB;
          const userDataA = b2Shape_GetUserData(shapeIdA);
          const userDataB = b2Shape_GetUserData(shapeIdB);

          // Handle player-platform hit contacts (non-sensor only)
          const isSensorA = b2Shape_IsSensor(shapeIdA);
          const isSensorB = b2Shape_IsSensor(shapeIdB);
          if (!isSensorA && !isSensorB) {
            if (
              (userDataA?.type === "player" &&
                userDataB?.type === "platform") ||
              (userDataB?.type === "player" && userDataA?.type === "platform")
            ) {
              // Player is currently hitting/resting on a platform
              this.player.setGrounded(true);
            }
          }
        }
      }

      for (const event of contactEvents.beginEvents) {
        const shapeIdA = event.shapeIdA;
        const shapeIdB = event.shapeIdB;

        // Ignore contacts if either shape is a sensor for physical collision checks
        const isSensorA = b2Shape_IsSensor(shapeIdA);
        const isSensorB = b2Shape_IsSensor(shapeIdB);

        const userDataA = b2Shape_GetUserData(shapeIdA);
        const userDataB = b2Shape_GetUserData(shapeIdB);

        // --- Player-Platform Physical Collision Check (Ignore Sensors) ---
        if (!isSensorA && !isSensorB) {
          if (userDataA?.type === "player" && userDataB?.type === "platform") {
            // Set player as grounded when contact begins
            this.player.setGrounded(true);
          } else if (
            userDataB?.type === "player" &&
            userDataA?.type === "platform"
          ) {
            // Set player as grounded when contact begins
            this.player.setGrounded(true);
          }
        }

        // --- Player-DeathSensor Collision Check (Use Sensors) ---
        if (
          (userDataA?.type === "player" &&
            userDataB?.type === "deathSensor" &&
            isSensorB) ||
          (userDataB?.type === "player" &&
            userDataA?.type === "deathSensor" &&
            isSensorA)
        ) {
          console.log("SENSOR CONTACT: Player and DeathSensor");
          this.killPlayer(); // Call killPlayer method
        }

        // Add other collision checks here (e.g., player-enemy)
      }

      // Also check end contact events to handle leaving a platform
      for (const event of contactEvents.endEvents) {
        const shapeIdA = event.shapeIdA;
        const shapeIdB = event.shapeIdB;

        // We only care about non-sensor contacts here
        const isSensorA = b2Shape_IsSensor(shapeIdA);
        const isSensorB = b2Shape_IsSensor(shapeIdB);

        if (isSensorA || isSensorB) continue;

        const userDataA = b2Shape_GetUserData(shapeIdA);
        const userDataB = b2Shape_GetUserData(shapeIdB);

        if (
          (userDataA?.type === "player" && userDataB?.type === "platform") ||
          (userDataB?.type === "player" && userDataA?.type === "platform")
        ) {
          // Player has left the platform, set grounded to false
          // Check velocity: only set to false if moving upwards or horizontally,
          // otherwise, hit/begin contacts should keep it true.
          const velocity = b2Body_GetLinearVelocity(this.player.bodyId);
          if (velocity.y < 0) {
            // Moving upwards (or very slightly)
            this.player.setGrounded(false);
          }
          // If velocity.y >= 0, we might still be on the platform or sliding off,
          // rely on begin/hit events to maintain grounded status.
          // A small delay or further checks might be needed if edge cases appear.
        }
      }

      // 3. Update Player/Game Logic
      if (this.player && this.controls) {
        this.player.update(this.controls);
      }
      this.mobileControls.getState();
      this.coinCounter.updateCount();

      // 4. Update Sprites to match new physics state
      UpdateWorldSprites(worldId);

      // 5. Destroy bodies queued for removal (Moved Here)
      if (this.bodiesToDestroy.length > 0) {
        for (const bodyId of this.bodiesToDestroy) {
          // Check for null before destroying
          if (bodyId) {
            try {
              // We might need b2World_IsValid if available and reliable
              b2DestroyBody(bodyId);
            } catch (e) {
              // Use JSON.stringify for potentially complex bodyId object
              console.warn(
                `Error destroying body ${JSON.stringify(bodyId)}:`,
                e
              );
            }
          }
        }
        this.bodiesToDestroy.length = 0; // Clear the array
      }
    } // End if (gameState.isPlaying)

    // Handle potential restart input outside the isPlaying block
    if (gameState.isGameOver) {
      // Check for restart condition (e.g., click/tap)
      if (this.input.activePointer.isDown) {
        this.restart();
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
