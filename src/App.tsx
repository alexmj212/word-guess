import React, { useEffect, useState } from "react";
import "./App.css";
import Modal from "./Modal";
import { alphabet, guessWords, validWords } from "./wordList";
import { BackspaceIcon, BookOpenIcon, ChartBarIcon, CogIcon } from "@heroicons/react/outline";
import { useHotkeys } from "react-hotkeys-hook";

import Toast, { ToastTypes } from "./Toast";
import utilities from "./util";
import GuessDisplay from "./GuessDisplay";
import Keyboard from "./Keyboard";
import { GameLogManager } from "./GameLogManager";
import StatBlock from "./StatBlock";

export type LetterState = {
  letter: string;
  containMatch: boolean;
  positionMatch: boolean;
  noMatch: boolean;
  disabled: boolean;
};

function App() {
  // Game State
  const [guessMap, setGuessMap] = useState<LetterState[][]>([]); // array of guesses
  const [letterOptions, setLetterOptions] = useState<LetterState[]>([]); // keyboard
  const [mapPointer, setMapPointer] = useState<[number, number]>([0, 0]); // x,y coords of cursor
  const [puzzleNumber, setPuzzleNumber] = useState<number>(0);
  const [goalWord, setGoalWord] = useState<string>(""); // the solution

  // Control States
  const [disableSubmit, setDisableSubmit] = useState<boolean>(true);
  const [disableBackspace, setDisableBackspace] = useState<boolean>(true);

  // Message Handling
  const [error, setError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  const [showFail, setShowFail] = useState<boolean>(false);

  // Modals
  const [openRulesModal, setOpenRulesModal] = useState<boolean>(false);
  const [openShareModal, setOpenShareModal] = useState<boolean>(false);
  const [openStatsModal, setOpenStatsModal] = useState<boolean>(false);
  const [openSettingsModal, setOpenSettingsModal] = useState<boolean>(false);

  // Initialize Game Log Manager
  const gameLogManager = new GameLogManager();

  // Default Letter
  const blankLetter: LetterState = {
    letter: "",
    containMatch: false,
    positionMatch: false,
    noMatch: false,
    disabled: false,
  };

  useEffect(() => {
    // Generate guess map and keyboard
    generateEmptyGuessMap();
    generateAlphabet();

    // Show the rules on the first time
    setOpenRulesModal(gameLogManager.gameLog.gamesPlayed === 0 && gameLogManager.gameLog.guessCount === 0);

    // Select a goal word at random
    const randomWord = validWords[Math.floor(Math.random() * validWords.length)];
    setGoalWord(randomWord.toLocaleUpperCase());
    setPuzzleNumber(validWords.indexOf(randomWord));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // If the puzzle is solved or failed, disable further submissions
    if (showSuccess || showFail) {
      setDisableSubmit(true);
      setDisableBackspace(true);
    } else if (guessMap.length > 0 && mapPointer[0] >= 0 && mapPointer[0] < guessMap.length) {
      // Disable submit as long as the row doesn't have 5 letters or the puzzle was solved
      setDisableSubmit(!showSuccess && guessMap[mapPointer[0]].map((letter) => letter.letter).join("").length !== 5);
      // Disable backspace if there aren't any letters to remove yet
      setDisableBackspace(guessMap[mapPointer[0]].every((letter) => letter.letter === ""));
    }
  }, [guessMap, mapPointer, showSuccess, showFail]);

  useEffect(() => {
    // On solved puzzle, show the success modal
    if (showSuccess) {
      setOpenShareModal(true);
    }
  }, [showSuccess]);

  /**
   * Create map of empty guess rows
   */
  const generateEmptyGuessMap = () => {
    setGuessMap(
      [...Array(6).keys()].map(() => {
        return [blankLetter, blankLetter, blankLetter, blankLetter, blankLetter];
      })
    );
  };

  /**
   * Generate a blank keyboard
   */
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

  /**
   * Select a letter from the keyboard
   * @param letter
   */
  const onSelect = (letter: string) => {
    if (!(showFail || showSuccess) && guessMap[mapPointer[0]].some((e) => e.letter === "")) {
      guessMap[mapPointer[0]][mapPointer[1]] = {
        ...blankLetter,
        letter: letter,
      };
      setMapPointer([mapPointer[0], mapPointer[1] + 1]);
    }
  };

  /**
   * Remove the last letter from a guess
   */
  const onBackspace = () => {
    if (!disableBackspace && guessMap[mapPointer[0]].some((e) => e.letter !== "")) {
      guessMap[mapPointer[0]][mapPointer[1] - 1] = blankLetter;
      setMapPointer([mapPointer[0], mapPointer[1] - 1]);
    }
    clearError();
  };

  /**
   * Submit a completed word
   */
  const onSubmit = () => {
    if (!disableSubmit) {
      const guessedWord = guessMap[mapPointer[0]].map((letter) => letter.letter).join("");
      // Ensure the word is contained within all the possible words
      if (guessWords.includes(guessedWord.toLocaleLowerCase()) || validWords.includes(guessedWord.toLocaleLowerCase())) {
        validateWord(guessedWord);
      } else {
        gameLogManager.updateInvalidWordCount();
        setError(true);
        setErrorMessage(`${guessedWord} is not a word!`);
      }
    }
  };

  /**
   * Given a word, generate hints and update keyboard.
   * Display solved or failed puzzle.
   * @param guess
   * @returns
   */
  const validateWord = (guess: string) => {
    // Check if word has already been tried
    if (utilities.previousGuess(guess, guessMap, mapPointer)) {
      setError(true);
      setErrorMessage(`You already tried ${guess}.`);
      return;
    }

    gameLogManager.updateGuessCount();

    const guessMapRow = guessMap[mapPointer[0]];

    // Loop over array of letter from the guessed word
    guess.split("").forEach((letter, index) => {
      // Search method for finding keyboard letter to be updated
      const keyboardLetter = letterOptions.find((letterOption: LetterState) => letterOption.letter === letter) ?? blankLetter;

      const guessMapLetter = guessMapRow[index];

      // Check if letter is contained in goal word
      if (goalWord.indexOf(letter) >= 0) {
        guessMapLetter.noMatch = false;
        guessMapLetter.containMatch = true;

        // Update keyboard state
        keyboardLetter.containMatch = true;

        // Check if letter matches the position
        if (goalWord.split("")[index] === letter) {
          guessMapLetter.positionMatch = true;

          // Update keyboard state
          keyboardLetter.positionMatch = true;
        }
      } else {
        // Gray out letter from keyboard if no match is found for the letter
        guessMapLetter.noMatch = true;

        // Update keyboard state
        keyboardLetter.noMatch = true;
        // Add difficulty
        // keyboardLetter.disabled = true;
      }

      // Retroactively remove hints on duplicate letters
      const dupeLetterMatch = new RegExp(letter, "g"); // regex for finding occurances of the current letter
      const guessOccurenceCount = guess.match(dupeLetterMatch)?.length ?? 0; // count occurances of letter in guess word, 0 if none
      const goalOccurenceCount = goalWord.match(dupeLetterMatch)?.length ?? 0; // count occurances of letter in goal word, 0 if none
      // If the guess contains more occurances than the goal and it's not the first time the letter was guessed, remove hint
      if (guessOccurenceCount > goalOccurenceCount && guess.indexOf(letter) < index) {
        guessMapRow
          .filter((guessLetter, filterIndex) => letter === guessLetter.letter && filterIndex < index) // retrieve previous duplicate letters
          .forEach((guessLetter) => (guessLetter.containMatch = false)); // disable their hint
      }
      // If the guess already has a position match, hide hints for duplicate letter after
      if (guessOccurenceCount > goalOccurenceCount && guess.indexOf(letter) < index && guessMapRow.some((guessLetter) => letter === guessLetter.letter && guessLetter.positionMatch)) {
        guessMapLetter.containMatch = false;
      }
    });

    // Only check for success after the state of the letter is determined
    // This ensures displayed result is accurate

    // Success
    if (guess === goalWord) {
      gameLogManager.updateWinCount(guess, mapPointer[0] + 1);
      setShowSuccess(true);
      return;
    }

    // No success, next line
    if (mapPointer[0] < guessMap.length) {
      setMapPointer([mapPointer[0] + 1, 0]);
    }

    // Out of guesses
    if (mapPointer[0] === guessMap.length - 1) {
      gameLogManager.updateLossCount();
      setShowFail(true);
      return;
    }

    // Update keyboard
    setLetterOptions([...letterOptions]);

    // Update guess map
    setGuessMap([...guessMap]);
  };

  const clearError = () => {
    setErrorMessage("");
    setError(false);
  };

  // Handle keyboard input
  useHotkeys(alphabet.join(", "), (key) => onSelect(key.key.toLocaleUpperCase()), [onSelect]);
  useHotkeys("backspace", () => onBackspace(), [onBackspace]);
  useHotkeys("enter", () => onSubmit(), [onSubmit]);

  return (
    <div className="w-full h-full">
      <div className="w-full max-w-4xl mx-auto my-2 px-2 sm:my-4 sm:px-4">
        <div className="flex flex-row justify-between items-end border-b-2 pb-4">
          <h1 className="text-lg md:text-4xl font-bold">Word Guess #{puzzleNumber}</h1>
          <ul className="list-none flex flex-row space-x-4">
            <li>
              <button title="Stats" onClick={() => setOpenStatsModal(true)}>
                <ChartBarIcon className="w-8 h-8 inline-block" />
              </button>
            </li>
            <li>
              <button title="Rules" onClick={() => setOpenRulesModal(true)}>
                <BookOpenIcon className="w-8 h-8 inline-block" />
              </button>
            </li>
            <li>
              <button title="Settings" onClick={() => setOpenSettingsModal(true)}>
                <CogIcon className="w-8 h-8 inline-block" />
              </button>
            </li>
          </ul>
        </div>
        <div className="my-4 mx-auto flex flex-col justify-center">
          <div className="flex flex-row flex-wrap mb-4 justify-center space-x-4">
            <button className="underline" onClick={() => window.location.reload()}>
              Get a New Puzzle
            </button>
            <button
              className="underline"
              onClick={() => {
                if (!showFail) {
                  gameLogManager.updateForfeitCount();
                  clearError();
                  setShowFail(true);
                }
              }}
            >
              Forfeit Puzzle
            </button>
          </div>
          <GuessDisplay guessMap={guessMap} mapPointer={mapPointer} />
          <div className="flex flex-col">
            <div className="flex flex-col justify-center items-center h-20">
              {error && <Toast type={ToastTypes.WARN} message={errorMessage} />}
              {showFail && <Toast type={ToastTypes.ERROR} message={`Sorry! The word was ${goalWord}`} />}
              {showSuccess && <Toast type={ToastTypes.SUCCESS} message={`Success! The word is ${goalWord}!`} />}
              {(showFail || showSuccess) && (
                <ul className="list-none flex flex-row space-x-4">
                  <li>
                    <button className="underline" onClick={() => setOpenShareModal(true)}>
                      Share Results
                    </button>
                  </li>
                  <li>
                    <button className="underline" onClick={() => setOpenStatsModal(true)}>
                      View Your Stats
                    </button>
                  </li>
                  <li>
                    <button className="underline" onClick={() => window.location.reload()}>
                      Try another?
                    </button>
                  </li>
                </ul>
              )}
            </div>
            <Keyboard qwerty letterOptions={letterOptions} onSelect={onSelect} disableCondition={(letter) => letter.disabled || showSuccess || showFail} />
            <div className="flex flex-row flex-wrap justify-center">
              <button title="Backspace" className="button bg-red-400 dark:bg-red-700" onClick={onBackspace} disabled={showSuccess || showFail || disableBackspace}>
                <BackspaceIcon className="h-10 w-10" />
              </button>
              <button title="Guess Word" className={`button ${!disableSubmit ? "submit-button" : ""} bg-green-400 dark:bg-green-700`} onClick={onSubmit} disabled={disableSubmit}>
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
          <div className="flex flex-row items-center space-x-2">
            <div className="button w-10 h-10 no-match"> </div>
            <span>No letters match</span>
          </div>
          <div className="flex flex-row items-center space-x-2">
            <div className="button w-10 h-10 contain-match"> </div>
            <span>A letter is correct but in the wrong position</span>
          </div>
          <div className="flex flex-row items-center space-x-2">
            <div className="button w-10 h-10 position-match"> </div>
            <span>A letter is correct and in the right position</span>
          </div>
        </div>
      </Modal>
      <Modal open={openStatsModal} setOpen={setOpenStatsModal} title="Word Guess Statistics">
        <StatBlock gameLog={gameLogManager.gameLog} />
        <div className="w-full text-center mt-4">
          <button
            className="underline pointer-cursor"
            onClick={() => {
              gameLogManager.resetGameLog();
              window.location.reload();
            }}
          >
            Reset Statistics
          </button>
        </div>
      </Modal>
      {(showSuccess || showFail) && (
        <Modal open={openShareModal} setOpen={setOpenShareModal} title={`Success! The word is ${goalWord}`}>
          <div className="flex flex-col justify-center mb-4">
            <pre className="bg-slate-200 dark:bg-slate-800 px-4 py-2 rounded-md">{utilities.generateShareText(guessMap, puzzleNumber, showFail)}</pre>
          </div>
          <StatBlock gameLog={gameLogManager.gameLog} />
        </Modal>
      )}
      <Modal open={openSettingsModal} setOpen={setOpenSettingsModal} title="Settings">
        <div className="w-full text-center mt-4">
          <button
            className="underline pointer-cursor"
            onClick={() => {
              gameLogManager.resetGameLog();
              window.location.reload();
            }}
          >
            Reset Statistics
          </button>
        </div>
      </Modal>
    </div>
  );
}

export default App;
