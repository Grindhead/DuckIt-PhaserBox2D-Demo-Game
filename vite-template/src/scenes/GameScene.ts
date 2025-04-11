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
import Crate from "@entities/Crate";
import DeathSensor from "@entities/DeathSensor";
import Enemy from "@entities/Enemy";
import Player from "@entities/Player";
import { gameState } from "@gameState";
import {
  b2Body_GetLinearVelocity,
  b2CreateWorld,
  b2CreateWorldArray,
  b2DefaultWorldDef,
  b2Shape_GetUserData,
  b2Shape_IsSensor,
  b2Vec2,
  b2World_GetContactEvents,
  b2World_GetSensorEvents,
  b2World_Step,
  UpdateWorldSprites,
  b2WorldId,
  b2Body_SetGravityScale,
  b2Body_ApplyLinearImpulseToCenter,
} from "@PhaserBox2D";
import CoinCounter from "@ui/CoinCounter";
import GameOverOverlay from "@ui/GameOverOverlay";
import GameStartScreen from "@ui/GameStartScreen";
import MobileControls from "@ui/MobileControls";

import {
  generateLevel,
  GeneratedLevelData,
} from "../lib/levelGenerator/levelGenerator";

type b2WorldIdInstance = InstanceType<typeof b2WorldId>;
type MappedSprite = Phaser.GameObjects.Sprite | Crate | Enemy;

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
  coins!: Phaser.GameObjects.Group;
  enemies: Enemy[] = [];

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
    this.enemies = [];

    const levelData: GeneratedLevelData = generateLevel(this, this.coins);
    this.enemies = levelData.enemies;

    this.player = new Player(
      this,
      levelData.playerSpawnPosition.x,
      levelData.playerSpawnPosition.y
    );

    // Initial setup of player after creation
    this.setupPlayerState();

    this.deathSensor = new DeathSensor(this);

    if (this.input.keyboard) {
      this.controls = this.input.keyboard.createCursorKeys();
    }

    this.cameras.main.setBounds(0, 0, WORLD.WIDTH, WORLD.HEIGHT);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.centerOn(
      levelData.playerSpawnPosition.x,
      levelData.playerSpawnPosition.y
    );

    this.createUI();
    this.setupInput();
    this.startScreen.show();
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

  update(_time: number, delta: number) {
    const { worldId } = gameState;
    if (!worldId) return;

    b2World_Step(worldId, delta / 1000, 60);

    UpdateWorldSprites(worldId);

    if (gameState.isPlaying) {
      this.processPhysicsEvents(worldId);

      if (this.player && this.controls) {
        this.player.update(this.controls);

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

    // --- Destroy old game elements --- //
    // Destroy existing enemies before regenerating level
    this.enemies.forEach((enemy) => enemy.destroy());
    this.enemies = [];

    // Destroy existing coins (might be simpler than resetting state)
    this.coins.clear(true, true); // Destroy children and remove from group

    // Clear the sprite map to remove stale references (except player)
    this.bodyIdToSpriteMap.forEach((sprite, bodyIndex) => {
      if (sprite !== this.player) {
        this.bodyIdToSpriteMap.delete(bodyIndex);
      }
    });

    // --- Regenerate Level Elements --- //
    // Note: We are NOT destroying/recreating the Box2D world itself
    const levelData = generateLevel(this, this.coins); // Regenerate platforms, coins, enemies
    this.enemies = levelData.enemies; // Store new enemies

    // --- Reset Player --- //
    if (this.player) {
      // Reset player state and position using the new spawn point
      this.player.startPosition.set(
        levelData.playerSpawnPosition.x,
        levelData.playerSpawnPosition.y
      );
      this.player.reset();

      // Update camera position
      this.cameras.main.centerOn(this.player.x, this.player.y);
    }

    // --- Reset Game State & UI --- //
    gameState.restartGame(); // Reset game state to READY
    this.gameOverOverlay.hide();
    this.startScreen.show(); // Show start screen to initiate playing again
    this.coinCounter.updateCount(); // Reflects the reset coin count (0)

    console.log("Game logic restart complete.");
  }
}
