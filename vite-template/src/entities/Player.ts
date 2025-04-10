/**
 * @file Player.ts
 * @description Represents the player character (duck) in the game.
 * Handles player sprite creation, physics integration (using Box2D via PhaserBox2D),
 * movement control (left, right, jump) based on input, state management (idle, run, jump, fall, dead),
 * animation playback corresponding to the state, and reset functionality.
 */
import * as Phaser from "phaser";

import { ASSETS, PHYSICS, ANIMATION } from "@constants";
import { gameState } from "@gameState";
// Runtime values only
import {
  AddSpriteToWorld,
  DYNAMIC,
  b2DefaultBodyDef,
  b2Vec2,
  b2Body_GetLinearVelocity,
  b2Body_SetLinearVelocity,
  b2Body_ApplyLinearImpulseToCenter,
  b2Body_GetMass,
  b2DestroyBody,
  b2CreateBody,
  b2DefaultShapeDef,
  b2MakeBox,
  b2CreatePolygonShape,
  b2Body_SetGravityScale,
  b2BodyId,
  b2Body_SetAwake,
} from "@PhaserBox2D";
// Add import for GameScene
import GameScene from "@scenes/GameScene";

// Player state interface
interface PlayerState {
  isDead: boolean;
  isGrounded: boolean;
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
    };

    // Add player to the scene display list
    scene.add.existing(this);

    // Set depth (render order)
    this.setDepth(10);

    // Create physics body
    this.initPhysics();

    // Create animations if needed
    if (!this.scene.anims.exists(ASSETS.PLAYER.IDLE.KEY)) {
      this.createAnimations();
    }

    // Start with idle animation
    this.play(ASSETS.PLAYER.IDLE.KEY);
  }

  /**
   * Create all player animations
   */
  createAnimations() {
    const { IDLE, RUN, JUMP, FALL, DEAD } = ASSETS.PLAYER;

    // Idle animation
    if (!this.scene.anims.exists(IDLE.KEY)) {
      this.scene.anims.create({
        key: IDLE.KEY,
        frames: this.scene.anims.generateFrameNames(ASSETS.ATLAS, {
          prefix: "player/idle/duck-idle-",
          start: 1,
          end: IDLE.FRAME_COUNT,
          zeroPad: 4,
          suffix: ".png",
        }),
        frameRate: ANIMATION.FRAME_RATE,
        repeat: 0,
      });
    }

    // Run animation
    if (!this.scene.anims.exists(RUN.KEY)) {
      this.scene.anims.create({
        key: RUN.KEY,
        frames: this.scene.anims.generateFrameNames(ASSETS.ATLAS, {
          prefix: RUN.FRAME_PREFIX,
          start: 1,
          end: RUN.FRAME_COUNT,
          zeroPad: 4,
          suffix: ".png",
        }),
        frameRate: ANIMATION.FRAME_RATE,
        repeat: -1,
      });
    }

    // Jump animation
    if (!this.scene.anims.exists(JUMP.KEY)) {
      this.scene.anims.create({
        key: JUMP.KEY,
        frames: this.scene.anims.generateFrameNames(ASSETS.ATLAS, {
          prefix: JUMP.FRAME_PREFIX,
          start: 1,
          end: JUMP.FRAME_COUNT,
          zeroPad: 4,
          suffix: ".png",
        }),
        frameRate: ANIMATION.FRAME_RATE,
        repeat: 0,
      });
    }

    // Fall animation
    if (!this.scene.anims.exists(FALL.KEY)) {
      this.scene.anims.create({
        key: FALL.KEY,
        frames: this.scene.anims.generateFrameNames(ASSETS.ATLAS, {
          prefix: FALL.FRAME_PREFIX,
          start: 1,
          end: FALL.FRAME_COUNT,
          zeroPad: 4,
          suffix: ".png",
        }),
        frameRate: ANIMATION.FRAME_RATE,
        repeat: -1,
      });
    }

    // Dead animation
    if (!this.scene.anims.exists(DEAD.KEY)) {
      this.scene.anims.create({
        key: DEAD.KEY,
        frames: this.scene.anims.generateFrameNames(ASSETS.ATLAS, {
          prefix: DEAD.FRAME_PREFIX,
          start: 1,
          end: DEAD.FRAME_COUNT,
          zeroPad: 4,
          suffix: ".png",
        }),
        frameRate: ANIMATION.FRAME_RATE,
        repeat: 0,
      });
    }
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

  initPhysics() {
    // Remove any existing physics body first
    if (this.bodyId) {
      // Unregister from the map first
      if (this.scene instanceof GameScene) {
        (this.scene as GameScene).bodyIdToSpriteMap.delete(this.bodyId.index1);
      }
      b2DestroyBody(this.bodyId);
      this.bodyId = null;
    }

    // Log current position before creating physics body
    console.log("Player.initPhysics: Current position before physics", {
      x: this.x,
      y: this.y,
      startPosition: this.startPosition,
    });

    const bodyDef = {
      ...b2DefaultBodyDef(),
      type: DYNAMIC,
      // Convert from pixels to Box2D coordinates (meters)
      position: new b2Vec2(this.x / PHYSICS.SCALE, -this.y / PHYSICS.SCALE),
      fixedRotation: true, // Don't allow rotation
      enableContactListener: true, // Make sure contact events are enabled
      allowSleep: false, // Prevent the body from sleeping
      bullet: true, // Enable continuous collision detection for accurate collisions
      linearDamping: 0.5, // Increased damping for better platform landing
    };

    const bodyId = b2CreateBody(gameState.worldId, bodyDef);
    this.bodyId = bodyId;

    if (!bodyId) {
      console.error("Failed to create player physics body!");
      return;
    }

    // Set gravity scale based on current game state
    const gravityScale = gameState.isPlaying ? 1.0 : 0.0;
    b2Body_SetGravityScale(bodyId, gravityScale);
    console.log(
      `Set initial gravity scale to ${gravityScale} (isPlaying: ${gameState.isPlaying})`
    );

    // Create a box shape with scaled dimensions
    // Box2D uses half-width/height in meters
    const halfWidth = (this.width * 0.6) / 2 / PHYSICS.SCALE; // Slightly smaller than sprite width
    const halfHeight = (this.height * 0.8) / 2 / PHYSICS.SCALE; // Slightly smaller than sprite height

    // Create the shape definition
    const shapeDef = {
      ...b2DefaultShapeDef(),
      density: 1.0, // Normal density
      friction: 0.6, // Increased friction to prevent sliding off platforms
      restitution: 0.0, // No bounce
      userData: { type: "player" }, // Important for collision identification
      isSensor: false, // Explicitly ensure it's not a sensor
      enableContactEvents: true, // Enable contact events for the player
    };

    // Create and attach the box shape to the body
    const box = b2MakeBox(halfWidth, halfHeight);
    b2CreatePolygonShape(bodyId, shapeDef, box);

    // Add the sprite to the physics world for updates
    AddSpriteToWorld(gameState.worldId, this, { bodyId });

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

    // Log shape creation
    console.log("Player physics body and shape created:", {
      bodyId,
      width: this.width * 0.6, // Actual collision width being used
      height: this.height * 0.8, // Actual collision height being used
      halfWidth,
      halfHeight,
      scale: PHYSICS.SCALE,
      density: shapeDef.density,
      friction: shapeDef.friction,
    });
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

    // If we just landed, make sure animations reflect this immediately
    if (grounded && this.bodyId) {
      const currentVelocity = b2Body_GetLinearVelocity(this.bodyId);
      const isMoving =
        Math.abs(currentVelocity.x) >
        PHYSICS.PLAYER.MOVE_THRESHOLD / PHYSICS.SCALE;

      // Set appropriate animation when landing
      if (isMoving) {
        this.play(ASSETS.PLAYER.RUN.KEY);
      } else {
        this.play(ASSETS.PLAYER.IDLE.KEY);
      }

      // When we land, apply a small downward force to ensure stable contact
      if (this.bodyId) {
        const stabilizeImpulse = new b2Vec2(0, -0.05);
        b2Body_ApplyLinearImpulseToCenter(this.bodyId, stabilizeImpulse, true);
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
    if (!this.bodyId || !gameState.worldId) {
      console.warn("Player update called without physics body or worldId");
      return;
    }

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

    const currentAnimKey = this.anims.currentAnim?.key;
    const canJump = this.playerState.isGrounded;

    // Handle jump input
    if (canJump && controls.up?.isDown) {
      this.jump();
    }

    // Determine animation based on state and velocity
    if (this.playerState.isDead) {
      // Play death animation if not already playing
      if (currentAnimKey !== ASSETS.PLAYER.DEAD.KEY) {
        this.play(ASSETS.PLAYER.DEAD.KEY);
      }
    } else if (!this.playerState.isGrounded) {
      // We're in the air
      if (currentVelocity.y > 0) {
        // Moving upward (jumping)
        if (currentAnimKey !== ASSETS.PLAYER.JUMP.KEY) {
          this.play(ASSETS.PLAYER.JUMP.KEY);
        }
      } else {
        // Moving downward (falling)
        if (
          currentAnimKey !== ASSETS.PLAYER.FALL.KEY &&
          (!this.anims.isPlaying || currentAnimKey !== ASSETS.PLAYER.JUMP.KEY)
        ) {
          this.play(ASSETS.PLAYER.FALL.KEY);
        }
      }
    } else {
      // We're on the ground - just landed or already walking/idle
      const isMoving =
        Math.abs(currentVelocity.x) >
        PHYSICS.PLAYER.MOVE_THRESHOLD / PHYSICS.SCALE;

      // Just landed from a fall or jump
      const justLanded =
        currentAnimKey === ASSETS.PLAYER.FALL.KEY ||
        (currentAnimKey === ASSETS.PLAYER.JUMP.KEY && !this.anims.isPlaying);

      if (isMoving) {
        // Running
        if (currentAnimKey !== ASSETS.PLAYER.RUN.KEY || justLanded) {
          this.play(ASSETS.PLAYER.RUN.KEY);
        }
      } else {
        // Idle - play immediately when landing or transitioning from run
        if (
          currentAnimKey !== ASSETS.PLAYER.IDLE.KEY &&
          (justLanded || currentAnimKey === ASSETS.PLAYER.RUN.KEY)
        ) {
          this.play(ASSETS.PLAYER.IDLE.KEY);
        }
      }
    }
  }
}
