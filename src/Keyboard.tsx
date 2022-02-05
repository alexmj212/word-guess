import { BackspaceIcon } from "@heroicons/react/outline";
import React from "react";
import { LetterState } from "./App";
import utilities from "./util";
import { alphabet, qwertyKeyboard } from "./wordList";

type KeyboardType = {
  letterOptions: LetterState[];
  qwerty?: boolean;
  onSelect: (letter: string) => void;
  disableSelect: (letter: LetterState) => boolean;
  onSubmit: () => void;
  disableSubmit: boolean;
  onBackspace: () => void;
  disableBackspace: boolean;
};

const Keyboard: React.FC<KeyboardType> = ({ letterOptions, qwerty, onSelect, disableSelect, onSubmit, disableSubmit, onBackspace, disableBackspace }) => {
  qwerty ? letterOptions.sort((a, b) => qwertyKeyboard.indexOf(a.letter) - qwertyKeyboard.indexOf(b.letter)) : letterOptions.sort((a, b) => alphabet.indexOf(a.letter) - alphabet.indexOf(b.letter));

  return (
    <>
      <div className="flex flex-row flex-wrap justify-center">
        {letterOptions.map((letter, index) => (
          <React.Fragment key={letter.letter}>
            <button onClick={() => onSelect(letter.letter)} value={letter.letter} title={letter.letter} className={`button letter-option qwerty-option ${utilities.determineLetterClass(letter)}`} disabled={disableSelect(letter)}>
              {letter.letter}
            </button>
            {qwerty ? (index === 9 || index === 18) && <div className="flex-break"></div> : index % 10 === 9 && <div className="flex-break"></div>}
          </React.Fragment>
        ))}
      </div>
      <div className="flex flex-row flex-wrap justify-center">
        <button title="Backspace" className="button bg-red-400 dark:bg-red-700" onClick={onBackspace} disabled={disableBackspace}>
          <BackspaceIcon className="h-10 w-10" />
        </button>
        <button title="Guess Word" className={`button-action`} onClick={onSubmit} disabled={disableSubmit}>
          Guess Word
        </button>
      </div>
    </>
  );
};

export default Keyboard;
