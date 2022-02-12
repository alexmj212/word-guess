import React, { useEffect, useState } from "react";

import { BackspaceIcon, BookOpenIcon, ChartBarIcon, CogIcon } from "@heroicons/react/outline";
import { RadioGroup } from "@headlessui/react";
import { useHotkeys } from "react-hotkeys-hook";
import "react-toastify/dist/ReactToastify.min.css";
import "./App.css";
import logo from "./word-guess-logo.png";
import Modal from "./Modal";
import { alphabet, guessWords, validWords } from "./wordList";
import Toast, { ToastTypes } from "./Toast";
import utilities from "./util";
import GuessDisplay from "./GuessDisplay";
import Keyboard from "./Keyboard";
import { GameLogManager } from "./GameLogManager";
import StatBlock from "./StatBlock";
import { DefaultLetter, difficultyDescriptions, DifficultyOptions, GameState, GameStateManager, TODAYS_GAME_STATE_KEY } from "./GameStateManager";
import ConfirmationModalContextProvider from "./ConfirmationDialogContext";
import { ButtonWithConfirmation } from "./ButtonWithConfirmation";
import { RadioWithConfirmation } from "./RadioWithConfirmation";
import { Slide, toast, ToastContainer } from "react-toastify";

export type LetterState = {
  letter: string;
  containMatch: boolean;
  positionMatch: boolean;
  noMatch: boolean;
  disabled: boolean;
};

export const THEME_STORAGE_KEY = "theme";
export const KEYBOARD_STORAGE_KEY = "keyboard";
export const DIFFICULTY_KEY = "difficulty";
export const PUZZLE_TYPE_KEY = "puzzle-type";

export enum ThemeOptions {
  DARK = "dark",
  LIGHT = "light",
}

export enum KeyboardState {
  ALPHEBET = "alphabet",
  QWERTY = "qwerty",
}

export enum PuzzleType {
  RANDOM = "random",
  TODAY = "today",
}

function App() {
  // Game State
  const [guessMap, setGuessMap] = useState<LetterState[][]>([]); // array of guesses
  const [letterOptions, setLetterOptions] = useState<LetterState[]>([]); // keyboard
  const [mapPointer, setMapPointer] = useState<[number, number]>([0, 0]); // x,y coords of cursor
  const [puzzleNumber, setPuzzleNumber] = useState<number>(0); // in the index of the puzzle from the array of solutions
  const [solution, setSolution] = useState<string>(""); // the solution
  const [difficulty, setDifficulty] = useState<DifficultyOptions>(DifficultyOptions.NORMAL); // the game difficulty

  const [todaysPuzzle, setTodaysPuzzle] = useState<number>(0);
  const currentDate = new Date();

  // Control States
  const [disableSubmit, setDisableSubmit] = useState<boolean>(true);
  const [disableBackspace, setDisableBackspace] = useState<boolean>(true);

  // Display State
  const [keyboardDisplay, setKeyboardDisplay] = useState<KeyboardState>((localStorage.getItem(KEYBOARD_STORAGE_KEY) as KeyboardState) || KeyboardState.QWERTY);
  const [theme, setTheme] = useState<ThemeOptions>((localStorage.getItem(THEME_STORAGE_KEY) as ThemeOptions) || ThemeOptions.DARK);
  const [puzzleType, setPuzzleType] = useState<PuzzleType>((localStorage.getItem(PUZZLE_TYPE_KEY) as PuzzleType) || PuzzleType.RANDOM);

  // Message Handling
  const [showError, setShowError] = useState<boolean>(false);
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

  // Initialize Game State Manager
  const gameStateManager = new GameStateManager();

  /**
   * Execute setup on initial load
   */
  useEffect(() => {
    determineKeyboard();
    determineDifficulty();
    const storedPuzzleType = determinePuzzleType();

    // Determine Daily Puzzle
    const startDate = new Date("2021-06-19");
    const today = new Date();
    const todaysPuzzleNumber = Math.round(Math.abs((today.valueOf() - startDate.valueOf()) / (24 * 60 * 60 * 1000))) - 1;
    setTodaysPuzzle(todaysPuzzleNumber);

    if (storedPuzzleType === PuzzleType.TODAY) {
      // Load Progress from Today's Puzzle
      const todaysGameState = gameStateManager.loadGameState(TODAYS_GAME_STATE_KEY);
      if (todaysGameState.puzzleNumber === todaysPuzzleNumber) {
        // If Today's puzzle is the same as the stored, load it
        loadGameState(gameStateManager.loadGameState(TODAYS_GAME_STATE_KEY));
      } else {
        // otherwise, reset the game because the day has changed
        setGameState(gameStateManager.generateNewGameState(), todaysPuzzleNumber);
      }
    } else {
      // Load the progress their current puzzle
      loadGameState(gameStateManager.gameState);
    }

    // Show the rules on the first time
    setOpenRulesModal(gameLogManager.gameLog.gamesPlayed === 0 && gameLogManager.gameLog.guessCount === 0);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Execute on game state change
   *
   * When letter's are entered, messages are shown, or the puzzle changes, preserve the game state
   */
  useEffect(() => {
    gameStateManager.saveGameState(
      {
        guessMap: guessMap,
        letterOptions: letterOptions,
        cursorPointer: mapPointer,
        showError: showError,
        showFail: showFail,
        showSuccess: showSuccess,
        errorMessage: errorMessage,
        puzzleNumber: puzzleNumber,
      },
      localStorage.getItem(PUZZLE_TYPE_KEY) === PuzzleType.TODAY
    );
  }, [mapPointer, showSuccess, showFail, showError, errorMessage, puzzleNumber]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Execute on game display changes
   */
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
  }, [guessMap, letterOptions, mapPointer, showSuccess, showFail]);

  /**
   * Execute on Success only
   */
  useEffect(() => {
    // On solved puzzle, show the success modal
    if (showSuccess) {
      setOpenShareModal(true);
    }
  }, [showSuccess]);

  const generatePuzzleNumber = () => {
    return Math.floor(Math.random() * validWords.length);
  };

  /**
   * Set the current puzzle to a specific one
   * @param puzzleNumber
   */
  const setPuzzle = (puzzleNumber: number) => {
    setSolution(validWords[puzzleNumber].toLocaleUpperCase());
    setPuzzleNumber(puzzleNumber);
  };

  /**
   * Select a puzzle from the list of options and set the game state as needed
   */
  const generateNewPuzzle = () => {
    // Generate a new puzzle
    const randomWord = validWords[generatePuzzleNumber()];
    setPuzzle(validWords.indexOf(randomWord));
  };

  /**
   * Set the game state from the provided one
   * If a specific puzzle number is provided, set that, otherwise, generate a new puzzle
   * @param gameState
   * @param puzzleNumber
   */
  const setGameState = (gameState: GameState, puzzleNumber?: number) => {
    setGuessMap(gameState.guessMap);
    setLetterOptions(gameState.letterOptions);
    setMapPointer(gameState.cursorPointer);
    setShowError(gameState.showError);
    setErrorMessage(gameState.errorMessage);
    setShowFail(gameState.showFail);
    setShowSuccess(gameState.showSuccess);
    if (puzzleNumber) {
      setPuzzle(puzzleNumber);
    } else {
      generateNewPuzzle();
    }
  };

  /**
   * Load the saved game state from the stored puzzle number
   * @param gameState
   */
  const loadGameState = (gameState: GameState) => {
    setGameState(gameState, gameStateManager.gameState.puzzleNumber);
  };

  /**
   * Reset game to todays puzzle or random
   * Load todays puzzle or generate a new puzzle
   * @param loadTodaysPuzzle
   */
  const resetGameState = (loadTodaysPuzzle?: boolean) => {
    if (loadTodaysPuzzle) {
      localStorage.setItem(PUZZLE_TYPE_KEY, PuzzleType.TODAY);
      setGameState(gameStateManager.loadGameState(TODAYS_GAME_STATE_KEY), todaysPuzzle);
    } else {
      localStorage.setItem(PUZZLE_TYPE_KEY, PuzzleType.RANDOM);
      gameStateManager.resetGameState();
      setGameState(gameStateManager.generateNewGameState());
    }
  };

  /**
   * Determine the keyboard type from local storage
   */
  const determineKeyboard = () => {
    const storedKeyboard = (localStorage.getItem(KEYBOARD_STORAGE_KEY) || "") as KeyboardState;
    if (Object.values(KeyboardState).includes(storedKeyboard)) {
      setKeyboardDisplay(localStorage.keyboard);
    } else {
      localStorage.setItem(KEYBOARD_STORAGE_KEY, KeyboardState.QWERTY);
      setKeyboardDisplay(localStorage.keyboard);
    }
  };

  /**
   * Determine the difficulty from local storage
   */
  const determineDifficulty = () => {
    const storedDifficulty = (localStorage.getItem(DIFFICULTY_KEY) || "") as DifficultyOptions;
    if (Object.values(DifficultyOptions).includes(storedDifficulty)) {
      setDifficulty(localStorage.difficulty);
    } else {
      localStorage.setItem(DIFFICULTY_KEY, difficulty);
      setDifficulty(localStorage.difficulty);
    }
  };

  /**
   * Determine the puzzle type from local storage
   * @returns PuzzleType
   */
  const determinePuzzleType = () => {
    const storedPuzzleType: PuzzleType = (localStorage.getItem(PUZZLE_TYPE_KEY) || "") as PuzzleType;
    if (Object.values(PuzzleType).includes(storedPuzzleType)) {
      setPuzzleType(storedPuzzleType);
      return storedPuzzleType;
    } else {
      localStorage.setItem(PUZZLE_TYPE_KEY, puzzleType);
      setPuzzleType(puzzleType);
      return puzzleType;
    }
  };

  /**
   * Select a letter from the keyboard
   * @param letter
   */
  const onSelect = (letter: string) => {
    const isLetterDisabled = difficulty === DifficultyOptions.HARDER && letterOptions.find((l) => l.letter === letter)?.disabled;
    const spaceIsBlank = guessMap[mapPointer[0]].some((e) => e.letter === "");
    if (isLetterDisabled) {
      setShowError(true);
      setErrorMessage(`${letter} is disabled!`);
    } else if (!(showFail || showSuccess) && spaceIsBlank && !isLetterDisabled) {
      guessMap[mapPointer[0]][mapPointer[1]] = {
        ...DefaultLetter,
        letter: letter,
      };
      setMapPointer([mapPointer[0], mapPointer[1] + 1]);
      clearError();
    }
  };

  /**
   * Remove the last letter from a guess
   */
  const onBackspace = () => {
    if (!disableBackspace && guessMap[mapPointer[0]].some((e) => e.letter !== "")) {
      guessMap[mapPointer[0]][mapPointer[1] - 1] = DefaultLetter;
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
      const hintedLetters = letterOptions.filter((letter) => letter.containMatch || letter.positionMatch);
      const guessContainsAllHints = hintedLetters.every((letter) => guessedWord.includes(letter.letter));
      if ((difficulty === DifficultyOptions.HARD || difficulty === DifficultyOptions.HARDER) && !guessContainsAllHints) {
        // In harder difficulty, make sure the guess contains all hints
        toast.warn(`Must include all previous hints!`);
      } else if (guessWords.includes(guessedWord.toLocaleLowerCase()) || validWords.includes(guessedWord.toLocaleLowerCase())) {
        // Ensure the word is contained within all the possible words
        if (utilities.previousGuess(guessedWord, guessMap, mapPointer)) {
          // Check if word has already been tried
          toast.warn(`You already tried ${guessedWord}.`);
        } else {
          validateWord(guessedWord);
        }
      } else {
        // Not a valid word
        gameLogManager.updateInvalidWordCount();
        toast.warn(`${guessedWord} is not a word!`);
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
    gameLogManager.updateGuessCount();

    const guessMapRow = guessMap[mapPointer[0]];

    // Loop over array of letter from the guessed word
    guess.split("").forEach((letter, index) => {
      // Search method for finding keyboard letter to be updated
      const keyboardLetter = letterOptions.find((letterOption: LetterState) => letterOption.letter === letter) ?? DefaultLetter;

      const guessMapLetter = guessMapRow[index];

      // Check if letter is contained in goal word
      if (solution.indexOf(letter) >= 0) {
        guessMapLetter.noMatch = false;
        guessMapLetter.containMatch = true;

        // Update keyboard state
        keyboardLetter.containMatch = true;

        // Check if letter matches the position
        if (solution.split("")[index] === letter) {
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
        keyboardLetter.disabled = true;
      }

      // Retroactively remove hints on duplicate letters
      const dupeLetterMatch = new RegExp(letter, "g"); // regex for finding occurances of the current letter
      const guessOccurenceCount = guess.match(dupeLetterMatch)?.length ?? 0; // count occurances of letter in guess word, 0 if none
      const goalOccurenceCount = solution.match(dupeLetterMatch)?.length ?? 0; // count occurances of letter in goal word, 0 if none
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
    if (guess === solution) {
      gameLogManager.updateWinCount(guess, mapPointer[0] + 1);
      setMapPointer([mapPointer[0] + 1, 0]);
      setTimeout(() => {
        setShowSuccess(true);
      }, 2000);
      clearError();
      return;
    }

    // No success, next line
    if (mapPointer[0] < guessMap.length) {
      setMapPointer([mapPointer[0] + 1, 0]);
      clearError();
    }

    // Out of guesses
    if (mapPointer[0] === guessMap.length - 1) {
      gameLogManager.updateLossCount();
      setShowFail(true);
      clearError();
      return;
    }

    // Update keyboard
    setLetterOptions([...letterOptions]);

    // Update guess map
    setGuessMap([...guessMap]);
  };

  /**
   * Clear error state
   */
  const clearError = () => {
    setErrorMessage("");
    setShowError(false);
    toast.clearWaitingQueue();
  };

  // Handle keyboard input
  useHotkeys(alphabet.join(", "), (key) => onSelect(key.key.toLocaleUpperCase()), [onSelect]);
  useHotkeys("backspace", () => onBackspace(), [onBackspace]);
  useHotkeys("enter", () => onSubmit(), [onSubmit]);

  /**
   * Handle theme switch, set storage key
   * @param theme
   */
  const handleThemeSwitch = (theme: ThemeOptions) => {
    switch (theme) {
      case ThemeOptions.DARK:
        document.documentElement.classList.add(ThemeOptions.DARK);
        localStorage.setItem(THEME_STORAGE_KEY, ThemeOptions.DARK);
        setTheme(ThemeOptions.DARK);
        break;
      case ThemeOptions.LIGHT:
        document.documentElement.classList.remove(ThemeOptions.DARK);
        localStorage.setItem(THEME_STORAGE_KEY, ThemeOptions.LIGHT);
        setTheme(ThemeOptions.LIGHT);
        break;
    }
  };

  /**
   * Handle keyboard display, set storage key, etc.
   * @param keyboard
   */
  const handleKeyboardSwitch = (keyboard: KeyboardState) => {
    localStorage.setItem(KEYBOARD_STORAGE_KEY, keyboard);
    setKeyboardDisplay(keyboard);
  };

  /**
   * Resets the statistics and resets the game
   */
  const handleStatisticsReset = () => {
    gameLogManager.resetGameLog();
    resetGameState();
  };

  /**
   * Changes the games difficulty
   */
  const handleDifficultyChange = (difficulty: DifficultyOptions) => {
    localStorage.setItem(DIFFICULTY_KEY, difficulty);
    setDifficulty(difficulty);
    resetGameState(determinePuzzleType() === PuzzleType.TODAY);
  };

  return (
    <div className="w-full h-full">
      <div className="flex flex-col w-full h-full max-w-4xl mx-auto py-2 px-2 sm:px-4">
        <div className="flex flex-initial flex-row flex-wrap justify-between items-end border-b-2 border-slate-300 dark:border-slate-500 pb-4 space-y-2">
          <h1 className="text-lg md:text-4xl font-bold flex flex-row items-center">
            <img src={logo} alt="Word Guess" title="Word Guess" className="w-6 h-6 sm:w-8 sm:h-8 mx-2 sm:ml-0 sm:mt-1" />
            Word Guess
          </h1>
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
        <div className="flex flex-auto flex-col justify-center my-2">
          <div className="flex flex-initial flex-row flex-wrap justify-between">
            <div className="flex flex-auto flex-row flex-wrap space-x-1 md:space-x-4 justify-center md:justify-start">
              <ConfirmationModalContextProvider confirmText="Are you sure you want a new puzzle? Your current game will be lost." confirmButtonText="New Puzzle">
                <ButtonWithConfirmation className="button-outline" onClick={() => resetGameState()}>
                  New Puzzle
                </ButtonWithConfirmation>
              </ConfirmationModalContextProvider>

              {todaysPuzzle !== puzzleNumber && (
                <>
                  <ConfirmationModalContextProvider confirmText="Are you sure you want load Today's Puzzle? Your current game will be lost." confirmButtonText="Go To Today's Puzzle">
                    <ButtonWithConfirmation className="button-positive" onClick={() => resetGameState(true)} disabled={todaysPuzzle === puzzleNumber}>
                      Today's Puzzle
                    </ButtonWithConfirmation>
                  </ConfirmationModalContextProvider>
                  <ConfirmationModalContextProvider confirmText="Are you sure you want to reveal the solution?" confirmButtonText="Reveal">
                    <ButtonWithConfirmation
                      disabled={showSuccess || showFail || todaysPuzzle === puzzleNumber}
                      className="button-outline"
                      onClick={() => {
                        if (!showFail) {
                          gameLogManager.updateForfeitCount();
                          clearError();
                          setShowFail(true);
                        }
                      }}
                    >
                      Reveal Solution
                    </ButtonWithConfirmation>
                  </ConfirmationModalContextProvider>
                </>
              )}
            </div>
            <div className="hidden md:flex flex-initial flex-row flex-wrap justify-center items-center space-x-2">
              <strong>Difficulty:</strong>{" "}
              <button className="button-outline capitalize" onClick={() => setOpenSettingsModal(true)}>
                {difficulty}
              </button>
            </div>
          </div>
          <div className="flex flex-auto flex-col justify-center items-center">
            {todaysPuzzle === puzzleNumber && (
              <span className="text-lg font-bold pb-2">
                Today's Puzzle -{" "}
                {currentDate.toLocaleString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            )}
            {todaysPuzzle !== puzzleNumber && <span className="text-lg font-bold pb-2">Puzzle #{puzzleNumber}</span>}
            <GuessDisplay guessMap={guessMap} mapPointer={mapPointer} />
          </div>
          <div className="flex flex-initial flex-col">
            {(showFail || showSuccess) && (
              <div className="flex flex-col justify-center items-center">
                {showFail && <Toast type={ToastTypes.ERROR} message={`Sorry! The word was ${solution}`} />}
                {showSuccess && <Toast type={ToastTypes.SUCCESS} message={`Success! The word is ${solution}!`} />}
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
                    <button className="underline" onClick={() => resetGameState()}>
                      Try another?
                    </button>
                  </li>
                </ul>
              </div>
            )}
            <ToastContainer position="top-center" transition={Slide} limit={1} autoClose={3000} hideProgressBar newestOnTop={false} closeOnClick rtl={false} pauseOnHover pauseOnFocusLoss draggable theme="colored" closeButton={false}></ToastContainer>
            <Keyboard
              qwerty={keyboardDisplay === KeyboardState.QWERTY}
              letterOptions={letterOptions}
              onSelect={onSelect}
              disableSelect={(letter) => (letter.disabled && difficulty === DifficultyOptions.HARDER) || showSuccess || showFail}
              onSubmit={onSubmit}
              disableSubmit={disableSubmit}
              onBackspace={onBackspace}
              disableBackspace={showSuccess || showFail || disableBackspace}
            ></Keyboard>
          </div>
        </div>
        <div className="flex flex-initial flex-wrap flex-row justify-between border-t-2 border-slate-300 dark:border-slate-500 mt-4 py-4 text-xs">
          <div className="flex flex-auto flex-row space-x-4">
            <a href="https://alexmj212.dev" className="underline">
              alexmj212.dev
            </a>
            <a href="https://alexmj212.dev/blog/understanding-how-wordle-works/" className="underline">
              How Word Guess Works
            </a>
          </div>
          <div className="flex flex-auto flex-row space-x-4 justify-start md:justify-end items-end">
            {todaysPuzzle !== puzzleNumber && <span>#{puzzleNumber}</span>}
            <span>Build: {document.querySelector('meta[name="build-version"]')?.getAttribute("build-version")}</span>
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
            <li>Select or type letters to spell a word.</li>
            <li>Use "Enter" to see if you are correct.</li>
            <li>
              Use <BackspaceIcon className="h-6 w-6 inline-block" /> to remove letters from your guess.
            </li>
            <li>You will gets hints if your letters are in the hidden word.</li>
            <li>You have 6 tries to guess the word.</li>
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
        <div className="flex flex-auto flex-row justify-center mt-4">
          <ConfirmationModalContextProvider confirmText="Are you sure you want to reset your statistics? Your current game will be lost." confirmButtonText="Reset">
            <ButtonWithConfirmation className="button-negative" onClick={handleStatisticsReset}>
              Reset Statistics
            </ButtonWithConfirmation>
          </ConfirmationModalContextProvider>
        </div>
      </Modal>
      <Modal open={(showSuccess || showFail) && openShareModal} setOpen={setOpenShareModal} title={showSuccess ? `Success! The word is ${solution}` : `Sorry! The word was ${solution}`}>
        <div className="flex flex-col justify-center mb-4">
          <pre className="bg-slate-200 dark:bg-slate-800 px-4 py-2 rounded-md">{utilities.generateShareText(guessMap, puzzleNumber, showFail)}</pre>
        </div>
        <StatBlock gameLog={gameLogManager.gameLog} />
      </Modal>
      <Modal open={openSettingsModal} setOpen={setOpenSettingsModal} title="Settings">
        <dl>
          <div className="grid-row">
            <dt className="grid-label">Difficulty</dt>
            <dd className="grid-field">
              <ConfirmationModalContextProvider confirmText="Are you sure you want to change the difficulty? Your current game will be lost." confirmButtonText="Reset">
                <RadioWithConfirmation keys={Object.values(DifficultyOptions)} selectedValue={difficulty} keyDescription={difficultyDescriptions} onChange={handleDifficultyChange}></RadioWithConfirmation>
              </ConfirmationModalContextProvider>
            </dd>
          </div>
          <div className="grid-row">
            <dt className="grid-label">Theme</dt>
            <dd className="grid-field">
              <RadioGroup value={theme} onChange={handleThemeSwitch}>
                {Object.values(ThemeOptions).map((themeOption) => (
                  <RadioGroup.Option key={themeOption} value={themeOption}>
                    {({ checked }) => (
                      <div className="check-group">
                        <div className={`check-radio ${checked ? "bg-blue-400" : "bg-white"}`}></div>
                        <span className="check-label">{themeOption}</span>
                      </div>
                    )}
                  </RadioGroup.Option>
                ))}
              </RadioGroup>
            </dd>
          </div>
          <div className="grid-row">
            <dt className="grid-label">Keyboard Display</dt>
            <dd className="grid-field">
              <RadioGroup value={keyboardDisplay} onChange={handleKeyboardSwitch}>
                {Object.values(KeyboardState).map((keyboard) => (
                  <RadioGroup.Option key={keyboard} value={keyboard}>
                    {({ checked }) => (
                      <div className="check-group">
                        <div className={`check-radio ${checked ? "bg-blue-400" : "bg-white"}`}></div>
                        <span className="check-label">{keyboard}</span>
                      </div>
                    )}
                  </RadioGroup.Option>
                ))}
              </RadioGroup>
            </dd>
          </div>
        </dl>
      </Modal>
    </div>
  );
}

export default App;
