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
  DYNAMIC,
  b2DefaultFilter,
  b2DefaultBodyDef,
  b2Vec2,
  b2Rot,
  pxmVec2,
  b2Body_GetLinearVelocity,
  b2Body_SetLinearVelocity,
  b2Body_ApplyLinearImpulseToCenter,
  b2Body_SetTransform,
  b2Body_GetMass,
  b2DestroyBody,
  b2CreateBody,
  b2DefaultShapeDef,
  b2MakeBox,
  b2CreatePolygonShape,
} from "@PhaserBox2D";

// Define a simple interface for b2Vec2 instances
interface IB2Vec2 {
  x: number;
  y: number;
}

interface PlayerState {
  isDead: boolean;
  isGrounded: boolean;
}

export default class Player extends Phaser.GameObjects.Sprite {
  scene: Phaser.Scene;

  // Change type annotation to 'any | null' for consistency and to fix linter error
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bodyId: any | null = null;
  playerState: PlayerState;
  jumpForce: number;
  startPosition: { x: number; y: number };

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, ASSETS.ATLAS, ASSETS.PLAYER.IDLE.FRAME);
    this.scene = scene;
    this.playerState = {
      isDead: false,
      isGrounded: false,
    };
    this.jumpForce = PHYSICS.PLAYER.JUMP_FORCE;
    this.startPosition = { x, y }; // Store initial position for reset

    // Set up sprite properties
    this.setOrigin(0.5, 0.5);
    this.setVisible(true);
    this.setDepth(1); // Ensure player renders above platforms

    // Add to scene's display list (MUST be done before physics setup)
    scene.add.existing(this);

    console.log("Player constructor:", {
      x: x,
      y: y,
      spriteX: this.x,
      spriteY: this.y,
      inDisplayList: this.displayList !== null,
      visible: this.visible,
      active: this.active,
      texture: this.texture.key,
      frame: this.frame.name,
      atlas: ASSETS.ATLAS,
      idleFrame: ASSETS.PLAYER.IDLE.FRAME,
    });

    this.initialize();
  }

  initialize() {
    // Ensure sprite is set up before physics
    if (!this.displayList) {
      console.warn("Player not in display list, re-adding...");
      this.scene.add.existing(this);
    }

    this.initPhysics();

    // Verify animation exists before playing
    if (this.scene.anims.exists(ASSETS.PLAYER.IDLE.KEY)) {
      this.play(ASSETS.PLAYER.IDLE.KEY);
    } else {
      console.error(`Animation ${ASSETS.PLAYER.IDLE.KEY} not found!`);
      // Set static frame as fallback
      this.setFrame(ASSETS.PLAYER.IDLE.FRAME);
    }

    console.log("Player initialization state:", {
      position: { x: this.x, y: this.y },
      visible: this.visible,
      active: this.active,
      texture: {
        key: this.texture.key,
        frame: this.frame.name,
        frameTotal: this.texture.frameTotal,
      },
      inDisplayList: this.displayList !== null,
      animations: {
        currentKey: this.anims.currentAnim?.key,
        isPlaying: this.anims.isPlaying,
        hasAnimation: this.scene.anims.exists(ASSETS.PLAYER.IDLE.KEY),
      },
    });
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
      this.startPosition.x,
      -this.startPosition.y // Negate Y for Box2D
    );
    b2Body_SetTransform(this.bodyId, pos, new b2Rot(0, 0));
    b2Body_SetLinearVelocity(this.bodyId, new b2Vec2(0, 0));

    this.playerState = {
      isDead: false,
      isGrounded: false,
    };
    this.setActive(true);
    this.setVisible(true);
    this.play(ASSETS.PLAYER.IDLE.KEY);
  }

  initPhysics() {
    // Log current position before creating physics body
    console.log("Player.initPhysics: Current position before physics", {
      x: this.x,
      y: this.y,
      startPosition: this.startPosition,
    });

    const bodyDef = {
      ...b2DefaultBodyDef(),
      type: DYNAMIC,
      // Box2D coordinate system has Y pointing up, so we need to negate Y
      position: pxmVec2(this.x, -this.y),
      fixedRotation: true,
      enableContactListener: true,
      allowSleep: false, // Prevent the body from sleeping
      bullet: true, // Enable continuous collision detection
    };

    const bodyId = b2CreateBody(gameState.worldId, bodyDef);
    this.bodyId = bodyId;

    if (!bodyId) {
      console.error("Failed to create player physics body!");
      return;
    }

    const shapeDef = {
      ...b2DefaultShapeDef(),
      density: PHYSICS.PLAYER.DENSITY,
      friction: PHYSICS.PLAYER.FRICTION,
      restitution: PHYSICS.PLAYER.RESTITUTION,
      userData: { type: "player", sprite: this },
      enableContactEvents: true,
      filter: b2DefaultFilter(),
      isSensor: false,
    };

    const scaleX = this.scaleX;
    const scaleY = this.scaleY;
    // Adjust collision box to match sprite size more accurately
    // Using full width and height for better collision detection
    const boxWidth = this.width * scaleX;
    const boxHeight = this.height * scaleY;
    console.log(`Player box size: ${boxWidth}x${boxHeight} (Box2D units)`);
    console.log(`Player sprite size: ${this.width}x${this.height} (pixels)`);

    const box = b2MakeBox(boxWidth / 2, boxHeight / 2); // Box2D uses half-widths
    b2CreatePolygonShape(bodyId, shapeDef, box);

    // Initial position with inverted Y for Box2D
    const initialPos = pxmVec2(this.x, -this.y);
    console.log(
      `Player Initial Position (Box2D Coords): x=${initialPos.x.toFixed(
        3
      )}, y=${initialPos.y.toFixed(3)}`
    );
    console.log(`Player Initial Position (Pixels): x=${this.x}, y=${this.y}`);

    const initialRot = new b2Rot(0, 0);
    b2Body_SetTransform(this.bodyId, initialPos, initialRot);
    b2Body_SetLinearVelocity(this.bodyId, new b2Vec2(0, 0));

    const initialMass = b2Body_GetMass(this.bodyId);
    console.log(`Player Initial Mass: ${initialMass}`);

    // Add sprite to physics world with a properly formatted object
    AddSpriteToWorld(gameState.worldId, this, { bodyId: this.bodyId });

    console.log("Player initialized", {
      position: { x: this.x, y: this.y },
      visible: this.visible,
      inPhysicsWorld: this.bodyId != null,
    });
  }

  update(controls: Phaser.Types.Input.Keyboard.CursorKeys) {
    if (!this.bodyId || gameState.isGameOver) return;

    const currentVelocity = b2Body_GetLinearVelocity(this.bodyId);
    const bodyMass = b2Body_GetMass(this.bodyId);
    let targetVelX = 0;

    if (controls.left?.isDown) {
      targetVelX = -PHYSICS.PLAYER.SPEED;
      this.setFlipX(true);
    } else if (controls.right?.isDown) {
      targetVelX = PHYSICS.PLAYER.SPEED;
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

    if (
      controls.up?.isDown &&
      canJump &&
      currentAnimKey !== ASSETS.PLAYER.JUMP.KEY &&
      currentAnimKey !== ASSETS.PLAYER.FALL.KEY
    ) {
      // Apply upward force for jump (negative Y in Phaser)
      const impulseMagnitude = this.jumpForce * bodyMass;
      const impulseVec = new b2Vec2(0, -impulseMagnitude);
      b2Body_ApplyLinearImpulseToCenter(this.bodyId, impulseVec, true);
      this.playerState.isGrounded = false;

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

    // Update animations based on current state
    this.updateAnimations(targetVelX, currentVelocity);
  }

  updateAnimations(moveX: number, velocity: IB2Vec2) {
    if (!this.bodyId) return;
    if (this.playerState.isDead) return;

    const currentAnimKey = this.anims.currentAnim?.key;
    const currentVelY = velocity.y;

    // With standard coordinates, falling is when Y velocity is positive
    if (currentVelY > PHYSICS.PLAYER.JUMP_THRESHOLD) {
      if (
        currentAnimKey !== ASSETS.PLAYER.FALL.KEY &&
        currentAnimKey !== ASSETS.PLAYER.JUMP.KEY
      ) {
        this.play(ASSETS.PLAYER.FALL.KEY, true);
      }
    } else if (
      Math.abs(currentVelY) <= PHYSICS.PLAYER.JUMP_THRESHOLD &&
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

  setGrounded(isGrounded: boolean) {
    this.playerState.isGrounded = isGrounded;
  }
}
