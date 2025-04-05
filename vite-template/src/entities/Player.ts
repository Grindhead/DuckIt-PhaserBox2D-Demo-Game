import * as Phaser from "phaser";
import {
  AddSpriteToWorld,
  SpriteToBox,
  DYNAMIC,
  b2DefaultBodyDef,
  b2Vec2,
  pxmVec2,
  b2Body_GetLinearVelocity,
  b2Body_SetLinearVelocity,
  b2Body_SetTransform,
} from "../lib/PhaserBox2D.js";
import { PHYSICS, ASSETS } from "../lib/constants.js";
import { gameState, GameStates } from "../lib/gameState.js";

export default class Player extends Phaser.GameObjects.Sprite {
  constructor(scene) {
    super(
      scene,
      PHYSICS.PLAYER.START_POSITION.x,
      PHYSICS.PLAYER.START_POSITION.y,
      ASSETS.ATLAS,
      ASSETS.PLAYER.IDLE.FRAME
    );

    this.scene = scene;
    this.initialize();
  }

  initialize() {
    // Add sprite to scene
    this.scene.add.existing(this);

    // Initialize physics body
    this.initPhysics();

    // Start idle animation
    this.play(ASSETS.PLAYER.IDLE.KEY);

    // Track player state
    this.state = {
      isJumping: false,
      isFalling: false,
      isDead: false,
      facingRight: true,
    };

    // Movement properties
    this.speed = PHYSICS.PLAYER.SPEED;
    this.jumpForce = PHYSICS.PLAYER.JUMP_FORCE;
  }

  reset() {
    // Reset position
    const startPos = pxmVec2(
      PHYSICS.PLAYER.START_POSITION.x,
      PHYSICS.PLAYER.START_POSITION.y
    );
    b2Body_SetTransform(gameState.worldId, this.bodyId, startPos, 0);
    b2Body_SetLinearVelocity(gameState.worldId, this.bodyId, new b2Vec2(0, 0));

    // Reset state
    this.state = {
      isJumping: false,
      isFalling: false,
      isDead: false,
      facingRight: true,
    };

    // Reset appearance
    this.setFlipX(false);
    this.play(ASSETS.PLAYER.IDLE.KEY);
  }

  initPhysics() {
    // Create physics body for player
    const bodyDef = {
      ...b2DefaultBodyDef(),
      type: DYNAMIC,
      fixedRotation: true,
      linearDamping: PHYSICS.PLAYER.LINEAR_DAMPING,
      position: pxmVec2(
        PHYSICS.PLAYER.START_POSITION.x,
        PHYSICS.PLAYER.START_POSITION.y
      ),
    };

    // Create the Box2D body and store its ID
    const { bodyId } = SpriteToBox(gameState.worldId, this, {
      bodyDef,
      density: PHYSICS.PLAYER.DENSITY,
      friction: PHYSICS.PLAYER.FRICTION,
      restitution: PHYSICS.PLAYER.RESTITUTION,
      userData: { type: "player" },
    });

    // Store the body ID for later use
    this.bodyId = bodyId;

    // Add sprite to world with the body ID
    AddSpriteToWorld(gameState.worldId, this, bodyId);
  }

  update(controls) {
    if (this.state.isDead || !gameState.isPlaying) return;

    const velocity = b2Body_GetLinearVelocity(gameState.worldId, this.bodyId);

    // Handle movement
    let moveX = 0;

    // Handle horizontal movement
    if (controls.left) {
      moveX = -this.speed;
      if (this.state.facingRight) {
        this.setFlipX(true);
        this.state.facingRight = false;
      }
    } else if (controls.right) {
      moveX = this.speed;
      if (!this.state.facingRight) {
        this.setFlipX(false);
        this.state.facingRight = true;
      }
    }

    // Apply horizontal movement
    b2Body_SetLinearVelocity(
      gameState.worldId,
      this.bodyId,
      new b2Vec2(moveX / PHYSICS.SCALE, velocity.y)
    );

    // Handle jumping
    if (controls.up && !this.state.isJumping) {
      b2Body_SetLinearVelocity(
        gameState.worldId,
        this.bodyId,
        new b2Vec2(velocity.x, this.jumpForce / PHYSICS.SCALE)
      );
      this.state.isJumping = true;
      this.play(ASSETS.PLAYER.JUMP.KEY);
    }

    // Update animations based on state
    this.updateAnimations(moveX, velocity);
  }

  updateAnimations(moveX, velocity) {
    if (this.state.isJumping) {
      if (velocity.y > 0) {
        this.state.isJumping = false;
        this.state.isFalling = true;
        this.play(ASSETS.PLAYER.FALL.KEY);
      }
    } else if (this.state.isFalling) {
      if (Math.abs(velocity.y) < 0.1) {
        this.state.isFalling = false;
        if (moveX === 0) {
          this.play(ASSETS.PLAYER.IDLE.KEY);
        } else {
          this.play(ASSETS.PLAYER.RUN.KEY);
        }
      }
    } else {
      if (moveX === 0 && !this.anims.currentAnim?.key.includes("idle")) {
        this.play(ASSETS.PLAYER.IDLE.KEY);
      } else if (moveX !== 0 && !this.anims.currentAnim?.key.includes("run")) {
        this.play(ASSETS.PLAYER.RUN.KEY);
      }
    }
  }

  kill() {
    if (this.state.isDead) return;

    this.state.isDead = true;
    this.play(ASSETS.PLAYER.DEAD.KEY);
  }
}
