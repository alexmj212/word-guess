import React, { useEffect, useState } from "react";
import "./App.css";
import { guessWords, validWords } from "./wordList";

type LetterState = {
  letter: string;
  containMatch: boolean;
  positionMatch: boolean;
};

function App() {
  const alphabet = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];

  const [guessArray, setGuessArray] = useState<LetterState[][]>([]);
  const [mapPointer, setMapPointer] = useState<number[]>([0, 0]);
  const [disableSubmit, setDisableSubmit] = useState<boolean>(true);
  const [goalWord, setGoalWord] = useState<string>("");
  const [guessedWord, setGuessedWord] = useState<string>("");
  const [showError, setShowError] = useState<boolean>(false);
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  const [showFail, setShowFail] = useState<boolean>(false);
  const blankLetter: LetterState = {
    letter: "",
    containMatch: false,
    positionMatch: false,
  };

  useEffect(() => {
    generateEmptyGuessArray();
    setGoalWord(validWords[Math.floor(Math.random() * validWords.length)].toLocaleUpperCase());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (showSuccess || showFail) {
      setDisableSubmit(true);
    } else if (guessArray.length > 0 && mapPointer[0] >= 0 && mapPointer[0] < guessArray.length) {
      setDisableSubmit(!showSuccess && guessArray[mapPointer[0]].map((letter) => letter.letter).join("").length !== 5);
    }
  }, [guessArray, mapPointer, showSuccess]);

  const generateEmptyGuessArray = () => {
    setGuessArray(
      [...Array(6).keys()].map(() => {
        return [blankLetter, blankLetter, blankLetter, blankLetter, blankLetter];
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

        if (goalWord.split("")[index] === letter) {
          guessArray[mapPointer[0]][index].positionMatch = true;
        }
      }
    });
    if (guess === goalWord) {
      setShowSuccess(true);
    }
    if (mapPointer[0] < guessArray.length) {
      setMapPointer([mapPointer[0] + 1, 0]);
    }
    if (mapPointer[0] === guessArray.length - 1) {
      setShowFail(true);
    }
    setGuessArray([...guessArray]);
  };

  const clearError = () => {
    setGuessedWord("");
    setShowError(false);
  };

  return (
    <div className="w-full h-full">
      <div className="w-full max-w-4xl mx-auto my-8 px-4">
        <h1 className="text-4xl">
          Word Guess Puzzle #{validWords.indexOf(goalWord.toLocaleLowerCase())}
        </h1>
        <div className="my-4">
          <div className="flex flex-col">
            <div className="flex flex-row flex-wrap mb-4">
              {alphabet.map((letter) => {
                return (
                  <button key={letter} onClick={() => onSelect(letter)} value={letter} className="button letter-option" disabled={showSuccess || showFail}>
                    {letter}
                  </button>
                );
              })}
              <button className="button bg-red-400 dark:bg-red-700" onClick={onBackspace} disabled={showSuccess || showFail}>
                Backspace
              </button>
              <button className="button bg-green-400 dark:bg-green-700" onClick={onSubmit} disabled={disableSubmit}>
                Guess Word
              </button>
            </div>
            <div className="flex flex-col items-center mx-auto">
              {showError && <div className="button bg-yellow-400 dark:bg-yellow-700">{guessedWord} is not a word!</div>}
              {showFail && <div className="button bg-red-400 dark:bg-red-700">Sorry! The word was {goalWord}</div>}
              {showSuccess && <div className="button bg-green-400 dark:bg-green-700">Congrats! The word is {goalWord}!</div>}
              {(showFail || showSuccess) && (
                <div className="underline cursor-pointer" onClick={() => window.location.reload()}>
                  Try another?
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-col justify-center">
          <div>
            {guessArray.map((guessRow, row) => (
              <div key={row} className="flex flex-row justify-center">
                {guessRow.map((letter: LetterState, index) => (
                  <div key={row + index}>
                    <div
                      className={`button guess-box letter ${row < mapPointer[0] && !letter.containMatch && !letter.positionMatch ? "no-match" : ""} ${letter.containMatch && !letter.positionMatch ? "contain-match" : ""} ${
                        letter.containMatch && letter.positionMatch ? "position-match" : ""
                      } `}
                    >
                      {row === mapPointer[0] && index === mapPointer[1] && !letter.letter ? "___" : letter.letter}
                      <br />
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
