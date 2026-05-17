import utilities, { applyHints, getPositionConstraints } from "./util";
import { LetterState } from "./App";
import { alphabet, emojiAlphabet } from "./wordList";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeLetter = (overrides: Partial<LetterState> = {}): LetterState => ({
  letter: "",
  containMatch: false,
  positionMatch: false,
  noMatch: false,
  disabled: false,
  ...overrides,
});

/** Build a full 6×5 guessMap (all blank by default). */
const blankMap = (): LetterState[][] =>
  Array.from({ length: 6 }, () => Array.from({ length: 5 }, () => makeLetter()));

/** Fill row `rowIndex` with the supplied 5-char string. */
const fillRow = (
  map: LetterState[][],
  rowIndex: number,
  word: string
): void => {
  word.split("").forEach((ch, i) => {
    map[rowIndex][i] = makeLetter({ letter: ch });
  });
};

// ---------------------------------------------------------------------------
// getPositionConstraints
// ---------------------------------------------------------------------------

describe("getPositionConstraints", () => {
  it("returns an empty array when there are no completed rows", () => {
    const map = blankMap();
    // mapPointer[0] === 0 means no rows have been submitted yet
    expect(getPositionConstraints(map, [0, 0])).toEqual([]);
  });

  it("returns a constraint for a single position match in one row", () => {
    const map = blankMap();
    // Row 0: letter A at index 2 is a position match
    map[0][2] = makeLetter({ letter: "A", positionMatch: true });
    // Pointer is on row 1, so row 0 is completed
    const constraints = getPositionConstraints(map, [1, 0]);
    expect(constraints).toHaveLength(1);
    expect(constraints[0]).toEqual({ index: 2, requiredLetter: "A" });
  });

  it("returns constraints for multiple position matches across rows", () => {
    const map = blankMap();
    map[0][0] = makeLetter({ letter: "C", positionMatch: true });
    map[1][4] = makeLetter({ letter: "E", positionMatch: true });
    // Pointer on row 2 — rows 0 and 1 are completed
    const constraints = getPositionConstraints(map, [2, 0]);
    expect(constraints).toHaveLength(2);
    expect(constraints.find((c) => c.index === 0)).toEqual({ index: 0, requiredLetter: "C" });
    expect(constraints.find((c) => c.index === 4)).toEqual({ index: 4, requiredLetter: "E" });
  });

  it("returns an empty array when no letters are position-matched", () => {
    const map = blankMap();
    // Row 0: all contain matches, no position matches
    map[0] = map[0].map((_, i) =>
      makeLetter({ letter: String.fromCharCode(65 + i), containMatch: true })
    );
    const constraints = getPositionConstraints(map, [1, 0]);
    expect(constraints).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// previousGuess
// ---------------------------------------------------------------------------

describe("utilities.previousGuess", () => {
  it("returns false when no rows have been guessed (pointer at row 0)", () => {
    const map = blankMap();
    fillRow(map, 0, "CRANE");
    // mapPointer[0] = 0 → slice(0,0) is empty
    expect(utilities.previousGuess("CRANE", map, [0, 0])).toBe(false);
  });

  it("returns true when the word appears in a completed row", () => {
    const map = blankMap();
    fillRow(map, 0, "CRANE");
    // pointer is now on row 1
    expect(utilities.previousGuess("CRANE", map, [1, 0])).toBe(true);
  });

  it("returns false when the word has not been guessed before", () => {
    const map = blankMap();
    fillRow(map, 0, "CRANE");
    expect(utilities.previousGuess("APPLE", map, [1, 0])).toBe(false);
  });

  it("only searches rows before the current pointer row", () => {
    const map = blankMap();
    fillRow(map, 0, "CRANE");
    fillRow(map, 1, "APPLE");
    // pointer at row 1 → only row 0 has been submitted
    expect(utilities.previousGuess("APPLE", map, [1, 0])).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// generateShareText
// ---------------------------------------------------------------------------

describe("utilities.generateShareText", () => {
  it("includes the puzzle number and row count on a win", () => {
    const map = blankMap();
    // Mark row 0 with a position match so it is not treated as blank
    map[0] = map[0].map((l, i) =>
      i === 0 ? makeLetter({ letter: "A", positionMatch: true }) : makeLetter({ letter: "X" })
    );

    const text = utilities.generateShareText(map, 42);
    expect(text).toContain("42");
    expect(text).toContain("1/6");
  });

  it("shows X/6 on a loss", () => {
    const map = blankMap();
    map[0] = map[0].map(() => makeLetter({ letter: "A" }));

    const text = utilities.generateShareText(map, 1, true);
    expect(text).toContain("X/6");
  });

  it("skips blank rows in the output", () => {
    const map = blankMap();
    // Only row 0 has content
    map[0] = map[0].map(() => makeLetter({ letter: "A" }));

    const text = utilities.generateShareText(map, 1);
    const lines = text.trim().split("\n").filter((l) => l.length > 0);
    // header + 1 emoji row
    expect(lines).toHaveLength(2);
  });

  it("emits correct emojis for no-match, contain-match, and position-match", () => {
    const map = blankMap();
    map[0] = [
      makeLetter({ letter: "A" }),                             // no match → ⬛
      makeLetter({ letter: "B", containMatch: true }),         // contain → 🟨
      makeLetter({ letter: "C", positionMatch: true }),        // position → 🟩
      makeLetter({ letter: "D" }),
      makeLetter({ letter: "E" }),
    ];

    const text = utilities.generateShareText(map, 1);
    expect(text).toContain("⬛");
    expect(text).toContain("🟨");
    expect(text).toContain("🟩");
  });
});

// ---------------------------------------------------------------------------
// generateEmojiString
// ---------------------------------------------------------------------------

describe("utilities.generateEmojiString", () => {
  it("maps each letter to its emoji equivalent", () => {
    const word = "AB";
    const result = utilities.generateEmojiString(word);
    expect(result).toBe(
      emojiAlphabet[alphabet.indexOf("A")] + emojiAlphabet[alphabet.indexOf("B")]
    );
  });

  it("returns an empty string for an empty word", () => {
    expect(utilities.generateEmojiString("")).toBe("");
  });

  it("(nit-N1) silently drops characters not in the alphabet (indexOf returns -1, maps to undefined)", () => {
    // emojiAlphabet[-1] === undefined; join() converts undefined to ""
    // This documents the silent-drop behaviour described in the review (N1).
    const result = utilities.generateEmojiString("1");
    // The result should not throw, but "1" is not in alphabet so we get ""
    expect(result).toBe("");
  });
});

// ---------------------------------------------------------------------------
// applyHints
// ---------------------------------------------------------------------------

/**
 * Build a keyboard LetterState array with all 26 letters in their default
 * (unguessed) state. Mirrors DefaultLetterOptions from GameStateManager.
 */
const makeKeyboard = (): LetterState[] =>
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((ch) =>
    makeLetter({ letter: ch })
  );

/** Build a 5-letter guess row with blank LetterStates for each char in `word`. */
const makeGuessRow = (word: string): LetterState[] =>
  word.split("").map((ch) => makeLetter({ letter: ch }));

describe("applyHints", () => {
  it("marks every cell positionMatch when guess === solution", () => {
    const guess = "CRANE";
    const solution = "CRANE";
    const { guessRow, letterOptions } = applyHints(
      guess,
      solution,
      makeGuessRow(guess),
      makeKeyboard()
    );

    guessRow.forEach((cell) => {
      expect(cell.positionMatch).toBe(true);
      expect(cell.containMatch).toBe(true);
      expect(cell.noMatch).toBe(false);
    });

    // Keyboard letters for C, R, A, N, E should be positionMatch
    ["C", "R", "A", "N", "E"].forEach((ch) => {
      const kl = letterOptions.find((l) => l.letter === ch);
      expect(kl?.positionMatch).toBe(true);
    });
  });

  it("marks every cell noMatch when guess shares no letters with solution", () => {
    const guess = "STINK";
    const solution = "GRAVY";
    const { guessRow, letterOptions } = applyHints(
      guess,
      solution,
      makeGuessRow(guess),
      makeKeyboard()
    );

    guessRow.forEach((cell) => {
      expect(cell.noMatch).toBe(true);
      expect(cell.containMatch).toBe(false);
      expect(cell.positionMatch).toBe(false);
    });

    ["S", "T", "I", "N", "K"].forEach((ch) => {
      const kl = letterOptions.find((l) => l.letter === ch);
      expect(kl?.noMatch).toBe(true);
      expect(kl?.disabled).toBe(true);
    });
  });

  it("handles a mixed guess with containMatch and positionMatch", () => {
    // CRANE vs TRACE: C is contain, R is position(1), A is position(2), N is no, E is contain
    // Solution TRACE: T=0,R=1,A=2,C=3,E=4
    // Guess   CRANE: C=0,R=1,A=2,N=3,E=4
    const guess = "CRANE";
    const solution = "TRACE";
    const { guessRow } = applyHints(
      guess,
      solution,
      makeGuessRow(guess),
      makeKeyboard()
    );

    // C is in TRACE but not at index 0 → containMatch
    expect(guessRow[0].containMatch).toBe(true);
    expect(guessRow[0].positionMatch).toBe(false);
    // R is at index 1 in both → positionMatch
    expect(guessRow[1].positionMatch).toBe(true);
    // A is at index 2 in both → positionMatch
    expect(guessRow[2].positionMatch).toBe(true);
    // N is not in TRACE → noMatch
    expect(guessRow[3].noMatch).toBe(true);
    expect(guessRow[3].containMatch).toBe(false);
    // E is in TRACE but at index 4 (matches!) → positionMatch
    expect(guessRow[4].positionMatch).toBe(true);
  });

  it("clears containMatch on earlier duplicate when guess has more occurrences than solution", () => {
    // Solution has one L; guess has two L's.
    // LLAMA vs LLANO is not the cleanest — use LLANO vs ALONE
    // Actually keep it clear: solution=BLAND, guess=LLAMA
    // L appears twice in guess, once in solution.
    // Index 0: L — is in BLAND, containMatch=true
    // Index 1: L — is in BLAND but guessOccurrenceCount(2) > goalOccurrenceCount(1)
    //            and index(0) is first occurrence → retroactively clear containMatch on [0]
    const guess = "LLAMA";
    const solution = "BLAND";
    const { guessRow } = applyHints(
      guess,
      solution,
      makeGuessRow(guess),
      makeKeyboard()
    );

    // First L: initially gets containMatch, but second L should retroactively clear it
    expect(guessRow[0].containMatch).toBe(false);
    // Second L: containMatch cleared by position-match suppression or just the dup rule
    // L is not a positionMatch anywhere (solution: B=0,L=1,A=2,N=3,D=4; guess L at 0 and 1)
    // Guess[1] = L at index 1, solution[1] = L → positionMatch!
    expect(guessRow[1].positionMatch).toBe(true);
    // A at index 2 matches solution A at index 2 → positionMatch
    expect(guessRow[2].positionMatch).toBe(true);
    // M is not in BLAND → noMatch
    expect(guessRow[3].noMatch).toBe(true);
    // A at index 4, A already positionMatched at index 2; solution has one A → dup suppression
    expect(guessRow[4].containMatch).toBe(false);
  });

  it("marks both duplicate letters when solution also has two occurrences", () => {
    // Both guess and solution have LL at same positions
    const guess = "LLANO";
    const solution = "LLANO";
    const { guessRow } = applyHints(
      guess,
      solution,
      makeGuessRow(guess),
      makeKeyboard()
    );

    // Both L's should be positionMatch because solution also has LL
    expect(guessRow[0].positionMatch).toBe(true);
    expect(guessRow[1].positionMatch).toBe(true);
    // All others too
    expect(guessRow[2].positionMatch).toBe(true);
    expect(guessRow[3].positionMatch).toBe(true);
    expect(guessRow[4].positionMatch).toBe(true);
  });

  it("positionMatch takes precedence — containMatch is also set when positionMatch is set", () => {
    // Per the code: positionMatch implies containMatch=true was already set above it
    const guess = "APPLE";
    const solution = "APPLE";
    const { guessRow } = applyHints(
      guess,
      solution,
      makeGuessRow(guess),
      makeKeyboard()
    );

    // Every letter: containMatch AND positionMatch should be true
    guessRow.forEach((cell) => {
      expect(cell.positionMatch).toBe(true);
      expect(cell.containMatch).toBe(true);
    });
  });

  it("suppresses containMatch on later duplicate when a positionMatch already exists for that letter", () => {
    // solution=ABBEY, guess=ADDED
    // A appears at index 0 in both → positionMatch
    // D appears twice in guess (index 1 and 2), once in solution (index 3)
    // D at index 1: in solution → containMatch; but later when we process D at index 2:
    //   guessOccurrenceCount(2) > goalOccurrenceCount(1) and first occurrence is index 1
    //   → retroactively clear containMatch on guessRow[1]
    // Use a cleaner example: solution=BANAL, guess=LLANO
    // Actually use: solution=SIREN, guess=SISSY
    // S at 0: in SIREN at 4 → containMatch; S at 1: dup suppression clears guessRow[0]
    // Use: solution=EATEN, guess=TEETH
    // E: solution has E at 0 and 3 (E_T_E_N → EATEN: E=0,A=1,T=2,E=3,N=4)
    // guess TEETH: T=0,E=1,E=2,T=3,H=4
    // T at 0: solution[2]=T containMatch; solution has 1 T, guess has 2 T → dup
    //   When processing T at index 3: retroactive clear on guessRow[0].containMatch
    //   AND positionMatch exists for T at index 2? No, T at index 3 in guess, solution[3]=E not T
    // Simplify: solution=TERSE, guess=TEETH
    // TERSE: T=0,E=1,R=2,S=3,E=4
    // TEETH: T=0,E=1,E=2,T=3,H=4
    // T at 0: solution[0]=T → positionMatch
    // T at 3: guessOccurrence(2) > goalOccurrence(1), first T at index 0 which is positionMatch
    //         → containMatch on guessRow[3] should be suppressed
    const guess = "TEETH";
    const solution = "TERSE";
    const { guessRow } = applyHints(
      guess,
      solution,
      makeGuessRow(guess),
      makeKeyboard()
    );

    // T at index 0: positionMatch
    expect(guessRow[0].positionMatch).toBe(true);
    // E at index 1: solution[1]=E → positionMatch
    expect(guessRow[1].positionMatch).toBe(true);
    // E at index 2: solution has 2 E's (indices 1,4). guessOccurrence of E=2, goalOccurrence=2 → no dup suppression
    // solution[2]=R ≠ E → containMatch only
    expect(guessRow[2].containMatch).toBe(true);
    expect(guessRow[2].positionMatch).toBe(false);
    // T at index 3: solution has 1 T, guess has 2 T → dup suppression. positionMatch exists (index 0)
    //   → guessRow[3].containMatch should be false
    expect(guessRow[3].containMatch).toBe(false);
    // H not in solution → noMatch
    expect(guessRow[4].noMatch).toBe(true);
  });

  it("does not mutate the prevGuessRow input (shallow + element level)", () => {
    const guess = "CRANE";
    const solution = "TRACE";
    const origRow = makeGuessRow(guess);
    const origRowRef = origRow;
    const origElements = origRow.map((el) => ({ ...el }));

    applyHints(guess, solution, origRow, makeKeyboard());

    // Same reference
    expect(origRow).toBe(origRowRef);
    // Elements unchanged
    origRow.forEach((cell, i) => {
      expect(cell).toEqual(origElements[i]);
    });
  });

  it("does not mutate the prevLetterOptions input (shallow + element level)", () => {
    const guess = "CRANE";
    const solution = "TRACE";
    const origKb = makeKeyboard();
    const origKbRef = origKb;
    const origElements = origKb.map((el) => ({ ...el }));

    applyHints(guess, solution, makeGuessRow(guess), origKb);

    expect(origKb).toBe(origKbRef);
    origKb.forEach((cell, i) => {
      expect(cell).toEqual(origElements[i]);
    });
  });
});
