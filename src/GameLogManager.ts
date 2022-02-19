export type GameLog = {
  gamesPlayed: number;
  winStreak: number;
  maxWinStreak: number;
  invalidWordCount: number;
  winCount: number;
  forfeitCount: number;
  lossCount: number;
  guessCount: number;
  winGuessCountDistribution: {
    [number: number]: number;
  };
  solvedWords: {
    [word: string]: number;
  };
  lastUpdated: number;
  lastWin: number;
};

const DefaultGameLog: GameLog = {
  gamesPlayed: 0,
  winStreak: 0,
  maxWinStreak: 0,
  winCount: 0,
  invalidWordCount: 0,
  forfeitCount: 0,
  lossCount: 0,
  guessCount: 0,
  winGuessCountDistribution: {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
    6: 0,
  },
  solvedWords: {},
  lastUpdated: Date.now(),
  lastWin: 0,
};

const GAME_LOG_KEY = "word-guess-log";

export class GameLogManager {
  public gameLog = DefaultGameLog;

  constructor() {
    this._initializeLog();
  }

  private _initializeLog() {
    this.gameLog = this._getGameLog();
  }

  private _getGameLog() {
    try {
      const potentialGameLog = localStorage.getItem(GAME_LOG_KEY);
      if (potentialGameLog) {
        return JSON.parse(potentialGameLog);
      } else {
        this.gameLog = DefaultGameLog;
        this._saveGameLog();
        return DefaultGameLog;
      }
    } catch {
      console.error("Error Parsing Game Log");
    }
  }

  private _saveGameLog() {
    this.gameLog.lastUpdated = Date.now();
    localStorage.setItem(GAME_LOG_KEY, JSON.stringify(this.gameLog));
  }

  public updateWinCount(word: string, guessCount: number) {
    this.gameLog.gamesPlayed += 1;
    this.gameLog.winCount += 1;
    this.gameLog.winStreak += 1;
    this.gameLog.lastWin = Date.now();
    if (this.gameLog.winStreak > this.gameLog.maxWinStreak) {
      this.gameLog.maxWinStreak = this.gameLog.winStreak;
    }
    this.gameLog.winGuessCountDistribution[guessCount] += 1;
    if (!this.gameLog.solvedWords[word]) {
      this.gameLog.solvedWords[word] = guessCount;
    } else if (this.gameLog.solvedWords[word] > guessCount) {
      this.gameLog.solvedWords[word] = guessCount;
    }
    this._saveGameLog();
  }

  public updateLossCount() {
    this.gameLog.gamesPlayed += 1;
    this.gameLog.winStreak = 0;
    this.gameLog.lossCount += 1;
    this._saveGameLog();
  }

  public updateForfeitCount() {
    this.gameLog.gamesPlayed += 1;
    this.gameLog.forfeitCount += 1;
    this._saveGameLog();
  }

  public updateGuessCount() {
    this.gameLog.guessCount += 1;
    this._saveGameLog();
  }

  public updateInvalidWordCount() {
    this.gameLog.invalidWordCount += 1;
    this._saveGameLog();
  }

  public resetGameLog() {
    this.gameLog = DefaultGameLog;
    this._saveGameLog();
  }
}
