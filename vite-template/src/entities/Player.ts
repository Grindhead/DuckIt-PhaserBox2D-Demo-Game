/**
 * @file Player.ts
 * @description Represents the player character (duck) in the game.
 * Handles player sprite creation, physics integration (using Box2D via PhaserBox2D),
 * movement control (left, right, jump) based on input, state management (idle, run, jump, fall, dead),
 * animation playback corresponding to the state, and reset functionality.
 */
import * as Phaser from "phaser";

import { ASSETS, PHYSICS } from "@constants";
import { gameState, GameStates } from "@gameState";
// Runtime values only
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
// Remove type import

interface PlayerState {
  isJumping: boolean;
  isDead: boolean;
}

export default class Player extends Phaser.GameObjects.Sprite {
  scene: Phaser.Scene;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bodyId: any | null = null; // Revert to any
  playerState: PlayerState;
  jumpForce: number;

  constructor(scene: Phaser.Scene) {
    super(scene, 100, 450, ASSETS.PLAYER.IDLE.KEY);
    this.scene = scene;
    this.playerState = { isJumping: false, isDead: false };
    this.jumpForce = PHYSICS.PLAYER.JUMP_FORCE;
    this.initialize();
  }

  initialize() {
    this.initPhysics();
    this.play(ASSETS.PLAYER.IDLE.KEY);
  }

  reset() {
    if (!this.bodyId) return;
    const pos = pxmVec2(
      PHYSICS.PLAYER.START_POSITION.x,
      PHYSICS.PLAYER.START_POSITION.y
    );
    b2Body_SetTransform(this.bodyId, pos);
    b2Body_SetLinearVelocity(this.bodyId, new b2Vec2(0, 0));
    this.playerState = { isJumping: false, isDead: false };
    this.setActive(true);
    this.setVisible(true);
    this.play(ASSETS.PLAYER.IDLE.KEY);
  }

  initPhysics() {
    const bodyDef = {
      ...b2DefaultBodyDef(),
      type: DYNAMIC,
      position: pxmVec2(this.x, this.y),
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = SpriteToBox(gameState.worldId as any, this, {
      // Revert to any
      bodyDef,
      density: PHYSICS.PLAYER.DENSITY,
      friction: PHYSICS.PLAYER.FRICTION,
      restitution: PHYSICS.PLAYER.RESTITUTION,
      userData: { type: "player" },
    });

    this.bodyId = result.bodyId;

    if (this.bodyId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      AddSpriteToWorld(gameState.worldId as any, this, this.bodyId); // Revert to any
    }
  }

  update(controls: Phaser.Types.Input.Keyboard.CursorKeys) {
    if (!this.bodyId || gameState.isGameOver) return;

    const velocity = b2Body_GetLinearVelocity(this.bodyId);
    let moveX = velocity.x * PHYSICS.SCALE;

    if (controls.left?.isDown) {
      moveX = -PHYSICS.PLAYER.SPEED;
    } else if (controls.right?.isDown) {
      moveX = PHYSICS.PLAYER.SPEED;
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

    this.updateAnimations(moveX, velocity); // Pass velocity (implicitly any now)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateAnimations(moveX: number, velocity: any) {
    // Revert to any
    if (!this.bodyId) return;
    if (this.playerState.isDead) return;

    if (velocity.y > PHYSICS.PLAYER.JUMP_THRESHOLD) {
      if (!this.playerState.isJumping) {
        this.play(ASSETS.PLAYER.FALL.KEY, true);
      }
    } else if (velocity.y < -PHYSICS.PLAYER.JUMP_THRESHOLD) {
      if (
        !this.anims.isPlaying ||
        this.anims.currentAnim?.key !== ASSETS.PLAYER.JUMP.KEY
      ) {
        this.play(ASSETS.PLAYER.JUMP.KEY, true);
      }
      this.playerState.isJumping = true;
    } else {
      this.playerState.isJumping = false;
      if (Math.abs(moveX) > PHYSICS.PLAYER.MOVE_THRESHOLD) {
        this.play(ASSETS.PLAYER.RUN.KEY, true);
      } else {
        this.play(ASSETS.PLAYER.IDLE.KEY, true);
      }
    }

    if (moveX > PHYSICS.PLAYER.MOVE_THRESHOLD) {
      this.setFlipX(false);
    } else if (moveX < -PHYSICS.PLAYER.MOVE_THRESHOLD) {
      this.setFlipX(true);
    }
  }

  kill() {
    if (!this.playerState.isDead) {
      this.playerState.isDead = true;
      // Use correct animation key
      this.play(ASSETS.PLAYER.DEAD.KEY);
      // Disable physics body interactions if needed, or set velocity to zero
      if (this.bodyId) {
        b2Body_SetLinearVelocity(this.bodyId, new b2Vec2(0, 0));
        // Consider setting body type to static or disabling body if appropriate
      }
      this.scene.time.delayedCall(1000, () => {
        gameState.transition(GameStates.GAME_OVER);
        this.setActive(false);
        this.setVisible(false);
      });
    }
  }
}
