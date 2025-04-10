/**
 * Game State Management using Finite State Machine with Singleton Pattern
 *
 * This module implements a Finite State Machine (FSM) for managing the game's state.
 * It follows the Singleton pattern to ensure only one instance of the game state exists.
 *
 * State Flow:
 * INITIALIZING -> READY -> PLAYING -> (PAUSED) -> GAME_OVER -> READY
 *
 * @module gameState
 */
import { b2WorldId as B2WorldIdClass } from "@PhaserBox2D"; // Import the class
type b2WorldIdInstance = InstanceType<typeof B2WorldIdClass>; // Get instance type

/**
 * Enumeration of possible game states
 * @readonly
 * @enum {string}
 */
export const GameStates = {
  /** Initial state when game is loading */
  INITIALIZING: "INITIALIZING",
  /** Game is ready to start */
  READY: "READY",
  /** Game is actively being played */
  PLAYING: "PLAYING",
  /** Game is temporarily paused */
  PAUSED: "PAUSED",
  /** Game has ended */
  GAME_OVER: "GAME_OVER",
};

/**
 * Defines valid state transitions for the FSM
 * Each state maps to an array of valid next states
 * @private
 * @readonly
 * @type {Object.<string, string[]>}
 */
const StateTransitions = {
  [GameStates.INITIALIZING]: [GameStates.READY],
  [GameStates.READY]: [GameStates.PLAYING],
  [GameStates.PLAYING]: [GameStates.PAUSED, GameStates.GAME_OVER],
  [GameStates.PAUSED]: [GameStates.PLAYING],
  [GameStates.GAME_OVER]: [GameStates.READY],
};

/**
 * GameState class implementing both Singleton pattern and Finite State Machine
 * @class
 */
class GameState {
  // Declare static instance property for Singleton
  private static instance: GameState;

  // Declare instance properties
  private currentState!: (typeof GameStates)[keyof typeof GameStates];
  public worldId: b2WorldIdInstance | null = null; // Use derived instance type
  private coins: number = 0; // Initialize coins to 0
  private _isRestarting: boolean = false; // Flag to indicate if the game is in the process of restarting

  /**
   * Creates or returns the singleton instance of GameState
   * @constructor
   */
  constructor() {
    if (GameState.instance) {
      return GameState.instance;
    }
    GameState.instance = this;
    this.reset();
  }

  /**
   * Gets the singleton instance of GameState
   * @static
   * @returns {GameState} The singleton instance
   */
  static getInstance() {
    if (!GameState.instance) {
      GameState.instance = new GameState();
    }
    return GameState.instance;
  }

  /**
   * Resets the game state to initial values
   * @param {boolean} [preserveWorld=true] - Whether to preserve the worldId (default: true)
   */
  reset(preserveWorld: boolean = true) {
    // Save worldId reference if preserving world
    const savedWorldId = preserveWorld ? this.worldId : null;

    this.currentState = GameStates.INITIALIZING;
    this.worldId = savedWorldId; // Either null or the preserved worldId
    this.coins = 0;

    // If we preserved the world and have a valid ID, transition directly to READY
    if (preserveWorld && this.worldId) {
      this.transition(GameStates.READY);
    }
  }

  /**
   * Checks if the game is currently in the process of restarting
   * @returns {boolean}
   */
  get isRestarting() {
    return this._isRestarting;
  }

  /**
   * Sets the restarting flag
   * @param {boolean} value - Whether the game is restarting
   */
  setRestarting(value: boolean) {
    this._isRestarting = value;
  }

  /**
   * Resets only game variables without clearing the worldId
   * Used when restarting a level rather than initializing a new world
   */
  resetLevel() {
    // Set restarting flag
    this._isRestarting = true;

    // Transition to READY state, which resets coins through entry actions
    if (this.currentState !== GameStates.READY) {
      this.transition(GameStates.READY);
    } else {
      // If already in READY state, manually reset coins
      this.coins = 0;
    }

    // Clear restarting flag after state transition is complete
    setTimeout(() => {
      this._isRestarting = false;
    }, 50);
  }

  /**
   * Handles state transitions in the FSM
   * @param {GameStates} newState - The state to transition to
   * @returns {boolean} Whether the transition was successful
   */
  transition(newState: (typeof GameStates)[keyof typeof GameStates]): boolean {
    const validTransitions =
      StateTransitions[this.currentState as keyof typeof StateTransitions];

    if (!validTransitions?.includes(newState)) {
      console.warn(
        `Invalid state transition: ${this.currentState} -> ${newState}`
      );
      return false;
    }

    this._executeExitActions(this.currentState);
    this.currentState = newState;
    this._executeEntryActions(newState);

    return true;
  }

  /**
   * Executes actions when entering a new state
   * @private
   * @param {GameStates} state - The state being entered
   */
  _executeEntryActions(state: (typeof GameStates)[keyof typeof GameStates]) {
    switch (state) {
      case GameStates.READY:
        // Reset game-specific state but keep worldId
        this.coins = 0;
        break;
      case GameStates.PLAYING:
        // Any setup needed when game starts
        break;
      case GameStates.GAME_OVER:
        // Any cleanup needed when game ends
        break;
    }
  }

  /**
   * Executes actions when exiting a state
   * @private
   * @param {GameStates} state - The state being exited
   */
  _executeExitActions(state: (typeof GameStates)[keyof typeof GameStates]) {
    switch (state) {
      case GameStates.PLAYING:
        // Any cleanup needed when leaving playing state
        break;
    }
  }

  /**
   * Checks if game is in INITIALIZING state
   * @returns {boolean}
   */
  get isInitializing() {
    return this.currentState === GameStates.INITIALIZING;
  }

  /**
   * Checks if game is in READY state
   * @returns {boolean}
   */
  get isReady() {
    return this.currentState === GameStates.READY;
  }

  /**
   * Checks if game is in PLAYING state
   * @returns {boolean}
   */
  get isPlaying() {
    return this.currentState === GameStates.PLAYING;
  }

  /**
   * Checks if game is in PAUSED state
   * @returns {boolean}
   */
  get isPaused() {
    return this.currentState === GameStates.PAUSED;
  }

  /**
   * Checks if game is in GAME_OVER state
   * @returns {boolean}
   */
  get isGameOver() {
    return this.currentState === GameStates.GAME_OVER;
  }

  /**
   * Sets the Box2D world ID and transitions from INITIALIZING to READY if applicable
   * @param {any} id - The Box2D world ID
   */
  setWorldId(id: b2WorldIdInstance) {
    this.worldId = id;
    if (this.isInitializing) {
      this.transition(GameStates.READY);
    }
  }

  /**
   * Starts the game by transitioning to PLAYING state
   * @returns {boolean} Whether the transition was successful
   */
  startGame() {
    return this.transition(GameStates.PLAYING);
  }

  /**
   * Pauses the game by transitioning to PAUSED state
   * @returns {boolean} Whether the transition was successful
   */
  pauseGame() {
    return this.transition(GameStates.PAUSED);
  }

  /**
   * Resumes the game by transitioning back to PLAYING state
   * @returns {boolean} Whether the transition was successful
   */
  resumeGame() {
    return this.transition(GameStates.PLAYING);
  }

  /**
   * Ends the game by transitioning to GAME_OVER state
   * @returns {boolean} Whether the transition was successful
   */
  endGame() {
    console.log("Ending game");
    return this.transition(GameStates.GAME_OVER);
  }

  /**
   * Restarts the game by transitioning from GAME_OVER to READY state
   * @returns {boolean} Whether the transition was successful
   */
  restartGame() {
    if (this.isGameOver) {
      return this.transition(GameStates.READY);
    }
    return false;
  }

  /**
   * Adds a coin to the player's collection (only in PLAYING state)
   * @returns {boolean} Whether the coin was successfully added
   */
  incrementCoins(): boolean {
    // Renamed from addCoin for clarity
    if (this.isPlaying) {
      this.coins++;
      return true;
    }
    return false;
  }

  resetCoins() {
    this.coins = 0;
  }

  /**
   * Gets the current coin count
   * @returns {number} The current coin count
   */
  getCoins() {
    return this.coins;
  }

  /**
   * Sets the coin count to a specific value
   * @param {number} value - The value to set coins to
   * @returns {number} The new coin count
   */
  setCoins(value: number) {
    this.coins = value;
    return this.coins;
  }
}

/**
 * The singleton instance of GameState
 */
export const gameState = GameState.getInstance();

/**
 * Convenience function to reset the game state
 * @function
 * @param {boolean} [preserveWorld=true] - Whether to preserve the worldId
 */
export const resetGameState = (preserveWorld: boolean = true) =>
  gameState.reset(preserveWorld);
