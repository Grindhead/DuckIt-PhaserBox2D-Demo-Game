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

import { generateLevel } from "../lib/levelGenerator";

type b2WorldIdInstance = InstanceType<typeof b2WorldId>;
type MappedSprite = Phaser.GameObjects.Sprite;

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
  crates!: Phaser.GameObjects.Group;

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

    // Initial setup of player after creation
    this.setupPlayerState();

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

  /**
   * Reusable method to reset and setup the player's initial state
   * Works for both initial spawn and respawn after death
   */
  setupPlayerState() {
    if (!this.player) return;
    // Set initial gravity based on game state
    if (this.player.bodyId) {
      // Disable gravity at start (will be enabled when game starts)
      b2Body_SetGravityScale(this.player.bodyId, 0);
    }

    // Move camera to player
    this.cameras.main.centerOn(this.player.x, this.player.y);
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
        // Kill the player which stops movement and plays death animation
        this.player.kill();

        // Wait a short time before respawning to allow death animation to play
        this.time.delayedCall(300, () => {
          if (this.player) {
            // First, update the startPosition to the original spawn point
            if (this.playerStartPosition) {
              this.player.startPosition.x = this.playerStartPosition.x;
              this.player.startPosition.y = this.playerStartPosition.y;
            }

            // Destroy the existing physics body
            this.player.destroyPhysics();

            // Create a new physics body
            this.player.initPhysics();

            // Reset any collected coins before resetting the player
            this.coins.children.each((coinChild) => {
              const coin = coinChild as Coin;
              if (coin.isCollected) {
                coin.reset(); // Makes coin visible and resets physics body if needed
              }
              return true; // Continue iteration
            });

            // Reset all crates to their original positions if they exist
            if (this.crates) {
              this.crates.children.each((crateChild) => {
                const crate = crateChild as Crate;
                crate.reset(); // Always reset all crates, not just active ones
                return true; // Continue iteration
              });

              // Wait another moment to ensure crates have properly reset
              this.time.delayedCall(20, () => {
                // Make sure the player is registered in the bodyIdToSpriteMap
                if (this.player && this.player.bodyId) {
                  this.bodyIdToSpriteMap.set(
                    this.player.bodyId.index1,
                    this.player
                  );

                  // Temporarily disable gravity completely during repositioning
                  b2Body_SetGravityScale(this.player.bodyId, 0);

                  // Reset player position and state
                  this.player.reset(); // Don't reset gravity from inside reset

                  // After a longer delay to ensure body position is stabilized, gradually introduce physics
                  this.time.delayedCall(50, () => {
                    if (this.player && this.player.bodyId) {
                      // First step: Apply mild gravity to start controlled descent
                      b2Body_SetGravityScale(this.player.bodyId, 0.2);

                      // Second step: After a short delay, increase gravity and ensure the player is above any platform

                      if (this.player && this.player.bodyId) {
                        // Apply full gravity
                        b2Body_SetGravityScale(this.player.bodyId, 1.0);

                        // Apply a gentle downward impulse - reduced from previous value to prevent tunneling
                        const landingImpulse = new b2Vec2(0, -0.3);
                        b2Body_ApplyLinearImpulseToCenter(
                          this.player.bodyId,
                          landingImpulse,
                          true
                        );
                      }
                    }
                  });
                }

                // Update camera position
                this.cameras.main.centerOn(this.player.x, this.player.y);
              });
            } else {
              // Make sure the player is registered in the bodyIdToSpriteMap
              if (this.player && this.player.bodyId) {
                this.bodyIdToSpriteMap.set(
                  this.player.bodyId.index1,
                  this.player
                );

                // Temporarily disable gravity completely during repositioning
                b2Body_SetGravityScale(this.player.bodyId, 0);

                // Reset player position and state
                this.player.reset(); // Don't reset gravity from inside reset

                // After a longer delay to ensure body position is stabilized, gradually introduce physics
                this.time.delayedCall(50, () => {
                  if (this.player && this.player.bodyId) {
                    // First step: Apply mild gravity to start controlled descent
                    b2Body_SetGravityScale(this.player.bodyId, 0.2);

                    // Second step: After a short delay, increase gravity and ensure the player is above any platform

                    if (this.player && this.player.bodyId) {
                      // Apply full gravity
                      b2Body_SetGravityScale(this.player.bodyId, 1.0);

                      // Apply a gentle downward impulse - reduced from previous value to prevent tunneling
                      const landingImpulse = new b2Vec2(0, -0.3);
                      b2Body_ApplyLinearImpulseToCenter(
                        this.player.bodyId,
                        landingImpulse,
                        true
                      );
                    }
                  }
                });
              }
            }

            // Update camera position
            this.cameras.main.centerOn(this.player.x, this.player.y);
          }
        });
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
      // Check for player-platform contact
      if (
        (userDataA?.type === "player" && userDataB?.type === "platform") ||
        (userDataB?.type === "player" && userDataA?.type === "platform")
      ) {
        // Determine if player is above the platform
        // For Box2D, we need to look at the contact normal
        const velocity = b2Body_GetLinearVelocity(this.player.bodyId);

        // Contact normal check - in Box2D a positive y normal means contact from above
        let isBottomContact = false;
        if (event.normal) {
          // Check if the player feet are contacting platform (y normal > 0)
          const normalY = event.normal.y;
          // More tolerant bottom contact detection
          isBottomContact = normalY > 0.1;
        }

        // If this is a new contact and player is contacting platform from bottom/feet
        if (isBeginningContact) {
          // Beginning or continuing contact with platform
          // More tolerant vertical velocity check (0.1 → 0.2)
          if (isBottomContact || Math.abs(velocity.y) < 0.2) {
            this.player.setGrounded(true);

            // Apply a small additional downward impulse to stabilize on platform
            if (this.player.bodyId) {
              const stabilizeImpulse = new b2Vec2(0, -0.1);
              b2Body_ApplyLinearImpulseToCenter(
                this.player.bodyId,
                stabilizeImpulse,
                true
              );
            }
          }
        } else {
          // Only set ungrounded if it was specifically this platform contact that ended
          // and the player was previously grounded
          if (this.player.playerState.isGrounded && isBottomContact) {
            // Check if there are any other platform contacts still active

            // Look through current begin/hit events to see if there are other platforms
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

              // Check if this is another platform contact
              if (
                !b2Shape_IsSensor(otherShapeIdA) &&
                !b2Shape_IsSensor(otherShapeIdB) &&
                ((otherUserDataA?.type === "player" &&
                  otherUserDataB?.type === "platform") ||
                  (otherUserDataB?.type === "player" &&
                    otherUserDataA?.type === "platform"))
              ) {
                break;
              }
            }
          }
        }
      }
    }
  }

  killPlayer() {
    if (!gameState.isPlaying || gameState.isGameOver) return;

    this.player?.kill();
    gameState.endGame();
    this.gameOverOverlay.show();
  }

  startGame() {
    if (gameState.isReady) {
      if (this.player && this.player.bodyId) {
        // Enable gravity when game starts (this is what makes the player start falling)
        b2Body_SetGravityScale(this.player.bodyId, 1);
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
    // Reset the game state
    gameState.reset(); // Reset everything including coins
    gameState.startGame();

    // Hide overlays
    this.gameOverOverlay.hide();

    // Reset any collected coins
    this.coins.children.each((coinChild) => {
      const coin = coinChild as Coin;
      if (coin.isCollected) {
        coin.reset();
      }
      return true; // Continue iteration
    });

    // Reset all crates to their original positions if they exist
    if (this.crates) {
      this.crates.children.each((crateChild) => {
        const crate = crateChild as Crate;
        crate.reset(); // Always reset all crates, not just active ones
        return true; // Continue iteration
      });
    }

    // Update UI
    this.startScreen.show(); // Show start screen to initiate playing again
    this.coinCounter.updateCount(); // Reflects the reset coin count (0)
  }
}
