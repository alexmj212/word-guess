import { LetterState } from "./App";
import { alphabet, emojiAlphabet } from "./wordList";

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
