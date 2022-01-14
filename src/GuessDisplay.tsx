import React from "react";
import { LetterState } from "./App";
import utilities from "./util";

type GuessDisplayType = {
  guessMap: LetterState[][];
  mapPointer: number[];
};

const GuessDisplay: React.FC<GuessDisplayType> = ({ guessMap, mapPointer }) => {
  return (
    <div>
      {guessMap.map((guessRow, row) => (
        <div key={row} className="flex flex-row justify-center">
          {guessRow.map((letter: LetterState, index) => (
            <div key={row + index}>
              <div className={`button guess-box letter ${row < mapPointer[0] && !letter.containMatch && !letter.positionMatch ? "no-match" : ""} ${utilities.determineLetterClass(letter)}`}>
                {row === mapPointer[0] && index === mapPointer[1] && !letter.letter ? "___" : letter.letter}
                <br />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default GuessDisplay;
