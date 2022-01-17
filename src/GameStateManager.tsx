import { LetterState } from "./App";
import { alphabet } from "./wordList";

export type GameState = {
  guessMap: LetterState[][];
  letterOptions: LetterState[];
  cursorPointer: [number, number];
  showFail: boolean;
  showSuccess: boolean;
  showError: boolean;
  errorMessage: string;
  puzzleNumber: number;
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
};

const GAME_STATE_KEY = "word-guess-state";

export class GameStateManager {
  public gameState = JSON.parse(JSON.stringify(DefaultGameState));

  constructor() {
    this._initializeState();
  }

  private _initializeState() {
    this.gameState = this._getGameState();
  }

  private _getGameState() {
    try {
      const potentialGameState = localStorage.getItem(GAME_STATE_KEY);
      if (potentialGameState) {
        return JSON.parse(potentialGameState);
      } else {
        this.gameState = JSON.parse(JSON.stringify(DefaultGameState));
        this._saveGameState();
        return JSON.parse(JSON.stringify(DefaultGameState));
      }
    } catch {
      console.error("Error Parsing Game State");
    }
  }

  private _saveGameState() {
    localStorage.setItem(GAME_STATE_KEY, JSON.stringify(this.gameState));
  }

  public generateNewGameState(): GameState {
    return JSON.parse(JSON.stringify(DefaultGameState))
  }

  public saveGameState(newGameState: GameState) {
    this._saveGameState();
  }

  public resetGameState() {
    this.gameState = this.generateNewGameState();
    this._saveGameState();
  }
}