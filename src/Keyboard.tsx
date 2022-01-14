import React from "react";
import { LetterState } from "./App";
import utilities from "./util";

type KeyboardType = {
  letterOptions: LetterState[];
  onSelect: (letter: string) => void;
  disableCondition: (letter: LetterState) => boolean;
};

const Keyboard: React.FC<KeyboardType> = ({ letterOptions, onSelect, disableCondition }) => {
  return (
    <div className="flex flex-row flex-wrap justify-center">
      {letterOptions.map((letter) => (
        <button key={letter.letter} onClick={() => onSelect(letter.letter)} value={letter.letter} className={`button letter-option ${utilities.determineLetterClass(letter)}`} disabled={disableCondition(letter)}>
          {letter.letter}
        </button>
      ))}
    </div>
  );
};

export default Keyboard;
