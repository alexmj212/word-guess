import { LetterState } from "./App";
import { alphabet, emojiAlphabet } from "./wordList";

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
