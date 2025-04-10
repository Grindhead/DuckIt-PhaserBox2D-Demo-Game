/**
 * Game Constants Module
 *
 * This module contains all the constant values used throughout the game.
 * Constants are organized into logical groups based on their purpose.
 *
 * @module constants
 */

export const TEST_CRATES: boolean = true;
/**
 * Physics configuration for Box2D integration
 * All forces and velocities should use these scales
 * @readonly
 * @enum {Object}
 */
export const PHYSICS = {
  /** Physics scale (pixels per meter) for Box2D calculations */
  SCALE: 30,

  /** World gravity configuration */
  GRAVITY: {
    /** Horizontal gravity (0 for no horizontal gravity) */
    x: 0,
    /** Vertical gravity (negative for downward force in Box2D) */
    y: -50, // Slightly reduced gravity from -10.0 for better stability
  },

  /** Player physics properties */
  PLAYER: {
    /** Horizontal movement speed in pixels/second */
    SPEED: 160,
    /** Vertical jump force (positive for upward force) */
    JUMP_FORCE: 40,
    /** Mass density for physics calculations */
    DENSITY: 1.0,
    /** Surface friction coefficient */
    FRICTION: 0.8,
    /** Bounce coefficient (0 for no bounce) */
    RESTITUTION: 0.0,
    /** Vertical velocity threshold for jump/fall detection */
    JUMP_THRESHOLD: 1.0,
    /** Horizontal velocity threshold for movement detection */
    MOVE_THRESHOLD: 10,
  },

  /** Platform physics properties */
  PLATFORM: {
    /** Surface friction coefficient */
    FRICTION: 1.5,
  },

  /** Death sensor properties */
  DEATH_SENSOR: {
    /** Height in pixels */
    HEIGHT: 10, // Arbitrary small height for the sensor box
    /** Mass density (irrelevant for sensor, but needed for Box2D) */
    DENSITY: 0.0,
    /** Surface friction coefficient (irrelevant) */
    FRICTION: 0.0,
    /** Bounce coefficient (irrelevant) */
    RESTITUTION: 0.0,

    /** Whether the sensor is visible */
    VISIBLE: false,
  },
} as const;

/**
 * Game world dimensions and boundaries
 * @readonly
 * @enum {Object}
 */
export const WORLD = {
  /** Total world width in pixels */
  WIDTH: 10000,
  /** Total world height in pixels */
  HEIGHT: 4000,
  /** Y position of death sensor (below world height) */
  DEATH_SENSOR_Y: 4400,
} as const;

/**
 * Game render dimensions and boundaries
 * @readonly
 * @enum {Object}
 */
export const RENDERER = {
  /** Width in pixels */
  WIDTH: 1180,
  /** Height in pixels */
  HEIGHT: 820,
} as const;

/**
 * Animation configuration
 * @readonly
 * @enum {Object}
 */
export const ANIMATION = {
  /** Default frame rate for animations */
  FRAME_RATE: 30,
  /** Camera smoothing factor (0-1, lower = smoother) */
  CAMERA_LERP: 0.1,
} as const;

/**
 * Asset configuration for sprites and animations
 * Organized by game object type
 * @readonly
 * @enum {Object}
 */
export const ASSETS = {
  /** Atlas key for sprite sheet */
  ATLAS: "assets",

  /** Player character assets */
  PLAYER: {
    /** Idle animation configuration */
    IDLE: {
      /** Animation key */
      KEY: "duck-idle",
      /** First frame identifier */
      FRAME: "player/idle/duck-idle-0001.png",
      /** Total number of frames */
      FRAME_COUNT: 10,
    },
    /** Running animation configuration */
    RUN: {
      /** Animation key */
      KEY: "duck-run",
      /** Frame name prefix */
      FRAME_PREFIX: "player/run/duck-run-",
      /** Total number of frames */
      FRAME_COUNT: 14,
    },
    /** Jumping animation configuration */
    JUMP: {
      /** Animation key */
      KEY: "duck-jump",
      /** Frame name prefix */
      FRAME_PREFIX: "player/jump/duck-jump-",
      /** Total number of frames */
      FRAME_COUNT: 12,
    },
    /** Falling animation configuration */
    FALL: {
      /** Animation key */
      KEY: "duck-fall",
      /** Frame name prefix */
      FRAME_PREFIX: "player/fall/duck-fall-",
      /** Total number of frames */
      FRAME_COUNT: 10,
    },
    /** Death animation configuration */
    DEAD: {
      /** Animation key */
      KEY: "duck-dead",
      /** Frame name prefix */
      FRAME_PREFIX: "player/dead/duck-dead-",
      /** Total number of frames */
      FRAME_COUNT: 10,
    },
  },

  /** Crate assets */
  CRATE: {
    /** Big crate sprite key */
    BIG: {
      FRAME: "crate/crate-big.png",
      DENSITY: 1.0,
      FRICTION: 0.2,
      RESTITUTION: 0.0,
      WIDTH: 72,
      HEIGHT: 72,
    },
    /** Small crate sprite key */
    SMALL: {
      FRAME: "crate/crate-small.png",
      DENSITY: 1.0,
      FRICTION: 0.2,
      RESTITUTION: 0.0,
      WIDTH: 48,
      HEIGHT: 48,
    },
  },

  /** Collectible coin assets */
  COIN: {
    /** Idle animation configuration */
    IDLE: {
      /** Animation key */
      KEY: "coin-idle",
      /** Frame name prefix */
      FRAME_PREFIX: "coin/coin-idle/coin-idle-",
      /** Total number of frames */
      FRAME_COUNT: 23,
    },
    /** Collection animation configuration */
    COLLECT: {
      /** Animation key */
      KEY: "coin-collect",
      /** Frame name prefix */
      FRAME_PREFIX: "coin/coin-collect/coin-collect-",
      /** Total number of frames */
      FRAME_COUNT: 8,
    },
    /** Single frame identifier (for placement) */
    FRAME: "coin/coin-idle/coin-idle-0001.png",
  },

  /** Level finish flag assets */
  FINISH: {
    /** Inactive state configuration */
    IDLE: {
      /** Animation key */
      KEY: "finish-idle",
      /** Static frame identifier */
      FRAME: "finish/finish-idle/finish-idle.png",
    },
    /** Activation animation configuration */
    ACTIVATED: {
      /** Animation key */
      KEY: "finish-activated",
      /** Frame name prefix */
      FRAME_PREFIX: "finish/finish-activated/finish-activated-",
      /** Total number of frames */
      FRAME_COUNT: 19,
    },
    /** Active state animation configuration */
    ACTIVE: {
      /** Animation key */
      KEY: "finish-active",
      /** Frame name prefix */
      FRAME_PREFIX: "finish/finish-active/finish-active-",
      /** Total number of frames */
      FRAME_COUNT: 18,
    },
  },

  /** Platform segment assets */
  PLATFORM: {
    /** Left edge sprite key */
    LEFT: "platforms/platform-left.png",
    /** Middle segment sprite key */
    MIDDLE: "platforms/platform-middle.png",
    /** Right edge sprite key */
    RIGHT: "platforms/platform-right.png",
  },

  /** UI element assets */
  UI: {
    /** Start screen overlay sprite key */
    START: "ui/start.png",

    /** Game over overlay sprite key */
    GAME_OVER: "ui/game-over.png",

    /** Mobile direction control button sprite key */
    DIRECTION_BUTTON: "ui/direction-button.png",
  },
} as const;

/**
 * Scene identifiers
 * @readonly
 * @enum {string}
 */
export const SCENES = {
  /** Boot scene for initial setup */
  BOOT: "BootScene",
  /** Preloader scene for asset loading */
  PRELOADER: "PreloaderScene",
  /** Main game scene */
  GAME: "GameScene",
} as const;

/**
 * UI element configuration
 * @readonly
 * @enum {Object}
 */
export const UI = {
  /** Coin counter display configuration */
  COIN_COUNTER: {
    /** Text size and font */
    FONT_SIZE: "24px",
    /** Text color */
    COLOR: "#000000",
    /** Position offset from corner */
    OFFSET: {
      /** X offset in pixels */
      x: 100,
      /** Y offset in pixels */
      y: 20,
    },
  },
  /** Mobile control configuration */
  MOBILE_CONTROLS: {
    /** Button scale factor */
    SCALE: 0.5,
    /** Edge padding in pixels */
    PADDING: 20,
    /** Base button size in pixels */
    BUTTON_SIZE: 64,
  },
} as const;
