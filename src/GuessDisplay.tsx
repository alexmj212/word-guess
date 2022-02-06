import React from "react";
import { LetterState } from "./App";
import utilities from "./util";

type GuessDisplayType = {
  guessMap: LetterState[][];
  mapPointer: number[];
};

const cursorDisplay = "___";

const GuessDisplay: React.FC<GuessDisplayType> = ({ guessMap, mapPointer }) => {
  const cursor = (row: number, index: number, letter: LetterState): string => {
    return row === mapPointer[0] && index === mapPointer[1] && !letter.letter ? cursorDisplay : letter.letter;
  };

  return (
    <div>
      {guessMap.map((guessRow, row) => (
        <div key={row} className="flex flex-row justify-center">
          {guessRow.map((letter: LetterState, index) => (
            <div
              key={row + index}
              className={`${cursor(row, index, letter) === cursorDisplay ? "cursor" : "guess-box"} button  letter font-bold ${row < mapPointer[0] && !letter.containMatch && !letter.positionMatch ? "no-match" : ""} ${utilities.determineLetterClass(letter)} `}
            >
              {cursor(row, index, letter)}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default GuessDisplay;
