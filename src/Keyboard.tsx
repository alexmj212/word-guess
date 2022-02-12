import { BackspaceIcon } from "@heroicons/react/outline";
import React, { useEffect, useRef } from "react";
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
  const enterRef = useRef<HTMLDivElement>(null);

  qwerty ? letterOptions.sort((a, b) => qwertyKeyboard.indexOf(a.letter) - qwertyKeyboard.indexOf(b.letter)) : letterOptions.sort((a, b) => alphabet.indexOf(a.letter) - alphabet.indexOf(b.letter));

  useEffect(() => {
    if (enterRef.current) {
      enterRef.current.focus();
    }
  }, [enterRef, letterOptions]);

  return (
    <>
      <div ref={enterRef} className="flex flex-col justify-center w-full mx-auto">
        <div className="flex flex-row justify-center">
          {letterOptions.slice(0, 10).map((letter) => (
            <React.Fragment key={letter.letter}>
              <button onClick={() => onSelect(letter.letter)} value={letter.letter} title={letter.letter} className={`button letter-option qwerty-option ${utilities.determineLetterClass(letter)}`} disabled={disableSelect(letter)}>
                {letter.letter}
              </button>
            </React.Fragment>
          ))}
        </div>
        <div className="flex flex-row justify-center">
          {" "}
          {letterOptions.slice(10, 19).map((letter) => (
            <React.Fragment key={letter.letter}>
              <button onClick={() => onSelect(letter.letter)} value={letter.letter} title={letter.letter} className={`button letter-option qwerty-option ${utilities.determineLetterClass(letter)}`} disabled={disableSelect(letter)}>
                {letter.letter}
              </button>
            </React.Fragment>
          ))}
        </div>
        <div className="flex flex-row justify-center">
          {" "}
          <button title="Backspace" className="keyboard-action bg-red-400 dark:bg-red-700" onClick={onBackspace} disabled={disableBackspace}>
            <BackspaceIcon className="h-10 w-10" />
          </button>
          {letterOptions.slice(19, letterOptions.length).map((letter) => (
            <React.Fragment key={letter.letter}>
              <button onClick={() => onSelect(letter.letter)} value={letter.letter} title={letter.letter} className={`button letter-option qwerty-option ${utilities.determineLetterClass(letter)}`} disabled={disableSelect(letter)}>
                {letter.letter}
              </button>
            </React.Fragment>
          ))}
          <button title="Guess Word" className={` text-xl keyboard-action bg-green-400 dark:bg-green-700`} onClick={onSubmit} disabled={disableSubmit}>
            Enter
          </button>
        </div>
      </div>
    </>
  );
};

export default Keyboard;
