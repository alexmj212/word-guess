import React from "react";
import { LetterState } from "./App";
import utilities from "./util";
import { alphabet, emojiAlphabet } from "./wordList";

type GuessDisplayType = {
  guessMap: LetterState[][];
  mapPointer: number[];
  showEmoji?: boolean;
};

const cursorDisplay = " ";

const GuessDisplay: React.FC<GuessDisplayType> = ({ guessMap, mapPointer, showEmoji }) => {
  const cursor = (row: number, index: number, letter: LetterState): string => {
    if (row === mapPointer[0] && index === mapPointer[1] && !letter.letter) {
      return cursorDisplay
    } else {
      return showEmoji ? utilities.generateEmojiString(letter.letter) : letter.letter;
    }
  };

  // Tailwind doesn't allow arbitrary strings as classes, they must be computing beforehand
  const delays = [
    "delay-[0ms]",
    "delay-[250ms]",
    "delay-[500ms]",
    "delay-[750ms]",
    "delay-[1000ms]",
  ];

  return (
    <div>
      {guessMap.map((guessRow, row) => (
        <div key={row} className="flex flex-row justify-center">
          {guessRow.map((letter: LetterState, index) => (
            <div key={row + index} className={`flip-card ${row < mapPointer[0] && "flipped"} guess-box`}>
              <div className={`flip-card-inner ${delays[index]}`}>
                <div className={`flip-card-front`}>{cursor(row, index, letter)}</div>
                <div className={`flip-card-back ${row < mapPointer[0] && !letter.containMatch && !letter.positionMatch ? "no-match" : ""} ${utilities.determineLetterClass(letter)} `}>{cursor(row, index, letter)}</div>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default GuessDisplay;
