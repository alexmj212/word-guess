// ---------------------------------------------------------------------------
// NOTE: GameLogManager.ts has a module-level `DefaultGameLog` singleton
// (BUG-C2/M5). resetGameLog() assigns `this.gameLog = DefaultGameLog` and then
// mutates it, permanently corrupting the in-memory constant for the rest of
// the process lifetime. To keep tests isolated we use vi.resetModules() in
// the BUG-C2 block and avoid calling resetGameLog() in all other tests.
//
// Dynamic import() is used instead of require() so each test can pick up a
// freshly-reset module instance after vi.resetModules().
// ---------------------------------------------------------------------------

// Mock react-ga4 so GameLogManager.ts can import it without a DOM/GA context
vi.mock("react-ga4", () => ({
  default: {
    event: vi.fn(),
    initialize: vi.fn(),
    set: vi.fn(),
    send: vi.fn(),
  },
}));

const GAME_LOG_KEY = "word-guess-log";

// ---------------------------------------------------------------------------
// Default state
// ---------------------------------------------------------------------------

describe("GameLogManager — default state", () => {
  it("starts with all counters at zero", async () => {
    const { GameLogManager } = await import("./GameLogManager");
    const mgr = new GameLogManager();
    expect(mgr.gameLog.gamesPlayed).toBe(0);
    expect(mgr.gameLog.winCount).toBe(0);
    expect(mgr.gameLog.lossCount).toBe(0);
    expect(mgr.gameLog.winStreak).toBe(0);
    expect(mgr.gameLog.maxWinStreak).toBe(0);
    expect(mgr.gameLog.guessCount).toBe(0);
  });

  it("starts with a zero-distribution for all guess counts", async () => {
    const { GameLogManager } = await import("./GameLogManager");
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
  beforeEach(() => vi.resetModules());

  it("increments gamesPlayed, winCount, and winStreak", async () => {
    const { GameLogManager } = await import("./GameLogManager");
    const mgr = new GameLogManager();
    mgr.updateWinCount("apple", 3);
    expect(mgr.gameLog.gamesPlayed).toBe(1);
    expect(mgr.gameLog.winCount).toBe(1);
    expect(mgr.gameLog.winStreak).toBe(1);
  });

  it("records the guess count in the distribution", async () => {
    const { GameLogManager } = await import("./GameLogManager");
    const mgr = new GameLogManager();
    mgr.updateWinCount("apple", 4);
    expect(mgr.gameLog.winGuessCountDistribution[4]).toBe(1);
  });

  it("updates maxWinStreak when winStreak exceeds it", async () => {
    const { GameLogManager } = await import("./GameLogManager");
    const mgr = new GameLogManager();
    mgr.updateWinCount("apple", 2);
    mgr.updateWinCount("crane", 3);
    expect(mgr.gameLog.maxWinStreak).toBe(2);
  });

  it("tracks solvedWords with the guess count", async () => {
    const { GameLogManager } = await import("./GameLogManager");
    const mgr = new GameLogManager();
    mgr.updateWinCount("apple", 5);
    expect(mgr.gameLog.solvedWords["apple"]).toBe(5);
  });

  it("updates solvedWords if solved again in fewer guesses", async () => {
    const { GameLogManager } = await import("./GameLogManager");
    const mgr = new GameLogManager();
    mgr.updateWinCount("apple", 5);
    mgr.updateWinCount("apple", 2);
    expect(mgr.gameLog.solvedWords["apple"]).toBe(2);
  });

  it("does not update solvedWords if solved again in more guesses", async () => {
    const { GameLogManager } = await import("./GameLogManager");
    const mgr = new GameLogManager();
    mgr.updateWinCount("apple", 2);
    mgr.updateWinCount("apple", 5);
    expect(mgr.gameLog.solvedWords["apple"]).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// Win streak milestone events
// ---------------------------------------------------------------------------

describe("GameLogManager — Win Streak Milestone events", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("fires a Win Streak Milestone GA event when winStreak reaches 3", async () => {
    const ReactGA = await import("react-ga4");
    const { GameLogManager } = await import("./GameLogManager");
    const mgr = new GameLogManager();
    mgr.updateWinCount("apple", 2);
    mgr.updateWinCount("crane", 3);
    mgr.updateWinCount("stove", 1);
    expect(mgr.gameLog.winStreak).toBe(3);
    expect(ReactGA.default.event).toHaveBeenCalledWith({
      category: "Achievement",
      action: "Win Streak Milestone",
      label: "3",
    });
  });

  it("does not fire a milestone event for non-milestone streak values", async () => {
    const ReactGA = await import("react-ga4");
    const { GameLogManager } = await import("./GameLogManager");
    const mgr = new GameLogManager();
    mgr.updateWinCount("apple", 2);
    // streak is 1 — not a milestone
    expect(ReactGA.default.event).not.toHaveBeenCalledWith(
      expect.objectContaining({ action: "Win Streak Milestone" })
    );
  });

  it("fires milestone events at each threshold (5, 10)", async () => {
    const ReactGA = await import("react-ga4");
    const { GameLogManager } = await import("./GameLogManager");
    const mgr = new GameLogManager();
    for (let i = 0; i < 10; i++) {
      mgr.updateWinCount(`word${i}`, 2);
    }
    expect(mgr.gameLog.winStreak).toBe(10);
    // Both streak=5 and streak=10 should have fired
    const milestoneCalls = (ReactGA.default.event as ReturnType<typeof vi.fn>).mock.calls.filter(
      (call: unknown[]) =>
        (call[0] as { action: string }).action === "Win Streak Milestone"
    );
    const labels = milestoneCalls.map(
      (call: unknown[]) => (call[0] as { label: string }).label
    );
    expect(labels).toContain("5");
    expect(labels).toContain("10");
  });
});

// ---------------------------------------------------------------------------
// Loss tracking
// ---------------------------------------------------------------------------

describe("GameLogManager — updateLossCount", () => {
  beforeEach(() => vi.resetModules());

  it("increments lossCount and resets winStreak", async () => {
    const { GameLogManager } = await import("./GameLogManager");
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
  beforeEach(() => vi.resetModules());

  it("stats persist when a new instance is created", async () => {
    const { GameLogManager } = await import("./GameLogManager");
    const mgr1 = new GameLogManager();
    mgr1.updateWinCount("apple", 3);
    mgr1.updateWinCount("crane", 1);

    vi.resetModules();
    const { GameLogManager: GameLogManager2 } = await import("./GameLogManager");
    const mgr2 = new GameLogManager2();
    expect(mgr2.gameLog.winCount).toBe(2);
    expect(mgr2.gameLog.winGuessCountDistribution[3]).toBe(1);
    expect(mgr2.gameLog.winGuessCountDistribution[1]).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Reset — intentionally failing test (BUG-C2 / BUG-M5)
// ---------------------------------------------------------------------------

describe("GameLogManager — resetGameLog", () => {
  beforeEach(() => vi.resetModules());

  it("[BUG-C2] resetGameLog should not mutate DefaultGameLog across instances", async () => {
    const { GameLogManager } = await import("./GameLogManager");

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
    vi.resetModules();
    const { GameLogManager: GameLogManager2 } = await import("./GameLogManager");
    const mgr2 = new GameLogManager2();

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
  beforeEach(() => vi.resetModules());

  it("[BUG-C3] returns a valid gameLog when localStorage contains garbage JSON", async () => {
    // Seed localStorage with invalid JSON before constructing the manager.
    localStorage.setItem(GAME_LOG_KEY, "{corrupt json{{");

    const { GameLogManager } = await import("./GameLogManager");

    // _getGameLog's catch block has no return statement, so this.gameLog becomes
    // undefined. The next method call will throw TypeError.
    expect(() => {
      const mgr = new GameLogManager();
      // Accessing any property triggers the latent crash
      void mgr.gameLog.gamesPlayed;
    }).not.toThrow();

    // Additionally, the manager should produce sensible defaults.
    vi.resetModules();
    const { GameLogManager: GameLogManager2 } = await import("./GameLogManager");
    const mgr = new GameLogManager2();
    expect(mgr.gameLog).not.toBeUndefined();
    expect(mgr.gameLog.gamesPlayed).toBe(0);
  });
});
