import { LetterState } from "./App";
import { alphabet } from "./wordList";

export enum DifficultyOptions {
  NORMAL = "normal",
  HARD = "hard",
  HARDER = "very hard",
}

export const difficultyDescriptions: { [key in DifficultyOptions]: string } = {
  [DifficultyOptions.NORMAL]: "Standard Wordle Rules",
  [DifficultyOptions.HARD]: "Any revealed hints must be used in subsequent guesses.",
  [DifficultyOptions.HARDER]: "Any revealed hints must be used in subsequent guesses. You can't reuse letters that aren't in the solution.",
};

export type GameState = {
  guessMap: LetterState[][];
  letterOptions: LetterState[];
  cursorPointer: [number, number];
  showFail: boolean;
  showSuccess: boolean;
  showError: boolean;
  errorMessage: string;
  puzzleNumber: number;
  lastUpdated: number;
};

export const DefaultLetter: LetterState = {
  letter: "",
  containMatch: false,
  positionMatch: false,
  noMatch: false,
  disabled: false,
};

/**
 * Create map of empty guess rows
 */
const DefaultGuessMap = [...Array(6).keys()].map(() => {
  return [DefaultLetter, DefaultLetter, DefaultLetter, DefaultLetter, DefaultLetter];
});

const DefaultLetterOptions = alphabet.map((letter) => {
  return {
    ...DefaultLetter,
    letter: letter,
  };
});

const DefaultGameState: GameState = {
  guessMap: DefaultGuessMap,
  letterOptions: DefaultLetterOptions,
  cursorPointer: [0, 0],
  showFail: false,
  showSuccess: false,
  showError: false,
  errorMessage: "",
  puzzleNumber: 0,
  lastUpdated: Date.now(),
};

export const GAME_STATE_KEY = "word-guess-state";
export const TODAYS_GAME_STATE_KEY = "todays-word-guess-state";

export class GameStateManager {
  public gameState: GameState = JSON.parse(JSON.stringify(DefaultGameState));

  constructor() {
    this._initializeState();
  }

  private _initializeState() {
    this.gameState = this._getGameState();
  }

  private _getGameState(key = GAME_STATE_KEY): GameState {
    try {
      const potentialGameState = localStorage.getItem(key);
      if (potentialGameState) {
        this.gameState = JSON.parse(potentialGameState);
        if (this.gameState.letterOptions.length) {
          return this.gameState;
        } else {
          this.gameState = JSON.parse(JSON.stringify(DefaultGameState));
          return this.gameState;
        }
      } else {
        this.gameState = JSON.parse(JSON.stringify(DefaultGameState));
        this._commitGameState(key);
        return JSON.parse(JSON.stringify(DefaultGameState));
      }
    } catch {
      console.error("Error Parsing Game State");
      return JSON.parse(JSON.stringify(DefaultGameState));
    }
  }

  private _commitGameState(key: string) {
    localStorage.setItem(key, JSON.stringify({ ...this.gameState, lastUpdated: Date.now() }));
  }

  public generateNewGameState(): GameState {
    return JSON.parse(JSON.stringify(DefaultGameState));
  }

  public loadGameState(key: string) {
    return this._getGameState(key);
  }

  public saveGameState(newGameState: GameState, todaysGame: boolean) {
    this.gameState = newGameState;
    if (todaysGame) {
      this._commitGameState(TODAYS_GAME_STATE_KEY);
    } else {
      this._commitGameState(GAME_STATE_KEY);
    }
  }

  public resetGameState() {
    this.gameState = this.generateNewGameState();
    this._commitGameState(GAME_STATE_KEY);
  }
}
