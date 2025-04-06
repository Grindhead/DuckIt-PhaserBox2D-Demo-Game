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
} from "@PhaserBox2D";
// Remove type import

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

  reset() {
    if (!this.bodyId) return;
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
      // Revert to any
      bodyDef,
      density: PHYSICS.PLAYER.DENSITY,
      friction: PHYSICS.PLAYER.FRICTION,
      restitution: PHYSICS.PLAYER.RESTITUTION,
      userData: { type: "player" },
    });

    this.bodyId = result.bodyId;

    if (this.bodyId) {
      // Manually set the transform immediately after creation to override potential errors in SpriteToBox
      const correctInitialPos = pxmVec2(this.x, this.y); // Calculate correct Box2D position
      const initialRot = new b2Rot(1, 0); // Zero rotation (angle = 0)
      // Call with bodyId, position (b2Vec2), and rotation (b2Rot)
      b2Body_SetTransform(this.bodyId, correctInitialPos, initialRot);
      b2Body_SetLinearVelocity(this.bodyId, new b2Vec2(0, 0));

      // ---> Log the initial mass <--- //
      const initialMass = b2Body_GetMass(this.bodyId);
      console.log(`Player Initial Mass: ${initialMass}`);

      console.log(
        `Player.initPhysics: Adding sprite to world with worldId: ${JSON.stringify(
          gameState.worldId
        )} and bodyId: ${JSON.stringify(this.bodyId)}`
      );
      AddSpriteToWorld(gameState.worldId, this, this.bodyId);
    } else {
      console.error("Failed to create player physics body!");
    }

    console.log("Player initialized");
  }

  update(controls: Phaser.Types.Input.Keyboard.CursorKeys) {
    // ----> RE-ENABLE UPDATE LOGIC <----
    if (!this.bodyId || gameState.isGameOver) return;

    const currentVelocity = b2Body_GetLinearVelocity(this.bodyId); // Get current velocity
    const bodyMass = b2Body_GetMass(this.bodyId); // Get body mass
    let targetVelX = 0; // Target horizontal velocity in Box2D units (m/s)

    // Determine target horizontal velocity based on input
    if (controls.left?.isDown) {
      targetVelX = -PHYSICS.PLAYER.SPEED / PHYSICS.SCALE; // Convert pixel speed to m/s
    } else if (controls.right?.isDown) {
      targetVelX = PHYSICS.PLAYER.SPEED / PHYSICS.SCALE; // Convert pixel speed to m/s
    } // No 'else { targetVelX = 0; }' needed, force/impulse handles stopping

    // Calculate velocity change needed
    const deltaVx = targetVelX - currentVelocity.x;
    // Calculate impulse required
    const impulseX = bodyMass * deltaVx;

    // Apply horizontal impulse to control movement
    b2Body_ApplyLinearImpulseToCenter(
      this.bodyId,
      new b2Vec2(impulseX, 0),
      true
    );

    // Explicit stopping logic for low velocity when no input is pressed
    const currentVel = b2Body_GetLinearVelocity(this.bodyId); // Get velocity *after* impulse
    if (!controls.left?.isDown && !controls.right?.isDown) {
      const stopThreshold = 0.1; // Stop if horizontal speed is less than 0.1 m/s (3 pixels/s)
      if (Math.abs(currentVel.x) < stopThreshold) {
        b2Body_SetLinearVelocity(this.bodyId, new b2Vec2(0, currentVel.y));
      }
    }

    // Jumping logic (remains the same, using impulse)
    const currentAnimKey = this.anims.currentAnim?.key;
    const canJump =
      Math.abs(currentVelocity.y) < PHYSICS.PLAYER.JUMP_THRESHOLD * 0.1;

    if (
      controls.up?.isDown &&
      canJump && // Only jump if on ground or near-zero vertical velocity
      currentAnimKey !== ASSETS.PLAYER.JUMP.KEY &&
      currentAnimKey !== ASSETS.PLAYER.FALL.KEY
    ) {
      // Apply an upward impulse for the jump
      const impulseMagnitude = this.jumpForce / PHYSICS.SCALE; // e.g., -400 / 30 = -13.33
      const impulseVec = new b2Vec2(0, impulseMagnitude); // Use positive magnitude for upward impulse
      b2Body_ApplyLinearImpulseToCenter(this.bodyId, impulseVec, true); // true wakes the body

      // Play jump animation and transition to fall on completion
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

    // Use the target *pixel* speed for animation logic
    const moveXForAnim = targetVelX * PHYSICS.SCALE;
    // Get the potentially updated velocity after jump impulse and stopping logic for animations
    const latestVelocity = b2Body_GetLinearVelocity(this.bodyId);
    this.updateAnimations(moveXForAnim, latestVelocity);

    // ----> DISABLE MANUAL SYNC (Assuming AddSpriteToWorld handles it) <----
    /*
    // Manual sprite synchronization
    if (this.bodyId) {
      const bodyPos = b2Body_GetPosition(this.bodyId);
      const bodyRot = b2Body_GetRotation(this.bodyId);
      const bodyAngle = b2Rot_GetAngle(bodyRot);

      const newX = mpx(bodyPos.x);
      const newY = mpx(bodyPos.y);

      // Log the calculated positions
      console.log(
        `Player Sync: BodyPos=(${bodyPos.x.toFixed(2)}, ${bodyPos.y.toFixed(
          2
        )}), SpritePos=(${newX.toFixed(2)}, ${newY.toFixed(
          2
        )}), Angle=${bodyAngle.toFixed(2)}`
      );

      this.x = newX; // Convert meters to pixels and update sprite x
      this.y = newY; // Convert meters to pixels and update sprite y
      this.rotation = bodyAngle; // Update sprite rotation
    } else {
      // Log if bodyId is missing during sync attempt
      console.warn("Player Sync Attempt: bodyId is null!");
    }
    */
    // ----> END DISABLE MANUAL SYNC <----
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateAnimations(moveX: number, velocity: any) {
    if (!this.bodyId) return;
    if (this.playerState.isDead) return;

    const currentAnimKey = this.anims.currentAnim?.key;
    const currentVelY = velocity.y; // Use the passed velocity directly

    // Animation logic based on velocity
    if (currentVelY > PHYSICS.PLAYER.JUMP_THRESHOLD / PHYSICS.SCALE) {
      // Compare Box2D velocity
      // Falling
      if (
        currentAnimKey !== ASSETS.PLAYER.FALL.KEY &&
        currentAnimKey !== ASSETS.PLAYER.JUMP.KEY
      ) {
        this.play(ASSETS.PLAYER.FALL.KEY, true);
      }
    } else if (
      Math.abs(currentVelY) <= PHYSICS.PLAYER.JUMP_THRESHOLD / PHYSICS.SCALE && // Compare Box2D velocity
      currentAnimKey !== ASSETS.PLAYER.JUMP.KEY // Don't interrupt jump animation
    ) {
      // Not moving vertically significantly (on ground?)
      if (Math.abs(moveX) > PHYSICS.PLAYER.MOVE_THRESHOLD) {
        // Compare pixel speed
        // Play run only if not already running
        if (currentAnimKey !== ASSETS.PLAYER.RUN.KEY) {
          this.play(ASSETS.PLAYER.RUN.KEY, true);
        }
      } else {
        // Play idle only if not already idle
        if (currentAnimKey !== ASSETS.PLAYER.IDLE.KEY) {
          this.play(ASSETS.PLAYER.IDLE.KEY, true);
        }
      }
    }

    // Flip sprite based on horizontal movement (using pixel speed `moveX`)
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
