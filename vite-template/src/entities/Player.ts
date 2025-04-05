/**
 * @file Player.ts
 * @description Represents the player character (duck) in the game.
 * Handles player sprite creation, physics integration (using Box2D via PhaserBox2D),
 * movement control (left, right, jump) based on input, state management (idle, run, jump, fall, dead),
 * animation playback corresponding to the state, and reset functionality.
 */
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
} from "@PhaserBox2D";
import { PHYSICS, ASSETS } from "@constants";
import { gameState } from "@gameState";

interface PlayerState {
  isJumping: boolean;
  isFalling: boolean;
  isDead: boolean;
  facingRight: boolean;
}

export default class Player extends Phaser.GameObjects.Sprite {
  scene: Phaser.Scene;
  bodyId: any | null = null;
  playerState: PlayerState;
  speed!: number;
  jumpForce!: number;

  constructor(scene: Phaser.Scene) {
    super(
      scene,
      PHYSICS.PLAYER.START_POSITION.x,
      PHYSICS.PLAYER.START_POSITION.y,
      ASSETS.ATLAS,
      ASSETS.PLAYER.IDLE.FRAME
    );

    this.scene = scene;
    this.playerState = {
      isJumping: false,
      isFalling: false,
      isDead: false,
      facingRight: true,
    };
    this.initialize();
  }

  initialize() {
    this.scene.add.existing(this);

    this.initPhysics();

    this.play(ASSETS.PLAYER.IDLE.KEY);

    this.speed = PHYSICS.PLAYER.SPEED;
    this.jumpForce = PHYSICS.PLAYER.JUMP_FORCE;
  }

  reset() {
    if (!this.bodyId) return;
    const startPos = pxmVec2(
      PHYSICS.PLAYER.START_POSITION.x,
      PHYSICS.PLAYER.START_POSITION.y
    );
    b2Body_SetTransform(this.bodyId, startPos);
    b2Body_SetLinearVelocity(this.bodyId, new b2Vec2(0, 0));

    this.playerState = {
      isJumping: false,
      isFalling: false,
      isDead: false,
      facingRight: true,
    };

    this.setFlipX(false);
    this.play(ASSETS.PLAYER.IDLE.KEY);
  }

  initPhysics() {
    const bodyDef = {
      ...b2DefaultBodyDef(),
      type: DYNAMIC,
      fixedRotation: true,
      linearDamping: PHYSICS.PLAYER.LINEAR_DAMPING,
      position: pxmVec2(
        PHYSICS.PLAYER.START_POSITION.x,
        PHYSICS.PLAYER.START_POSITION.y
      ),
      updateBodyMass: true,
    };

    const result = SpriteToBox(gameState.worldId as any, this, {
      bodyDef,
      density: PHYSICS.PLAYER.DENSITY,
      friction: PHYSICS.PLAYER.FRICTION,
      restitution: PHYSICS.PLAYER.RESTITUTION,
      userData: { type: "player" },
    });

    this.bodyId = result.bodyId;

    if (this.bodyId) {
      AddSpriteToWorld(gameState.worldId as any, this, this.bodyId);
    }
  }

  update(controls: Phaser.Types.Input.Keyboard.CursorKeys) {
    if (!this.bodyId || this.playerState.isDead || !gameState.isPlaying) return;

    const velocity = b2Body_GetLinearVelocity(this.bodyId);

    let moveX = 0;

    if (controls.left?.isDown) {
      moveX = -this.speed;
      if (this.playerState.facingRight) {
        this.setFlipX(true);
        this.playerState.facingRight = false;
      }
    } else if (controls.right?.isDown) {
      moveX = this.speed;
      if (!this.playerState.facingRight) {
        this.setFlipX(false);
        this.playerState.facingRight = true;
      }
    }

    b2Body_SetLinearVelocity(
      this.bodyId,
      new b2Vec2(moveX / PHYSICS.SCALE, velocity.y)
    );

    if (controls.up?.isDown && !this.playerState.isJumping) {
      b2Body_SetLinearVelocity(
        this.bodyId,
        new b2Vec2(velocity.x, this.jumpForce / PHYSICS.SCALE)
      );
      this.playerState.isJumping = true;
      this.play(ASSETS.PLAYER.JUMP.KEY);
    }

    this.updateAnimations(moveX, velocity);
  }

  updateAnimations(moveX: number, velocity: any) {
    if (!this.bodyId) return;

    if (this.playerState.isJumping) {
      if (velocity.y > 0) {
        this.playerState.isJumping = false;
        this.playerState.isFalling = true;
        this.play(ASSETS.PLAYER.FALL.KEY);
      }
    } else if (this.playerState.isFalling) {
      if (Math.abs(velocity.y) < 0.1) {
        this.playerState.isFalling = false;
        if (moveX === 0) {
          this.play(ASSETS.PLAYER.IDLE.KEY);
        } else {
          this.play(ASSETS.PLAYER.RUN.KEY);
        }
      }
    } else {
      if (
        moveX === 0 &&
        this.anims.currentAnim?.key !== ASSETS.PLAYER.IDLE.KEY
      ) {
        this.play(ASSETS.PLAYER.IDLE.KEY);
      } else if (
        moveX !== 0 &&
        this.anims.currentAnim?.key !== ASSETS.PLAYER.RUN.KEY
      ) {
        this.play(ASSETS.PLAYER.RUN.KEY);
      }
    }
  }

  kill() {
    if (this.playerState.isDead) return;

    this.playerState.isDead = true;
    this.play(ASSETS.PLAYER.DEAD.KEY);
    if (this.bodyId) {
      b2Body_SetLinearVelocity(this.bodyId, new b2Vec2(0, 0));
    }
  }
}
