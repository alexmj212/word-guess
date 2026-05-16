import utilities, { getPositionConstraints } from "./util";
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
