/**
 * @file Player.ts
 * @description Represents the player character in the game with physics-based movement.
 * Handles player sprite creation, animations, physics integration (using Box2D via PhaserBox2D),
 * and movement control in response to user input.
 */
import * as Phaser from "phaser";

import { ASSETS, PHYSICS, ANIMATION } from "@constants";
import { gameState } from "@gameState";
import {
  AddSpriteToWorld,
  b2Body_ApplyLinearImpulseToCenter,
  b2Body_GetLinearVelocity,
  b2Body_GetMass,
  b2Body_SetAwake,
  b2Body_SetGravityScale,
  b2Body_SetLinearVelocity,
  b2BodyId,
  b2CreateBody,
  b2CreatePolygonShape,
  b2DefaultBodyDef,
  b2DefaultShapeDef,
  b2DestroyBody,
  b2MakeBox,
  b2Vec2,
  DYNAMIC,
} from "@PhaserBox2D";
import GameScene from "@scenes/GameScene";

import { createPhysicsBody } from "../lib/physics/PhysicsBodyFactory";

/**
 * Player state interface definition
 */
interface PlayerState {
  /** Whether the player is dead */
  isDead: boolean;
  /** Whether the player is on the ground */
  isGrounded: boolean;
  /** Flag to track if physics warning has been logged */
  hasLoggedPhysicsWarning: boolean;
}

/**
 * Player class representing the duck character
 * Handles physics, animations, and controls
 */
export default class Player extends Phaser.GameObjects.Sprite {
  scene: Phaser.Scene;
  bodyId: InstanceType<typeof b2BodyId> | null = null; // Corrected type to InstanceType
  playerState: PlayerState;
  startPosition: Phaser.Math.Vector2;
  /* A flag to indicate if a jump input was handled already */
  wasJumpHandled = false;

  /**
   * Creates an instance of the Player.
   *
   * @param scene - The scene to add the player to
   * @param x - Initial x position
   * @param y - Initial y position
   */
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, ASSETS.ATLAS, ASSETS.PLAYER.IDLE.FRAME);

    this.scene = scene;
    this.startPosition = new Phaser.Math.Vector2(x, y);

    // Initialize state
    this.playerState = {
      isDead: false,
      isGrounded: false,
      hasLoggedPhysicsWarning: false,
    };

    // Add player to the scene display list
    scene.add.existing(this);

    // Set depth (render order)
    this.setDepth(10);

    // Start with idle animation
    this.play(ASSETS.PLAYER.IDLE.KEY);

    // Initialize physics immediately with a direct call (not on next tick)
    this.initPhysics();

    // Add a one-time check to verify physics setup in the next frame
    this.scene.time.delayedCall(100, this.verifyPhysicsSetup, [], this);

    console.log("Player created at position:", { x: this.x, y: this.y });
  }

  destroyPhysics() {
    if (this.bodyId) {
      b2DestroyBody(this.bodyId);
      this.bodyId = null;
    }
  }

  /**
   * Resets the player to initial position and state.
   * This is called during both initial spawn and when respawning after death.
   */
  reset() {
    console.log("Starting player reset at position:", this.startPosition);

    // Set sprite position first
    this.x = this.startPosition.x;
    this.y = this.startPosition.y - 50; // Increased from 30 to 50 for more clearance

    // Completely recreate physics body to ensure all properties are properly reset
    this.destroyPhysics();
    this.initPhysics();

    // Reset internal state
    this.playerState = {
      isDead: false,
      isGrounded: false, // Start as not grounded, let physics determine this in the next update
      hasLoggedPhysicsWarning: false,
    };

    // Reset animation
    this.anims.stop();
    this.play(ASSETS.PLAYER.IDLE.KEY);

    // Set the player to be visible again
    this.setVisible(true);
    this.setActive(true);
    this.alpha = 1;

    console.log("Player reset complete:", {
      position: { x: this.x, y: this.y },
      isPlaying: gameState.isPlaying,
      bodyId: this.bodyId ? "valid" : "null",
    });
  }

  /**
   * Verifies the physics setup is complete and logs any issues
   */
  verifyPhysicsSetup() {
    if (!this.bodyId || !gameState.worldId) {
      console.warn("Player physics not fully initialized after 100ms");

      // Try to initialize physics again if it failed
      if (!this.bodyId) {
        console.log("Retry physics initialization...");
        this.initPhysics();

        // Schedule another verification
        this.scene.time.delayedCall(200, this.verifyPhysicsSetup, [], this);
      }
    } else {
      console.log("Player physics verified as properly initialized");
    }
  }

  initPhysics() {
    // Skip if the body is already initialized
    if (this.bodyId) {
      console.log("Physics body already exists, skipping initialization");
      return;
    }

    // We'll use a retry approach with a maximum of 3 attempts
    const maxRetries = 3;
    let currentRetry = 0;
    const retryInterval = 100; // 100ms between retries

    const attemptCreateBody = () => {
      // Check if the world is ready
      if (!gameState.worldId) {
        console.warn(
          "Cannot create player physics body: gameState.worldId is null"
        );

        // Try again in a short while if world is not ready yet
        if (currentRetry < maxRetries) {
          currentRetry++;
          setTimeout(attemptCreateBody, retryInterval);
        } else {
          console.error("Max retries reached waiting for world ID");
        }
        return;
      }

      // Clean up any existing physics body
      if (this.bodyId) {
        console.log("Cleaning up existing physics body");
        if (this.scene instanceof GameScene) {
          (this.scene as GameScene).bodyIdToSpriteMap.delete(
            this.bodyId.index1
          );
        }
        b2DestroyBody(this.bodyId);
        this.bodyId = null;
      }

      // Log current position before creating physics body
      console.log("Player.initPhysics: Current position before physics", {
        x: this.x,
        y: this.y,
        startPosition: this.startPosition,
        retryAttempt: currentRetry,
      });

      // Create the physics body using the PhysicsBodyFactory
      // 'duck' is the name of the body in physics.xml
      this.bodyId = createPhysicsBody("duck", this.x, this.y, true);

      if (!this.bodyId) {
        console.warn(
          `Failed to create player physics body (attempt ${
            currentRetry + 1
          }/${maxRetries})`
        );

        // If we've reached max retries, use fallback
        if (currentRetry >= maxRetries) {
          console.error("Max retries reached. Using fallback physics body.");
          this.createFallbackPhysicsBody();
          if (!this.bodyId) {
            console.error(
              "Critical failure: Could not create fallback physics body!"
            );
            return; // Complete failure
          }
        } else {
          // Try again after a short delay
          currentRetry++;
          setTimeout(attemptCreateBody, retryInterval);
          return;
        }
      }

      // Continue with the rest of the initialization
      this.finishPhysicsInit();
    };

    // Start the first attempt
    attemptCreateBody();
  }

  /**
   * Finishes physics initialization after successfully creating the body
   * This is separated from initPhysics to allow for retry logic
   */
  finishPhysicsInit() {
    if (!this.bodyId) {
      console.error("Cannot finish physics initialization: No body ID");
      return;
    }

    // Set gravity scale based on current game state
    const gravityScale = gameState.isPlaying ? 1.0 : 0.0;
    b2Body_SetGravityScale(this.bodyId, gravityScale);
    console.log(
      `Set initial gravity scale to ${gravityScale} (isPlaying: ${gameState.isPlaying})`
    );

    // Add the sprite to the physics world for updates
    AddSpriteToWorld(gameState.worldId, this, { bodyId: this.bodyId });

    // Register this player's bodyId and sprite instance in the GameScene map
    if (this.bodyId && this.scene instanceof GameScene) {
      (this.scene as GameScene).bodyIdToSpriteMap.set(this.bodyId.index1, this);
      console.log(
        "Player registered in bodyIdToSpriteMap with index:",
        this.bodyId.index1
      );
    }

    // Explicitly wake up the body to ensure it's active for immediate collision detection
    if (this.bodyId) {
      b2Body_SetAwake(this.bodyId, true);

      // Zero velocity on initialization
      b2Body_SetLinearVelocity(this.bodyId, new b2Vec2(0, 0));
    }

    console.log("Player physics body created and initialization complete");
  }

  /**
   * Creates a fallback physics body if the XML data isn't available
   * Uses the default values from before for compatibility
   */
  createFallbackPhysicsBody() {
    const bodyDef = {
      ...b2DefaultBodyDef(),
      type: DYNAMIC,
      position: new b2Vec2(this.x / PHYSICS.SCALE, -this.y / PHYSICS.SCALE),
      fixedRotation: true,
      enableContactListener: true,
      allowSleep: false,
      bullet: true,
      linearDamping: 0.5,
    };

    this.bodyId = b2CreateBody(gameState.worldId, bodyDef);

    if (!this.bodyId) {
      console.error("Failed to create fallback player physics body!");
      return;
    }

    const shapeDef = {
      ...b2DefaultShapeDef(),
      density: 1.0,
      friction: 0.6,
      restitution: 0.0,
      userData: { type: "player" },
      isSensor: false,
      enableContactEvents: true,
    };

    // Create a box with dimensions scaled to match the sprite
    const halfWidth = (this.width * 0.6) / 2 / PHYSICS.SCALE;
    const halfHeight = (this.height * 0.8) / 2 / PHYSICS.SCALE;
    const box = b2MakeBox(halfWidth, halfHeight);

    b2CreatePolygonShape(this.bodyId, shapeDef, box);
    console.log("Created fallback player physics body");
  }

  /**
   * Set the grounded state of the player
   * @param grounded - Whether the player is on ground
   */
  setGrounded(grounded: boolean) {
    // Don't update if the state is the same
    if (this.playerState.isGrounded === grounded) return;

    // Set the internal state
    this.playerState.isGrounded = grounded;

    // Immediately handle animation transitions when grounding state changes
    if (grounded && this.bodyId) {
      const currentVelocity = b2Body_GetLinearVelocity(this.bodyId);
      const currentAnimKey = this.anims.currentAnim?.key;

      // If we were in FALL animation, explicitly stop it and switch to idle/run
      if (currentAnimKey === ASSETS.PLAYER.FALL.KEY) {
        this.anims.stop();

        if (
          Math.abs(currentVelocity.x) >
          PHYSICS.PLAYER.MOVE_THRESHOLD / PHYSICS.SCALE
        ) {
          this.play(ASSETS.PLAYER.RUN.KEY);
        } else {
          this.play(ASSETS.PLAYER.IDLE.KEY);
        }

        console.log(
          "Animation transition in setGrounded: FALL → " +
            (Math.abs(currentVelocity.x) >
            PHYSICS.PLAYER.MOVE_THRESHOLD / PHYSICS.SCALE
              ? "RUN"
              : "IDLE")
        );
      }
    }

    // Log for debugging
    console.log(`Player.setGrounded: ${grounded}`);
  }

  /**
   * Apply jump impulse if player is grounded
   * @returns true if jump successful, false otherwise
   */
  jump(): boolean {
    // Only jump if we have a physics body and are grounded
    if (!this.bodyId || !this.playerState.isGrounded) {
      console.log("Jump failed - not grounded or no body");
      return false;
    }

    // Get current velocity
    const velocity = b2Body_GetLinearVelocity(this.bodyId);

    // Only jump if we're not already moving upward significantly
    if (velocity.y < PHYSICS.PLAYER.JUMP_THRESHOLD) {
      // Apply jump impulse - slightly stronger to ensure good platform clearance
      const jumpImpulse = new b2Vec2(0, PHYSICS.PLAYER.JUMP_FORCE * 1.3);
      b2Body_ApplyLinearImpulseToCenter(this.bodyId, jumpImpulse, true);

      // Set grounded to false since we're jumping
      this.playerState.isGrounded = false;

      // Play jump animation
      this.play(ASSETS.PLAYER.JUMP.KEY);

      // --- Add Event Listener for Jump Completion --- Start
      this.once(
        `${Phaser.Animations.Events.ANIMATION_COMPLETE_KEY}${ASSETS.PLAYER.JUMP.KEY}`,
        () => {
          // When jump animation finishes, transition to fall if still airborne
          if (!this.playerState.isGrounded) {
            this.play(ASSETS.PLAYER.FALL.KEY);
            console.log("Jump anim complete, transitioned to FALL");
          }
        }
      );
      // --- Add Event Listener for Jump Completion --- End

      console.log(
        "Player jumped with impulse:",
        PHYSICS.PLAYER.JUMP_FORCE * 1.3
      );
      return true;
    }

    return false;
  }

  /**
   * Kill the player (called when hitting enemies or death sensor)
   */
  kill() {
    console.log("killing player");
    if (!this.playerState.isDead) {
      this.playerState.isDead = true;

      // Stop any ongoing animations and play death animation
      this.anims.stop();
      this.play(ASSETS.PLAYER.DEAD.KEY);

      b2Body_SetAwake(this.bodyId, false);
      b2Body_SetGravityScale(this.bodyId, 0);

      // If the physics body exists, disable movement by setting velocity to zero
      if (this.bodyId) {
        b2Body_SetLinearVelocity(this.bodyId, new b2Vec2(0, 0));
      }

      // Log for debugging
      console.log("Player death state set:", {
        position: { x: this.x, y: this.y },
        hasPhysics: !!this.bodyId,
      });

      // Call the GameScene's killPlayer method to show game over overlay
      // Use a short delay to allow death animation to play first
      this.scene.time.delayedCall(500, () => {
        if (this.scene instanceof GameScene) {
          (this.scene as GameScene).killPlayer();
        }
      });
    }
  }

  update(controls: Phaser.Types.Input.Keyboard.CursorKeys) {
    // Check if physics bodies are available
    const hasPhysics = this.bodyId !== null && gameState.worldId !== null;

    if (!hasPhysics) {
      // Show warning only once
      if (!this.playerState.hasLoggedPhysicsWarning) {
        console.warn("Player update called without physics body or worldId");
        this.playerState.hasLoggedPhysicsWarning = true;
      }

      // Even without physics, we can still update animations
      if (!this.playerState.isDead) {
        if (controls.left?.isDown || controls.right?.isDown) {
          // Show running animation
          if (this.anims.currentAnim?.key !== ASSETS.PLAYER.RUN.KEY) {
            this.play(ASSETS.PLAYER.RUN.KEY);
          }
          // Flip sprite based on direction
          this.setFlipX(controls.left?.isDown);
        } else {
          // Show idle animation
          if (this.anims.currentAnim?.key !== ASSETS.PLAYER.IDLE.KEY) {
            this.play(ASSETS.PLAYER.IDLE.KEY);
          }
        }
      }

      return;
    }

    // Normal physics-based update below

    // Prevent any movement or updates if the player is dead
    if (this.playerState.isDead) {
      // Ensure velocity is zero when dead
      b2Body_SetLinearVelocity(this.bodyId, new b2Vec2(0, 0));
      return;
    }

    const currentVelocity = b2Body_GetLinearVelocity(this.bodyId);
    const bodyMass = b2Body_GetMass(this.bodyId);

    let targetVelX = 0;

    if (controls.left?.isDown) {
      // Convert from pixels/second to meters/second for Box2D
      targetVelX = -PHYSICS.PLAYER.SPEED / PHYSICS.SCALE;
      this.setFlipX(true);
    } else if (controls.right?.isDown) {
      // Convert from pixels/second to meters/second for Box2D
      targetVelX = PHYSICS.PLAYER.SPEED / PHYSICS.SCALE;
      this.setFlipX(false);
    }

    const deltaVx = targetVelX - currentVelocity.x;
    const impulseX = bodyMass * deltaVx;

    b2Body_ApplyLinearImpulseToCenter(
      this.bodyId,
      new b2Vec2(impulseX, 0),
      true
    );

    const canJump = this.playerState.isGrounded;

    // Handle jump input
    if (canJump && controls.up?.isDown) {
      this.jump();
    }

    // --- Animation State Logic --- //
    const currentAnimKey = this.anims.currentAnim?.key;

    // Check if DEAD
    if (this.playerState.isDead) {
      if (currentAnimKey !== ASSETS.PLAYER.DEAD.KEY) {
        this.play(ASSETS.PLAYER.DEAD.KEY);
      }
      // Stop horizontal movement when dead
      b2Body_SetLinearVelocity(this.bodyId, new b2Vec2(0, currentVelocity.y));
      return; // No further updates if dead
    }

    // Check if GROUNDED
    if (this.playerState.isGrounded) {
      // If we were FALLING, transition to IDLE or RUN now
      if (currentAnimKey === ASSETS.PLAYER.FALL.KEY) {
        console.log("Landed from Fall, checking Idle/Run");

        // Force animation to complete - this can help with animation transitions
        // that might be getting stuck
        this.anims.stop();

        if (
          Math.abs(currentVelocity.x) >
          PHYSICS.PLAYER.MOVE_THRESHOLD / PHYSICS.SCALE
        ) {
          this.play(ASSETS.PLAYER.RUN.KEY);
          console.log("Landed into RUN");
        } else {
          this.play(ASSETS.PLAYER.IDLE.KEY);
          console.log("Landed into IDLE");
        }
      }
      // If already grounded (IDLE/RUN), continue normal ground logic
      else {
        if (
          Math.abs(currentVelocity.x) >
          PHYSICS.PLAYER.MOVE_THRESHOLD / PHYSICS.SCALE
        ) {
          // Running
          if (currentAnimKey !== ASSETS.PLAYER.RUN.KEY) {
            this.play(ASSETS.PLAYER.RUN.KEY);
            console.log("Grounded state changed to RUN");
          }
        } else {
          // Idle
          if (currentAnimKey !== ASSETS.PLAYER.IDLE.KEY) {
            this.play(ASSETS.PLAYER.IDLE.KEY);
            console.log("Grounded state changed to IDLE");
          }
        }
      }
    }
    // Check if AIRBORNE
    else {
      // If airborne, play FALL animation unless JUMP is currently playing
      // (JUMP completion event will handle transition to FALL)
      if (
        currentAnimKey !== ASSETS.PLAYER.FALL.KEY &&
        currentAnimKey !== ASSETS.PLAYER.JUMP.KEY
      ) {
        this.play(ASSETS.PLAYER.FALL.KEY);
        console.log("Airborne state initiated FALL");
      }

      // If we're in JUMP animation and moving downward, switch to FALL
      if (currentAnimKey === ASSETS.PLAYER.JUMP.KEY && currentVelocity.y < 0) {
        this.play(ASSETS.PLAYER.FALL.KEY);
        console.log("Jump peaked, switching to FALL");
      }
    }

    // Flip sprite based on horizontal movement direction
    if (targetVelX > 0) {
      this.setFlipX(false);
    } else if (targetVelX < 0) {
      this.setFlipX(true);
    }
  }
}
