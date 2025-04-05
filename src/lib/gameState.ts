/**
 * Game State Management using Finite State Machine with Singleton Pattern
 *
 * This module implements a Finite State Machine (FSM) for managing the game's state.
 * It follows the Singleton pattern to ensure only one instance of the game state exists.
 *
 * State Flow:
 * INITIALIZING -> READY -> PLAYING -> (PAUSED) -> GAME_OVER -> READY
 *
 */

/**
 * Enumeration of possible game states
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
 */
class GameState {
  private static instance: GameState;

  private currentState: (typeof GameStates)[keyof typeof GameStates] =
    GameStates.INITIALIZING;
  public worldId: any | null = null; // Use any for Box2D ID
  private coins: number = 0;

  /**
   * Creates or returns the singleton instance of GameState
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
   */
  static getInstance(): GameState {
    if (!GameState.instance) {
      GameState.instance = new GameState();
    }
    return GameState.instance;
  }

  /**
   * Resets the game state to initial values
   */
  reset(): void {
    this.currentState = GameStates.INITIALIZING;
    this.worldId = null;
    this.coins = 0;
  }

  /**
   * Handles state transitions in the FSM
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
   */
  private _executeEntryActions(
    state: (typeof GameStates)[keyof typeof GameStates]
  ): void {
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
   */
  private _executeExitActions(
    state: (typeof GameStates)[keyof typeof GameStates]
  ): void {
    switch (state) {
      case GameStates.PLAYING:
        // Any cleanup needed when leaving playing state
        break;
    }
  }

  /**
   * Checks if game is in INITIALIZING state
   */
  get isInitializing(): boolean {
    return this.currentState === GameStates.INITIALIZING;
  }

  /**
   * Checks if game is in READY state
   */
  get isReady(): boolean {
    return this.currentState === GameStates.READY;
  }

  /**
   * Checks if game is in PLAYING state
   */
  get isPlaying(): boolean {
    return this.currentState === GameStates.PLAYING;
  }

  /**
   * Checks if game is in PAUSED state
   */
  get isPaused(): boolean {
    return this.currentState === GameStates.PAUSED;
  }

  /**
   * Checks if game is in GAME_OVER state
   */
  get isGameOver(): boolean {
    return this.currentState === GameStates.GAME_OVER;
  }

  /**
   * Sets the Box2D world ID and transitions from INITIALIZING to READY if applicable
   */
  setWorldId(id: any): void {
    this.worldId = id;
    if (this.isInitializing) {
      this.transition(GameStates.READY);
    }
  }

  /**
   * Starts the game by transitioning to PLAYING state
   */
  startGame(): boolean {
    return this.transition(GameStates.PLAYING);
  }

  /**
   * Pauses the game by transitioning to PAUSED state
   */
  pauseGame(): boolean {
    return this.transition(GameStates.PAUSED);
  }

  /**
   * Resumes the game by transitioning back to PLAYING state
   */
  resumeGame(): boolean {
    return this.transition(GameStates.PLAYING);
  }

  /**
   * Ends the game by transitioning to GAME_OVER state
   */
  endGame(): boolean {
    return this.transition(GameStates.GAME_OVER);
  }

  /**
   * Restarts the game by transitioning from GAME_OVER to READY state
   */
  restartGame(): boolean {
    if (this.isGameOver) {
      return this.transition(GameStates.READY);
    }
    return false;
  }

  /**
   * Adds a coin to the player's collection (only in PLAYING state)
   */
  addCoin(): boolean {
    if (this.isPlaying) {
      this.coins++;
      return true;
    }
    return false;
  }

  /**
   * Gets the current coin count
   */
  getCoins(): number {
    return this.coins;
  }
}

/**
 * The singleton instance of GameState
 */
export const gameState = GameState.getInstance();

/**
 * Convenience function to reset the game state
 */
export const resetGameState = (): void => gameState.reset();
