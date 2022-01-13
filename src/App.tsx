import React, { useEffect, useState } from "react";
import "./App.css";
import Modal from "./Modal";
import { guessWords, validWords } from "./wordList";
import { BackspaceIcon, BookOpenIcon } from "@heroicons/react/outline";

type LetterState = {
  letter: string;
  containMatch: boolean;
  positionMatch: boolean;
  noMatch: boolean;
  disabled: boolean;
};

function App() {
  const alphabet = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];

  const [guessArray, setGuessArray] = useState<LetterState[][]>([]);
  const [letterOptions, setLetterOptions] = useState<LetterState[]>([]);
  const [mapPointer, setMapPointer] = useState<number[]>([0, 0]);
  const [disableSubmit, setDisableSubmit] = useState<boolean>(true);
  const [disableBackspace, setDisableBackspace] = useState<boolean>(true);
  const [goalWord, setGoalWord] = useState<string>("");
  const [guessedWord, setGuessedWord] = useState<string>("");
  const [showError, setShowError] = useState<boolean>(false);
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  const [showFail, setShowFail] = useState<boolean>(false);
  const [openRulesModal, setOpenRulesModal] = useState<boolean>(false);
  const blankLetter: LetterState = {
    letter: "",
    containMatch: false,
    positionMatch: false,
    noMatch: false,
    disabled: false,
  };

  useEffect(() => {
    generateEmptyGuessArray();
    generateAlphabet();
    setGoalWord(validWords[Math.floor(Math.random() * validWords.length)].toLocaleUpperCase());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (showSuccess || showFail) {
      setDisableSubmit(true);
    } else if (guessArray.length > 0 && mapPointer[0] >= 0 && mapPointer[0] < guessArray.length) {
      setDisableSubmit(!showSuccess && guessArray[mapPointer[0]].map((letter) => letter.letter).join("").length !== 5);
      setDisableBackspace(guessArray[mapPointer[0]].every((letter) => letter.letter === ""));
    }
  }, [guessArray, mapPointer, showSuccess, showFail]);

  const generateEmptyGuessArray = () => {
    setGuessArray(
      [...Array(6).keys()].map(() => {
        return [blankLetter, blankLetter, blankLetter, blankLetter, blankLetter];
      })
    );
  };

  const generateAlphabet = () => {
    setLetterOptions(
      alphabet.map((letter) => {
        return {
          ...blankLetter,
          letter: letter,
        };
      })
    );
  };

  const onSelect = (letter: string) => {
    if (guessArray[mapPointer[0]].some((e) => e.letter === "")) {
      guessArray[mapPointer[0]][mapPointer[1]] = {
        ...blankLetter,
        letter: letter,
      };
      setMapPointer([mapPointer[0], mapPointer[1] + 1]);
    } else {
      console.log("must submit");
    }
  };

  const onBackspace = () => {
    if (guessArray[mapPointer[0]].some((e) => e.letter !== "")) {
      guessArray[mapPointer[0]][mapPointer[1] - 1] = blankLetter;
      setMapPointer([mapPointer[0], mapPointer[1] - 1]);
    }
    clearError();
  };

  const onSubmit = () => {
    const guessedWord = guessArray[mapPointer[0]].map((letter) => letter.letter).join("");
    if (guessWords.includes(guessedWord.toLocaleLowerCase()) || validWords.includes(guessedWord.toLocaleLowerCase())) {
      validateWord(guessedWord);
    } else {
      setGuessedWord(guessedWord);
      setShowError(true);
    }
  };

  const validateWord = (guess: string) => {
    guess.split("").forEach((letter, index) => {
      if (goalWord.indexOf(letter) >= 0) {
        guessArray[mapPointer[0]][index].containMatch = true;
        const letterOption = letterOptions.find((letterOption: LetterState) => letterOption.letter === letter);
        if (letterOption) {
          letterOption.containMatch = true;
        }

        if (goalWord.split("")[index] === letter) {
          guessArray[mapPointer[0]][index].positionMatch = true;
          const letterOption = letterOptions.find((letterOption: LetterState) => letterOption.letter === letter);
          if (letterOption) {
            letterOption.positionMatch = true;
          }
        }
      } else {
        const letterOption = letterOptions.find((letterOption: LetterState) => letterOption.letter === letter);
        if (letterOption) {
          letterOption.noMatch = true;
        }
      }
    });
    if (guess === goalWord) {
      setShowSuccess(true);
      return;
    }
    if (mapPointer[0] < guessArray.length) {
      setMapPointer([mapPointer[0] + 1, 0]);
    }
    if (mapPointer[0] === guessArray.length - 1) {
      setShowFail(true);
      return;
    }
    setLetterOptions([...letterOptions]);
    setGuessArray([...guessArray]);
  };

  const clearError = () => {
    setGuessedWord("");
    setShowError(false);
  };

  const determineLetterClass = (letterState: LetterState) => {
    if (letterState.noMatch && !letterState.positionMatch && !letterState.containMatch) {
      return "no-match";
    } else if (letterState.containMatch && !letterState.positionMatch) {
      return "contain-match";
    } else if (letterState.containMatch && letterState.positionMatch) {
      return "position-match";
    } else {
      return "";
    }
  };

  return (
    <div className="w-full h-full">
      <div className="w-full max-w-4xl mx-auto my-2 px-2 sm:my-4 sm:px-4">
        <div className="flex flex-row justify-between items-end border-b-2 pb-4">
          <h1 className="text-lg md:text-4xl font-bold">Word Guess #{validWords.indexOf(goalWord.toLocaleLowerCase())}</h1>
          <ul>
            <li>
              <button title="Rules" onClick={() => setOpenRulesModal(true)}>
                <BookOpenIcon className="w-8 h-8 inline-block" />
              </button>
            </li>
          </ul>
        </div>
        <div className="my-4 mx-auto md:max-w-xl flex flex-col justify-center">
          <div className="flex flex-row flex-wrap mb-4 justify-center space-x-4">
            <button className="underline" onClick={() => window.location.reload()}>
              New Puzzle
            </button>
            <button className="underline" onClick={() => setShowFail(true)}>
              Reveal Word
            </button>
            <button className="underline" onClick={() => setOpenRulesModal(true)}>
              Rules
            </button>
          </div>
          <div>
            {guessArray.map((guessRow, row) => (
              <div key={row} className="flex flex-row justify-center">
                {guessRow.map((letter: LetterState, index) => (
                  <div key={row + index}>
                    <div className={`button guess-box letter ${row < mapPointer[0] && !letter.containMatch && !letter.positionMatch ? "no-match" : ""} ${determineLetterClass(letter)}`}>
                      {row === mapPointer[0] && index === mapPointer[1] && !letter.letter ? "___" : letter.letter}
                      <br />
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div className="flex flex-col">
            <div className="flex flex-col justify-center items-center h-20">
              {showError && <div className="button bg-yellow-400 dark:bg-yellow-700">{guessedWord} is not a word!</div>}
              {showFail && <div className="button bg-red-400 dark:bg-red-700">Sorry! The word was {goalWord}</div>}
              {showSuccess && <div className="button bg-green-400 dark:bg-green-700">Congrats! The word is {goalWord}!</div>}
              {(showFail || showSuccess) && (
                <div className="underline cursor-pointer" onClick={() => window.location.reload()}>
                  Try another?
                </div>
              )}
            </div>
            <div className="flex flex-row flex-wrap justify-center">
              {letterOptions.map((letter) => {
                return (
                  <button key={letter.letter} onClick={() => onSelect(letter.letter)} value={letter.letter} className={`button letter-option ${determineLetterClass(letter)}`} disabled={letter.disabled || showSuccess || showFail}>
                    {letter.letter}
                  </button>
                );
              })}
            </div>
            <div className="flex flex-row flex-wrap justify-center">
              <button className="button bg-red-400 dark:bg-red-700" onClick={onBackspace} disabled={showSuccess || showFail || disableBackspace}>
                <BackspaceIcon className="h-10 w-10" />
              </button>
              <button className="button bg-green-400 dark:bg-green-700" onClick={onSubmit} disabled={disableSubmit}>
                Guess Word
              </button>
            </div>
          </div>
        </div>
        <div className="border-t-2 mt-4 py-4 flex flex-row justify-between">
          <div>
            <a href="https://alexmj212.dev" className="underline">
              alexmj212.dev
            </a>
          </div>
          <div>
            <a href="https://www.github.com/alexmj212/word-guess" className="underline">
              Source
            </a>
          </div>
        </div>
      </div>
      <Modal open={openRulesModal} setOpen={setOpenRulesModal} title="Guess the Hidden Word!">
        <div className="flex flex-col">
          <ul className="list-disc list-inside">
            <li>The hidden word is 5 letters.</li>
            <li>Select letters to spell a word.</li>
            <li>Use "Guess Word" to see if you are correct.</li>
            <li>
              Use <BackspaceIcon className="h-6 w-6 inline-block" /> to remove letters from your guess.
            </li>
            <li>You will gets hints if your letters are in the hidden word.</li>
            <li>You have 6 tries to guess the word.</li>
            <li>Refresh the page to get a new puzzle.</li>
          </ul>
        </div>
        <div>
          <h2 className="text-lg font-bold leading-10">Hint Key</h2>
          <div className="flex flex-row items-center">
            <div className="button w-10 h-10 no-match"> </div> = No letters match
          </div>
          <div className="flex flex-row items-center">
            <div className="button w-10 h-10 contain-match"> </div> = A letter is correct but in the wrong position
          </div>
          <div className="flex flex-row items-center">
            <div className="button w-10 h-10 position-match"> </div> = A letter is correct and in the right position
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default App;
