import React, { useEffect, useState } from "react";
import "./App.css";
import Modal from "./Modal";
import { guessWords, validWords } from "./wordList";
import { BackspaceIcon, BookOpenIcon } from "@heroicons/react/outline";
import Toast, { ToastTypes } from "./Toast";

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
  const [error, setError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  const [showFail, setShowFail] = useState<boolean>(false);
  const [openRulesModal, setOpenRulesModal] = useState<boolean>(false);
  const [openShareModal, setOpenShareModal] = useState<boolean>(false);
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

  useEffect(() => {
    if (showSuccess) {
      setOpenShareModal(true);
    }
  }, [showSuccess]);

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
      setError(true);
      setErrorMessage(`${guessedWord} is not a word!`);
    }
  };

  const validateWord = (guess: string) => {
    if (alreadyGuessed(guess)) {
      setError(true);
      setErrorMessage(`You already tried ${guess}.`);
      return;
    }

    guess.split("").forEach((letter, index) => {
      const letterSearch = (letterOption: LetterState) => letterOption.letter === letter;
      if (goalWord.indexOf(letter) >= 0) {
        guessArray[mapPointer[0]][index].containMatch = true;
        const letterOption = letterOptions.find(letterSearch);
        if (letterOption) {
          letterOption.containMatch = true;
        }

        if (goalWord.split("")[index] === letter) {
          guessArray[mapPointer[0]][index].positionMatch = true;
          const letterOption = letterOptions.find(letterSearch);
          if (letterOption) {
            letterOption.positionMatch = true;
          }
        }
      } else {
        const letterOption = letterOptions.find(letterSearch);
        if (letterOption) {
          guessArray[mapPointer[0]][index].noMatch = true;
          letterOption.noMatch = true;
          // Add difficulty
          // letterOption.disabled = true;
        }
      }
    });
    // Success
    if (guess === goalWord) {
      setShowSuccess(true);
      return;
    }
    // No success, next line
    if (mapPointer[0] < guessArray.length) {
      setMapPointer([mapPointer[0] + 1, 0]);
    }
    // Out of guess
    if (mapPointer[0] === guessArray.length - 1) {
      setShowFail(true);
      return;
    }
    setLetterOptions([...letterOptions]);
    setGuessArray([...guessArray]);
  };

  const alreadyGuessed = (guess: string): boolean => {
    return guessArray.slice(0, mapPointer[0]).some((row) => row.map((letter) => letter.letter).join("") === guess);
  };

  const clearError = () => {
    setErrorMessage("");
    setError(false);
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

  const generateShareText = (): string => {
    const rows = guessArray.filter((row) => !row.every((letter) => letter.letter === ""));
    let shareText = `Word Guess `;
    shareText += `${validWords.indexOf(goalWord.toLocaleLowerCase())} `;
    shareText += `${showFail ? "X" : rows.length}/6`;
    shareText += "\n\n";

    rows.forEach((row, index) => {
      row.forEach((letter, letterIndex) => {
        if (letter.noMatch && !letter.containMatch && !letter.positionMatch) {
          shareText += "⬛";
        } else if (letter.containMatch && !letter.positionMatch) {
          shareText += "🟨";
        } else if (letter.containMatch && letter.positionMatch) {
          shareText += "🟩";
        }
      });
      shareText += "\n";
    });

    return shareText;
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
              {error && <Toast type={ToastTypes.WARN} message={errorMessage} />}
              {showFail && <Toast type={ToastTypes.ERROR} message={`Sorry! The word was ${goalWord}`} />}
              {showSuccess && <Toast type={ToastTypes.SUCCESS} message={`Success! The word is ${goalWord}!`} />}
              <ul className="list-none flex flex-row space-x-4">
                {(showFail || showSuccess) && (
                  <li>
                    <div className="underline cursor-pointer" onClick={() => setOpenShareModal(true)}>
                      Share Results
                    </div>
                  </li>
                )}
                {(showFail || showSuccess) && (
                  <li>
                    <div className="underline cursor-pointer" onClick={() => window.location.reload()}>
                      Try another?
                    </div>
                  </li>
                )}
              </ul>
            </div>
            <div className="flex flex-row flex-wrap justify-center">
              {letterOptions.map((letter) => (
                <button key={letter.letter} onClick={() => onSelect(letter.letter)} value={letter.letter} className={`button letter-option ${determineLetterClass(letter)}`} disabled={letter.disabled || showSuccess || showFail}>
                  {letter.letter}
                </button>
              ))}
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
      {(showSuccess || showFail) && (
        <Modal open={openShareModal} setOpen={setOpenShareModal} title={`Success! The word is ${goalWord}`}>
          <div className="flex flex-col justify-center">
            <pre className="bg-slate-200 dark:bg-slate-800 px-4 py-2 rounded-md">{generateShareText()}</pre>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default App;
