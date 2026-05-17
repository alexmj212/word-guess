import { LetterState } from "./App";
import { alphabet, emojiAlphabet } from "./wordList";

export type HintResult = {
  guessRow: LetterState[];       // updated row of 5 LetterStates
  letterOptions: LetterState[];  // updated keyboard array of 26
};

/**
 * Pure function that computes Wordle-style hints for a single guess.
 *
 * Replicates the logic from validateWord (App.tsx) exactly, but without
 * mutating its inputs. Returns new arrays for both the guess row and the
 * keyboard state.
 *
 * Duplicate-letter rules:
 *  - If the guess has more occurrences of a letter than the solution and
 *    this is not the first occurrence in the guess, retroactively clear
 *    containMatch on the earlier duplicate.
 *  - If a position match already exists for that letter elsewhere, suppress
 *    containMatch on the later duplicate.
 */
export const applyHints = (
  guess: string,
  solution: string,
  prevGuessRow: LetterState[],
  prevLetterOptions: LetterState[]
): HintResult => {
  // Deep-copy inputs so we never mutate the originals
  const guessRow: LetterState[] = prevGuessRow.map((l) => ({ ...l }));
  const letterOptions: LetterState[] = prevLetterOptions.map((l) => ({ ...l }));

  guess.split("").forEach((letter, index) => {
    const keyboardLetter =
      letterOptions.find((lo) => lo.letter === letter) ?? { ...prevLetterOptions[0] };

    const guessMapLetter = guessRow[index];

    if (solution.indexOf(letter) >= 0) {
      guessMapLetter.noMatch = false;
      guessMapLetter.containMatch = true;

      keyboardLetter.containMatch = true;

      if (solution.split("")[index] === letter) {
        guessMapLetter.positionMatch = true;
        keyboardLetter.positionMatch = true;
      }
    } else {
      guessMapLetter.noMatch = true;
      keyboardLetter.noMatch = true;
      keyboardLetter.disabled = true;
    }

    // Retroactively remove hints on duplicate letters
    const dupeLetterMatch = new RegExp(letter, "g");
    const guessOccurenceCount = guess.match(dupeLetterMatch)?.length ?? 0;
    const goalOccurenceCount = solution.match(dupeLetterMatch)?.length ?? 0;

    if (guessOccurenceCount > goalOccurenceCount && guess.indexOf(letter) < index) {
      guessRow
        .filter(
          (guessLetter, filterIndex) =>
            letter === guessLetter.letter && filterIndex < index
        )
        .forEach((guessLetter) => (guessLetter.containMatch = false));
    }

    if (
      guessOccurenceCount > goalOccurenceCount &&
      guess.indexOf(letter) < index &&
      guessRow.some(
        (guessLetter) => letter === guessLetter.letter && guessLetter.positionMatch
      )
    ) {
      guessMapLetter.containMatch = false;
    }
  });

  return { guessRow, letterOptions };
};

export type PositionConstraint = {
  index: number;
  requiredLetter: string;
};

/**
 * Returns an array of position constraints (green / position-matched letters)
 * from all completed rows up to mapPointer[0].
 * The result is deduplicated — only the first occurrence at each index is kept,
 * since every row that reaches this point has already passed the same validation.
 */
export const getPositionConstraints = (
  guessMap: LetterState[][],
  mapPointer: [number, number]
): PositionConstraint[] => {
  const seen = new Map<number, string>();
  guessMap.slice(0, mapPointer[0]).forEach((row) => {
    row.forEach((letter, index) => {
      if (letter.positionMatch && !seen.has(index)) {
        seen.set(index, letter.letter);
      }
    });
  });
  return Array.from(seen.entries()).map(([index, requiredLetter]) => ({
    index,
    requiredLetter,
  }));
};

const utilities = {
  determineLetterClass: (letterState: LetterState) => {
    if (
      letterState.noMatch &&
      !letterState.positionMatch &&
      !letterState.containMatch
    ) {
      return "no-match";
    } else if (letterState.containMatch && !letterState.positionMatch) {
      return "contain-match";
    } else if (letterState.positionMatch) {
      return "position-match";
    } else {
      return "";
    }
  },
  generateShareText: (
    guessArray: LetterState[][],
    puzzleNumber: number,
    fail = false
  ): string => {
    const rows = guessArray.filter(
      (row) => !row.every((letter) => letter.letter === "")
    );
    let shareText = `Word Guess `;
    shareText += `${puzzleNumber} `;
    shareText += `${fail ? "X" : rows.length}/6`;
    shareText += "\n\n";

    rows.forEach((row) => {
      row.forEach((letter) => {
        if (!letter.containMatch && !letter.positionMatch) {
          shareText += "⬛";
        } else if (letter.containMatch && !letter.positionMatch) {
          shareText += "🟨";
        } else if (letter.positionMatch) {
          shareText += "🟩";
        }
      });
      shareText += "\n";
    });

    return shareText;
  },
  previousGuess: (
    guess: string,
    guessArray: LetterState[][],
    mapPointer: number[]
  ): boolean => {
    return guessArray
      .slice(0, mapPointer[0])
      .some((row) => row.map((letter) => letter.letter).join("") === guess);
  },
  generateEmojiString: (word: string): string => {
    return word
      .split("")
      .map((letter) => emojiAlphabet[alphabet.indexOf(letter)])
      .join("");
  },
};

export default utilities;
