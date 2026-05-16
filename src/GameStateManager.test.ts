import {
  GameStateManager,
  GAME_STATE_KEY,
  TODAYS_GAME_STATE_KEY,
} from "./GameStateManager";

// ---------------------------------------------------------------------------
// Default state
// ---------------------------------------------------------------------------

describe("GameStateManager — default state", () => {
  it("initialises with a 6×5 guessMap of empty letters", () => {
    const mgr = new GameStateManager();
    expect(mgr.gameState.guessMap).toHaveLength(6);
    mgr.gameState.guessMap.forEach((row) => {
      expect(row).toHaveLength(5);
      row.forEach((cell) => expect(cell.letter).toBe(""));
    });
  });

  it("initialises with cursorPointer at [0, 0]", () => {
    const mgr = new GameStateManager();
    expect(mgr.gameState.cursorPointer).toEqual([0, 0]);
  });

  it("initialises with 26 letterOptions", () => {
    const mgr = new GameStateManager();
    expect(mgr.gameState.letterOptions).toHaveLength(26);
  });

  it("initialises showFail / showSuccess / showError as false", () => {
    const mgr = new GameStateManager();
    expect(mgr.gameState.showFail).toBe(false);
    expect(mgr.gameState.showSuccess).toBe(false);
    expect(mgr.gameState.showError).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Save / load round-trip
// ---------------------------------------------------------------------------

describe("GameStateManager — save/load round-trip", () => {
  it("persists a modified state and reloads it correctly", () => {
    const mgr = new GameStateManager();
    const modified = mgr.generateNewGameState();
    modified.puzzleNumber = 99;
    modified.cursorPointer = [2, 3];

    mgr.saveGameState(modified, false); // saves to GAME_STATE_KEY

    const mgr2 = new GameStateManager();
    expect(mgr2.gameState.puzzleNumber).toBe(99);
    expect(mgr2.gameState.cursorPointer).toEqual([2, 3]);
  });

  it("uses TODAYS_GAME_STATE_KEY when todaysGame = true", () => {
    const mgr = new GameStateManager();
    const state = mgr.generateNewGameState();
    state.puzzleNumber = 7;

    mgr.saveGameState(state, true);

    // TODAYS_GAME_STATE_KEY should have the saved state
    const todaysRaw = localStorage.getItem(TODAYS_GAME_STATE_KEY);
    expect(todaysRaw).not.toBeNull();
    expect(JSON.parse(todaysRaw!).puzzleNumber).toBe(7);

    // GAME_STATE_KEY should NOT contain puzzleNumber 7 (the constructor wrote
    // the default state there, but saveGameState(true) should not overwrite it)
    const defaultRaw = localStorage.getItem(GAME_STATE_KEY);
    if (defaultRaw) {
      expect(JSON.parse(defaultRaw).puzzleNumber).not.toBe(7);
    }
  });

  it("loadGameState retrieves from a custom key", () => {
    const mgr = new GameStateManager();
    const state = mgr.generateNewGameState();
    state.puzzleNumber = 55;
    mgr.saveGameState(state, true); // stored under TODAYS_GAME_STATE_KEY

    const loaded = mgr.loadGameState(TODAYS_GAME_STATE_KEY);
    expect(loaded.puzzleNumber).toBe(55);
  });
});

// ---------------------------------------------------------------------------
// Reset
// ---------------------------------------------------------------------------

describe("GameStateManager — reset", () => {
  it("resetGameState clears the saved state back to defaults", () => {
    const mgr = new GameStateManager();
    const state = mgr.generateNewGameState();
    state.puzzleNumber = 42;
    mgr.saveGameState(state, false);

    mgr.resetGameState();

    const mgr2 = new GameStateManager();
    expect(mgr2.gameState.puzzleNumber).toBe(0);
    expect(mgr2.gameState.cursorPointer).toEqual([0, 0]);
  });
});

// ---------------------------------------------------------------------------
// Corrupted localStorage
// ---------------------------------------------------------------------------

describe("GameStateManager — corrupted localStorage", () => {
  it("falls back to default state when localStorage contains garbage JSON", () => {
    localStorage.setItem(GAME_STATE_KEY, "{not valid json}}}");
    const mgr = new GameStateManager();
    // Should not throw and should return the default state
    expect(mgr.gameState.letterOptions).toHaveLength(26);
    expect(mgr.gameState.cursorPointer).toEqual([0, 0]);
  });

  it("falls back to default state when letterOptions array is missing (empty)", () => {
    const partial = { guessMap: [], letterOptions: [], cursorPointer: [0, 0] };
    localStorage.setItem(GAME_STATE_KEY, JSON.stringify(partial));
    const mgr = new GameStateManager();
    expect(mgr.gameState.letterOptions).toHaveLength(26);
  });

  it("[BUG-M6] throws or produces invalid state when cursorPointer is missing from saved state", () => {
    // A partial saved state missing cursorPointer causes undefined[0] at runtime.
    // This test documents the bug: the manager should return valid state but currently will throw.
    const partial = {
      guessMap: [
        [
          { letter: "A", containMatch: false, positionMatch: false, noMatch: false, disabled: false },
          { letter: "P", containMatch: false, positionMatch: false, noMatch: false, disabled: false },
          { letter: "P", containMatch: false, positionMatch: false, noMatch: false, disabled: false },
          { letter: "L", containMatch: false, positionMatch: false, noMatch: false, disabled: false },
          { letter: "E", containMatch: false, positionMatch: false, noMatch: false, disabled: false },
        ],
        ...Array(5).fill(Array(5).fill({ letter: "", containMatch: false, positionMatch: false, noMatch: false, disabled: false })),
      ],
      letterOptions: Array(26).fill({ letter: "A", containMatch: false, positionMatch: false, noMatch: false, disabled: false }),
      // cursorPointer intentionally omitted
      showFail: false,
      showSuccess: false,
      showError: false,
      errorMessage: "",
      puzzleNumber: 3,
      lastUpdated: Date.now(),
    };
    localStorage.setItem(GAME_STATE_KEY, JSON.stringify(partial));

    // The bug: GameStateManager only validates letterOptions.length, not the full schema.
    // A state without cursorPointer will be returned as-is, making cursorPointer undefined.
    // Any code that later does cursorPointer[0] will throw.
    expect(() => {
      const mgr = new GameStateManager();
      // Access cursorPointer to trigger the latent error
      void mgr.gameState.cursorPointer[0];
    }).not.toThrow(); // This assertion FAILS today (documents BUG-M6) — will pass after fix
  });
});
