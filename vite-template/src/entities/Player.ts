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
  b2Rot,
  pxmVec2,
  b2Body_GetLinearVelocity,
  b2Body_SetLinearVelocity,
  b2Body_ApplyLinearImpulseToCenter,
  b2Body_SetTransform,
  b2Body_GetPosition,
  b2Body_GetRotation,
  b2Body_GetMass,
  mpx,
  b2Rot_GetAngle,
  b2BodyId,
  b2DestroyBody,
} from "@PhaserBox2D";

// Define a simple interface for b2Vec2 instances
interface IB2Vec2 {
  x: number;
  y: number;
}

interface PlayerState {
  isDead: boolean;
}

export default class Player extends Phaser.GameObjects.Sprite {
  scene: Phaser.Scene;

  bodyId: typeof b2BodyId | null = null;
  playerState: PlayerState;
  jumpForce: number;

  constructor(scene: Phaser.Scene) {
    super(scene, 100, 450, ASSETS.PLAYER.IDLE.KEY);
    this.scene = scene;
    this.playerState = { isDead: false };
    this.jumpForce = PHYSICS.PLAYER.JUMP_FORCE;
    this.scene.add.existing(this);
    this.initialize();
  }

  initialize() {
    this.initPhysics();
    this.play(ASSETS.PLAYER.IDLE.KEY);
  }

  destroyPhysics() {
    if (this.bodyId) {
      console.log(
        `Player.destroyPhysics: Destroying body ${JSON.stringify(
          this.bodyId
        )} in world ${JSON.stringify(gameState.worldId)}`
      );
      b2DestroyBody(this.bodyId);
      this.bodyId = null;
    }
  }

  reset() {
    this.destroyPhysics();
    this.initPhysics();

    if (!this.bodyId) {
      console.error("Player.reset: Failed to recreate physics body!");
      return;
    }
    const pos = pxmVec2(
      PHYSICS.PLAYER.START_POSITION.x,
      PHYSICS.PLAYER.START_POSITION.y
    );
    b2Body_SetTransform(this.bodyId, pos, new b2Rot(1, 0));
    b2Body_SetLinearVelocity(this.bodyId, new b2Vec2(0, 0));

    this.playerState = { isDead: false };
    this.setActive(true);
    this.setVisible(true);
    this.play(ASSETS.PLAYER.IDLE.KEY);
  }

  initPhysics() {
    const bodyDef = {
      ...b2DefaultBodyDef(),
      type: DYNAMIC,
      position: pxmVec2(this.x, this.y),
      fixedRotation: true,
    };

    const result = SpriteToBox(gameState.worldId, this, {
      bodyDef,
      density: PHYSICS.PLAYER.DENSITY,
      friction: PHYSICS.PLAYER.FRICTION,
      restitution: PHYSICS.PLAYER.RESTITUTION,
      userData: { type: "player" },
      enableContactEvents: true,
    });

    this.bodyId = result.bodyId;

    if (this.bodyId) {
      const correctInitialPos = pxmVec2(this.x, this.y);
      const initialRot = new b2Rot(1, 0);
      b2Body_SetTransform(this.bodyId, correctInitialPos, initialRot);
      b2Body_SetLinearVelocity(this.bodyId, new b2Vec2(0, 0));

      const initialMass = b2Body_GetMass(this.bodyId);
      console.log(`Player Initial Mass: ${initialMass}`);

      console.log(
        `Player.initPhysics: Adding sprite to world with worldId: ${JSON.stringify(
          gameState.worldId
        )} and bodyId: ${JSON.stringify(this.bodyId)}`
      );
      AddSpriteToWorld(gameState.worldId, this, { bodyId: this.bodyId });
    } else {
      console.error("Failed to create player physics body!");
    }

    console.log("Player initialized");
  }

  update(controls: Phaser.Types.Input.Keyboard.CursorKeys) {
    if (!this.bodyId || gameState.isGameOver) return;

    const currentVelocity = b2Body_GetLinearVelocity(this.bodyId);
    const bodyMass = b2Body_GetMass(this.bodyId);
    let targetVelX = 0;

    if (controls.left?.isDown) {
      targetVelX = -PHYSICS.PLAYER.SPEED / PHYSICS.SCALE;
    } else if (controls.right?.isDown) {
      targetVelX = PHYSICS.PLAYER.SPEED / PHYSICS.SCALE;
    }

    const deltaVx = targetVelX - currentVelocity.x;
    const impulseX = bodyMass * deltaVx;

    b2Body_ApplyLinearImpulseToCenter(
      this.bodyId,
      new b2Vec2(impulseX, 0),
      true
    );

    const currentVel = b2Body_GetLinearVelocity(this.bodyId);
    if (!controls.left?.isDown && !controls.right?.isDown) {
      const stopThreshold = 0.1;
      if (Math.abs(currentVel.x) < stopThreshold) {
        b2Body_SetLinearVelocity(this.bodyId, new b2Vec2(0, currentVel.y));
      }
    }

    const currentAnimKey = this.anims.currentAnim?.key;
    const canJump =
      Math.abs(currentVelocity.y) < PHYSICS.PLAYER.JUMP_THRESHOLD * 0.1;

    if (
      controls.up?.isDown &&
      canJump &&
      currentAnimKey !== ASSETS.PLAYER.JUMP.KEY &&
      currentAnimKey !== ASSETS.PLAYER.FALL.KEY
    ) {
      const impulseMagnitude = this.jumpForce / PHYSICS.SCALE;
      const impulseVec = new b2Vec2(0, impulseMagnitude);
      b2Body_ApplyLinearImpulseToCenter(this.bodyId, impulseVec, true);

      this.play(ASSETS.PLAYER.JUMP.KEY);
      this.once(
        Phaser.Animations.Events.ANIMATION_COMPLETE_KEY +
          ASSETS.PLAYER.JUMP.KEY,
        () => {
          if (!this.playerState.isDead) {
            this.play(ASSETS.PLAYER.FALL.KEY, true);
          }
        }
      );
    }

    const moveXForAnim = targetVelX * PHYSICS.SCALE;
    const latestVelocity = b2Body_GetLinearVelocity(this.bodyId);
    this.updateAnimations(moveXForAnim, latestVelocity);
  }

  updateAnimations(moveX: number, velocity: IB2Vec2) {
    if (!this.bodyId) return;
    if (this.playerState.isDead) return;

    const currentAnimKey = this.anims.currentAnim?.key;
    const currentVelY = velocity.y;

    if (currentVelY > PHYSICS.PLAYER.JUMP_THRESHOLD / PHYSICS.SCALE) {
      if (
        currentAnimKey !== ASSETS.PLAYER.FALL.KEY &&
        currentAnimKey !== ASSETS.PLAYER.JUMP.KEY
      ) {
        this.play(ASSETS.PLAYER.FALL.KEY, true);
      }
    } else if (
      Math.abs(currentVelY) <= PHYSICS.PLAYER.JUMP_THRESHOLD / PHYSICS.SCALE &&
      currentAnimKey !== ASSETS.PLAYER.JUMP.KEY
    ) {
      if (Math.abs(moveX) > PHYSICS.PLAYER.MOVE_THRESHOLD) {
        if (currentAnimKey !== ASSETS.PLAYER.RUN.KEY) {
          this.play(ASSETS.PLAYER.RUN.KEY, true);
        }
      } else {
        if (currentAnimKey !== ASSETS.PLAYER.IDLE.KEY) {
          this.play(ASSETS.PLAYER.IDLE.KEY, true);
        }
      }
    }

    if (moveX > PHYSICS.PLAYER.MOVE_THRESHOLD) {
      this.setFlipX(false);
    } else if (moveX < -PHYSICS.PLAYER.MOVE_THRESHOLD) {
      this.setFlipX(true);
    }
  }

  kill() {
    console.log("killing player");
    if (!this.playerState.isDead) {
      this.playerState.isDead = true;
      this.play(ASSETS.PLAYER.DEAD.KEY);

      this.destroyPhysics();

      this.scene.time.delayedCall(1000, () => {
        gameState.transition(GameStates.GAME_OVER);
        this.setActive(false);
        this.setVisible(false);
      });
    }
  }
}
