// ---------------------------------------------------------------------------
// NOTE: GameLogManager.ts has a module-level `DefaultGameLog` singleton
// (BUG-C2/M5). resetGameLog() assigns `this.gameLog = DefaultGameLog` and then
// mutates it, permanently corrupting the in-memory constant for the rest of
// the process lifetime. To keep tests isolated we use jest.resetModules() in
// the BUG-C2 block and avoid calling resetGameLog() in all other tests.
//
// require() is used instead of import so each test can pick up a freshly-reset
// module instance after jest.resetModules() — that pattern is incompatible
// with hoisted top-level imports, so the no-var-requires rule is disabled.
// ---------------------------------------------------------------------------

/* eslint-disable @typescript-eslint/no-var-requires */

// Marks this file as a module under tsc's --isolatedModules (it otherwise has
// no top-level import/export because each test uses require() after resetModules).
export {};

const GAME_LOG_KEY = "word-guess-log";

// ---------------------------------------------------------------------------
// Default state
// ---------------------------------------------------------------------------

describe("GameLogManager — default state", () => {
  it("starts with all counters at zero", () => {
    const { GameLogManager } = require("./GameLogManager");
    const mgr = new GameLogManager();
    expect(mgr.gameLog.gamesPlayed).toBe(0);
    expect(mgr.gameLog.winCount).toBe(0);
    expect(mgr.gameLog.lossCount).toBe(0);
    expect(mgr.gameLog.winStreak).toBe(0);
    expect(mgr.gameLog.maxWinStreak).toBe(0);
    expect(mgr.gameLog.guessCount).toBe(0);
  });

  it("starts with a zero-distribution for all guess counts", () => {
    const { GameLogManager } = require("./GameLogManager");
    const mgr = new GameLogManager();
    [1, 2, 3, 4, 5, 6].forEach((n) => {
      expect(mgr.gameLog.winGuessCountDistribution[n]).toBe(0);
    });
  });
});

// ---------------------------------------------------------------------------
// Win tracking
// ---------------------------------------------------------------------------

describe("GameLogManager — updateWinCount", () => {
  // Use resetModules per test to avoid DefaultGameLog mutation bleed from C2 bug
  beforeEach(() => jest.resetModules());

  it("increments gamesPlayed, winCount, and winStreak", () => {
    const { GameLogManager } = require("./GameLogManager");
    const mgr = new GameLogManager();
    mgr.updateWinCount("apple", 3);
    expect(mgr.gameLog.gamesPlayed).toBe(1);
    expect(mgr.gameLog.winCount).toBe(1);
    expect(mgr.gameLog.winStreak).toBe(1);
  });

  it("records the guess count in the distribution", () => {
    const { GameLogManager } = require("./GameLogManager");
    const mgr = new GameLogManager();
    mgr.updateWinCount("apple", 4);
    expect(mgr.gameLog.winGuessCountDistribution[4]).toBe(1);
  });

  it("updates maxWinStreak when winStreak exceeds it", () => {
    const { GameLogManager } = require("./GameLogManager");
    const mgr = new GameLogManager();
    mgr.updateWinCount("apple", 2);
    mgr.updateWinCount("crane", 3);
    expect(mgr.gameLog.maxWinStreak).toBe(2);
  });

  it("tracks solvedWords with the guess count", () => {
    const { GameLogManager } = require("./GameLogManager");
    const mgr = new GameLogManager();
    mgr.updateWinCount("apple", 5);
    expect(mgr.gameLog.solvedWords["apple"]).toBe(5);
  });

  it("updates solvedWords if solved again in fewer guesses", () => {
    const { GameLogManager } = require("./GameLogManager");
    const mgr = new GameLogManager();
    mgr.updateWinCount("apple", 5);
    mgr.updateWinCount("apple", 2);
    expect(mgr.gameLog.solvedWords["apple"]).toBe(2);
  });

  it("does not update solvedWords if solved again in more guesses", () => {
    const { GameLogManager } = require("./GameLogManager");
    const mgr = new GameLogManager();
    mgr.updateWinCount("apple", 2);
    mgr.updateWinCount("apple", 5);
    expect(mgr.gameLog.solvedWords["apple"]).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// Loss tracking
// ---------------------------------------------------------------------------

describe("GameLogManager — updateLossCount", () => {
  beforeEach(() => jest.resetModules());

  it("increments lossCount and resets winStreak", () => {
    const { GameLogManager } = require("./GameLogManager");
    const mgr = new GameLogManager();
    mgr.updateWinCount("apple", 1);
    mgr.updateWinCount("crane", 2);
    expect(mgr.gameLog.winStreak).toBe(2);

    mgr.updateLossCount();
    expect(mgr.gameLog.lossCount).toBe(1);
    expect(mgr.gameLog.winStreak).toBe(0);
    // maxWinStreak should be preserved
    expect(mgr.gameLog.maxWinStreak).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// Persist across instances (save/load round-trip)
// ---------------------------------------------------------------------------

describe("GameLogManager — persistence", () => {
  beforeEach(() => jest.resetModules());

  it("stats persist when a new instance is created", () => {
    const { GameLogManager } = require("./GameLogManager");
    const mgr1 = new GameLogManager();
    mgr1.updateWinCount("apple", 3);
    mgr1.updateWinCount("crane", 1);

    const mgr2 = new GameLogManager();
    expect(mgr2.gameLog.winCount).toBe(2);
    expect(mgr2.gameLog.winGuessCountDistribution[3]).toBe(1);
    expect(mgr2.gameLog.winGuessCountDistribution[1]).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Reset — intentionally failing test (BUG-C2 / BUG-M5)
// ---------------------------------------------------------------------------

describe("GameLogManager — resetGameLog", () => {
  beforeEach(() => jest.resetModules());

  it("[BUG-C2] resetGameLog should not mutate DefaultGameLog across instances", () => {
    const { GameLogManager } = require("./GameLogManager");

    // 1. Create a manager and record some stats
    const mgr1 = new GameLogManager();
    mgr1.updateWinCount("apple", 2);
    mgr1.updateWinCount("crane", 3);
    expect(mgr1.gameLog.winCount).toBe(2);

    // 2. Reset the manager — this calls `this.gameLog = DefaultGameLog` (shared ref!)
    //    and then mutates lastUpdated on DefaultGameLog via _saveGameLog()
    mgr1.resetGameLog();

    // 3. A fresh manager loads from localStorage (written with the mutated
    //    DefaultGameLog). All stats should be 0.
    const mgr2 = new GameLogManager();

    // This FAILS because DefaultGameLog.winGuessCountDistribution was mutated:
    // winCount is 0 in the reset payload but the distribution entries were
    // already corrupted by updateWinCount calls via the shared reference.
    expect(mgr2.gameLog.winCount).toBe(0);
    [1, 2, 3, 4, 5, 6].forEach((n) => {
      expect(mgr2.gameLog.winGuessCountDistribution[n]).toBe(0);
    });
  });
});

// ---------------------------------------------------------------------------
// Corrupted localStorage — intentionally failing test (BUG-C3)
// ---------------------------------------------------------------------------

describe("GameLogManager — corrupted localStorage", () => {
  beforeEach(() => jest.resetModules());

  it("[BUG-C3] returns a valid gameLog when localStorage contains garbage JSON", () => {
    // Seed localStorage with invalid JSON before constructing the manager.
    localStorage.setItem(GAME_LOG_KEY, "{corrupt json{{");

    const { GameLogManager } = require("./GameLogManager");

    // _getGameLog's catch block has no return statement, so this.gameLog becomes
    // undefined. The next method call will throw TypeError.
    expect(() => {
      const mgr = new GameLogManager();
      // Accessing any property triggers the latent crash
      void mgr.gameLog.gamesPlayed;
    }).not.toThrow();

    // Additionally, the manager should produce sensible defaults.
    const mgr = new GameLogManager();
    expect(mgr.gameLog).not.toBeUndefined();
    expect(mgr.gameLog.gamesPlayed).toBe(0);
  });
});
