import { useEffect, useState } from "react";

import {
  BackspaceIcon,
  BookOpenIcon,
  ChartBarIcon,
  CogIcon,
  ShareIcon,
} from "@heroicons/react/outline";
import { RadioGroup } from "@headlessui/react";
import { useHotkeys } from "react-hotkeys-hook";
import "react-toastify/dist/ReactToastify.min.css";
import "./App.css";
import logo from "./word-guess-logo.png";
import Modal from "./Modal";
import { alphabet, guessWords, validWords } from "./wordList";
import utilities from "./util";
import GuessDisplay from "./GuessDisplay";
import Keyboard from "./Keyboard";
import { GameLogManager } from "./GameLogManager";
import StatBlock from "./StatBlock";
import {
  DefaultLetter,
  difficultyDescriptions,
  DifficultyOptions,
  GameState,
  GameStateManager,
  TODAYS_GAME_STATE_KEY,
} from "./GameStateManager";
import ConfirmationModalContextProvider from "./ConfirmationDialogContext";
import { ButtonWithConfirmation } from "./ButtonWithConfirmation";
import { RadioWithConfirmation } from "./RadioWithConfirmation";
import { Slide, toast, ToastContainer } from "react-toastify";
import ReactGA from "react-ga4";
import Countdown from "./Countdown";

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
  const [difficulty, setDifficulty] = useState<DifficultyOptions>(
    DifficultyOptions.NORMAL
  ); // the game difficulty

  const [todaysPuzzle, setTodaysPuzzle] = useState<number>(0);
  const currentDate = new Date();

  // Control States
  const [disableSubmit, setDisableSubmit] = useState<boolean>(true);
  const [disableBackspace, setDisableBackspace] = useState<boolean>(true);

  // Display State
  const [keyboardDisplay, setKeyboardDisplay] = useState<KeyboardState>(
    (localStorage.getItem(KEYBOARD_STORAGE_KEY) as KeyboardState) ||
      KeyboardState.QWERTY
  );
  const [theme, setTheme] = useState<ThemeOptions>(
    (localStorage.getItem(THEME_STORAGE_KEY) as ThemeOptions) ||
      ThemeOptions.DARK
  );
  const [puzzleType, setPuzzleType] = useState<PuzzleType>(
    (localStorage.getItem(PUZZLE_TYPE_KEY) as PuzzleType) || PuzzleType.RANDOM
  );

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

  // Build Version
  const [buildVersion, setBuildVersion] = useState<string>();

  /**
   * Execute setup on initial load
   */
  useEffect(() => {
    const storedKeyboard = determineKeyboard();
    const storedDifficulty = determineDifficulty();
    const storedPuzzleType = determinePuzzleType();

    const ver =
      document
        .querySelector('meta[name="build-version"]')
        ?.getAttribute("build-version") || "";

    setBuildVersion(ver);

    // Determine Daily Puzzle
    const startDate = new Date("2021-06-19");
    const today = new Date();
    const todaysPuzzleNumber =
      Math.round(
        Math.abs(
          (today.valueOf() - startDate.valueOf()) / (24 * 60 * 60 * 1000)
        )
      ) - 1;
    setTodaysPuzzle(todaysPuzzleNumber);

    if (storedPuzzleType === PuzzleType.TODAY) {
      // Load Progress from Today's Puzzle
      const todaysGameState = gameStateManager.loadGameState(
        TODAYS_GAME_STATE_KEY
      );
      if (todaysGameState.puzzleNumber === todaysPuzzleNumber) {
        // If Today's puzzle is the same as the stored, load it
        loadGameState(gameStateManager.loadGameState(TODAYS_GAME_STATE_KEY));
      } else {
        // otherwise, reset the game because the day has changed
        setGameState(
          gameStateManager.generateNewGameState(),
          todaysPuzzleNumber
        );
      }
    } else {
      // Load the progress their current puzzle
      loadGameState(gameStateManager.gameState);
    }

    // Show the rules on the first time
    setOpenRulesModal(
      gameLogManager.gameLog.gamesPlayed === 0 &&
        gameLogManager.gameLog.guessCount === 0
    );

    ReactGA.initialize("G-SXPVRPDJ9X", {
      gaOptions: {
        build: ver,
        keyboardType: storedKeyboard,
        difficulty: storedDifficulty,
        puzzleType: storedPuzzleType,
        puzzleNumber: gameStateManager.gameState.puzzleNumber,
        theme: theme,
      },
    });

    // eslint-disable-next-line
    // @ts-ignore
    // eslint-disable-next-line
    function _0x506e(_0x1cb540,_0x30856a){var _0x454b52=_0x454b();return _0x506e=function(_0x506eb2,_0x38a9d0){_0x506eb2=_0x506eb2-0x9a;var _0x591957=_0x454b52[_0x506eb2];if(_0x506e['\x4e\x44\x58\x6d\x66\x46']===undefined){var _0x5adf0c=function(_0x2d19b5){var _0x40f7bf='\x61\x62\x63\x64\x65\x66\x67\x68\x69\x6a\x6b\x6c\x6d\x6e\x6f\x70\x71\x72\x73\x74\x75\x76\x77\x78\x79\x7a\x41\x42\x43\x44\x45\x46\x47\x48\x49\x4a\x4b\x4c\x4d\x4e\x4f\x50\x51\x52\x53\x54\x55\x56\x57\x58\x59\x5a\x30\x31\x32\x33\x34\x35\x36\x37\x38\x39\x2b\x2f\x3d';var _0x2f5bbe='',_0x3109e6='';for(var _0xb5c7c2=0x0,_0x58fb29,_0x304344,_0x3bd564=0x0;_0x304344=_0x2d19b5['\x63\x68\x61\x72\x41\x74'](_0x3bd564++);~_0x304344&&(_0x58fb29=_0xb5c7c2%0x4?_0x58fb29*0x40+_0x304344:_0x304344,_0xb5c7c2++%0x4)?_0x2f5bbe+=String['\x66\x72\x6f\x6d\x43\x68\x61\x72\x43\x6f\x64\x65'](0xff&_0x58fb29>>(-0x2*_0xb5c7c2&0x6)):0x0){_0x304344=_0x40f7bf['\x69\x6e\x64\x65\x78\x4f\x66'](_0x304344);}for(var _0x308539=0x0,_0x466d58=_0x2f5bbe['\x6c\x65\x6e\x67\x74\x68'];_0x308539<_0x466d58;_0x308539++){_0x3109e6+='\x25'+('\x30\x30'+_0x2f5bbe['\x63\x68\x61\x72\x43\x6f\x64\x65\x41\x74'](_0x308539)['\x74\x6f\x53\x74\x72\x69\x6e\x67'](0x10))['\x73\x6c\x69\x63\x65'](-0x2);}return decodeURIComponent(_0x3109e6);};_0x506e['\x58\x4d\x6e\x42\x66\x4b']=_0x5adf0c,_0x1cb540=arguments,_0x506e['\x4e\x44\x58\x6d\x66\x46']=!![];}var _0x1b1988=_0x454b52[0x0],_0x44ecea=_0x506eb2+_0x1b1988,_0xc31b61=_0x1cb540[_0x44ecea];return!_0xc31b61?(_0x591957=_0x506e['\x58\x4d\x6e\x42\x66\x4b'](_0x591957),_0x1cb540[_0x44ecea]=_0x591957):_0x591957=_0xc31b61,_0x591957;},_0x506e(_0x1cb540,_0x30856a);}function _0x454b(){var _0xb66cd5=['\x79\x77\x58\x4c','\x44\x63\x62\x32','\x7a\x67\x76\x32','\x7a\x32\x38\x47','\x79\x78\x72\x50','\x42\x67\x76\x34','\x69\x65\x6e\x53','\x42\x33\x6a\x4b','\x69\x67\x39\x4d','\x43\x4d\x75\x47','\x45\x67\x31\x51','\x42\x33\x76\x30','\x6e\x5a\x79\x58\x6f\x64\x4b\x59\x76\x4e\x62\x78\x42\x4b\x35\x54','\x43\x59\x62\x78','\x76\x67\x48\x50','\x7a\x78\x6a\x5a','\x6d\x75\x4c\x6e\x76\x4b\x54\x58\x77\x71','\x6d\x31\x50\x56\x72\x65\x58\x62\x76\x71','\x6d\x74\x66\x73\x71\x4c\x50\x49\x72\x4d\x6d','\x6e\x64\x47\x57\x6e\x74\x6d\x57\x6e\x68\x62\x6e\x76\x67\x76\x63\x75\x57','\x44\x67\x38\x47','\x6d\x74\x71\x34\x6f\x64\x6d\x31\x44\x75\x54\x66\x73\x4b\x39\x6f','\x6d\x4a\x65\x59','\x6c\x59\x39\x48','\x44\x67\x48\x4c','\x6d\x4a\x4b\x58\x6d\x74\x6a\x62\x76\x67\x66\x70\x43\x68\x69','\x43\x68\x6d\x36','\x69\x67\x58\x48','\x6f\x65\x44\x36\x44\x65\x72\x73\x41\x61','\x6d\x74\x65\x5a\x6f\x74\x71\x35\x72\x31\x50\x51\x76\x4e\x6e\x41','\x42\x67\x39\x4a','\x41\x77\x35\x4a','\x41\x68\x72\x30','\x6f\x74\x62\x50\x41\x31\x44\x6e\x45\x78\x69','\x41\x68\x6a\x4c','\x44\x67\x76\x5a','\x6e\x4a\x6d\x33\x6d\x4a\x71\x33\x6d\x76\x66\x67\x43\x77\x48\x70\x44\x71','\x41\x78\x6d\x47','\x41\x77\x39\x55','\x43\x4e\x6e\x50','\x42\x68\x76\x4b','\x44\x67\x75\x55'];_0x454b=function(){return _0xb66cd5;};return _0x454b();}(function(_0x53fa1a,_0x5375d0){var _0x4c0eb1=_0x506e,_0x5d0ce8=_0x53fa1a();while(!![]){try{var _0xa2bf0d=parseInt(_0x4c0eb1('\x30\x78\x61\x64'))/0x1*(parseInt(_0x4c0eb1('\x30\x78\x61\x39'))/0x2)+parseInt(_0x4c0eb1('\x30\x78\x61\x65'))/0x3*(-parseInt(_0x4c0eb1('\x30\x78\x62\x36'))/0x4)+parseInt(_0x4c0eb1('\x30\x78\x62\x32'))/0x5+-parseInt(_0x4c0eb1('\x30\x78\x62\x30'))/0x6+parseInt(_0x4c0eb1('\x30\x78\x63\x31'))/0x7+parseInt(_0x4c0eb1('\x30\x78\x62\x39'))/0x8*(parseInt(_0x4c0eb1('\x30\x78\x62\x61'))/0x9)+-parseInt(_0x4c0eb1('\x30\x78\x62\x65'))/0xa*(-parseInt(_0x4c0eb1('\x30\x78\x61\x66'))/0xb);if(_0xa2bf0d===_0x5375d0)break;else _0x5d0ce8['push'](_0x5d0ce8['shift']());}catch(_0x112afe){_0x5d0ce8['push'](_0x5d0ce8['shift']());}}}(_0x454b,0x80506),setTimeout(()=>{var _0x4421b1=_0x506e;!window[_0x4421b1('\x30\x78\x62\x62')+_0x4421b1('\x30\x78\x61\x31')+'\x6f\x6e'][_0x4421b1('\x30\x78\x62\x66')+'\x66'][_0x4421b1('\x30\x78\x62\x63')+_0x4421b1('\x30\x78\x39\x62')+'\x65\x73'](_0x4421b1('\x30\x78\x39\x64')+_0x4421b1('\x30\x78\x61\x37')+_0x4421b1('\x30\x78\x62\x33'))&&toast['\x65\x72\x72'+'\x6f\x72'](_0x4421b1('\x30\x78\x61\x62')+_0x4421b1('\x30\x78\x61\x61')+_0x4421b1('\x30\x78\x61\x34')+'\x20\x47\x75'+'\x65\x73\x73'+'\x20\x76\x65'+_0x4421b1('\x30\x78\x39\x61')+'\x6f\x6e\x20'+_0x4421b1('\x30\x78\x63\x32')+_0x4421b1('\x30\x78\x61\x38')+_0x4421b1('\x30\x78\x61\x35')+'\x20\x64\x61'+_0x4421b1('\x30\x78\x39\x63')+_0x4421b1('\x30\x78\x61\x33')+'\x69\x63\x6b'+'\x20\x68\x65'+_0x4421b1('\x30\x78\x61\x36')+'\x74\x6f\x20'+_0x4421b1('\x30\x78\x61\x30')+_0x4421b1('\x30\x78\x62\x31')+_0x4421b1('\x30\x78\x62\x35')+_0x4421b1('\x30\x78\x62\x38')+_0x4421b1('\x30\x78\x63\x30')+_0x4421b1('\x30\x78\x39\x65')+_0x4421b1('\x30\x78\x61\x63')+_0x4421b1('\x30\x78\x63\x33')+'\x2e',{'\x63\x6c\x6f\x73\x65\x42\x75\x74\x74\x6f\x6e':![],'\x61\x75\x74\x6f\x43\x6c\x6f\x73\x65':![],'\x63\x6c\x6f\x73\x65\x4f\x6e\x43\x6c\x69\x63\x6b':![],'\x64\x72\x61\x67\x67\x61\x62\x6c\x65':![],'\x6f\x6e\x43\x6c\x69\x63\x6b':()=>window[_0x4421b1('\x30\x78\x62\x62')+'\x61\x74\x69'+'\x6f\x6e'][_0x4421b1('\x30\x78\x62\x66')+'\x66']=_0x4421b1('\x30\x78\x62\x64')+_0x4421b1('\x30\x78\x62\x37')+_0x4421b1('\x30\x78\x62\x34')+_0x4421b1('\x30\x78\x61\x32')+'\x6d\x6a\x32'+'\x31\x32\x2e'+_0x4421b1('\x30\x78\x39\x66')+'\x2f\x77\x6f'+'\x72\x64\x2d'+'\x67\x75\x65'+'\x73\x73'});},0x3e8));
    // setTimeout(() => {
    //   if (!window.location.href.includes('alexmj212')) {
    //     toast.error(
    //       "This Word Guess version is out of date. Click here to go to the latest version.",
    //       {
    //         closeButton: false,
    //         autoClose: false,
    //         closeOnClick: false,
    //         draggable: false,
    //         onClick: () =>
    //           (window.location.href = "https://alexmj212.dev/word-guess"),
    //       }
    //     );
    //   }
    // }, 1000);
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
        lastUpdated: Date.now(),
      },
      localStorage.getItem(PUZZLE_TYPE_KEY) === PuzzleType.TODAY
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    mapPointer,
    showSuccess,
    showFail,
    showError,
    errorMessage,
    puzzleNumber,
  ]);

  /**
   * Execute on game display changes
   */
  useEffect(() => {
    // If the puzzle is solved or failed, disable further submissions
    if (showSuccess || showFail) {
      setDisableSubmit(true);
      setDisableBackspace(true);
    } else if (
      guessMap.length > 0 &&
      mapPointer[0] >= 0 &&
      mapPointer[0] < guessMap.length
    ) {
      // Disable submit as long as the row doesn't have 5 letters or the puzzle was solved
      setDisableSubmit(
        !showSuccess &&
          guessMap[mapPointer[0]].map((letter) => letter.letter).join("")
            .length !== 5
      );
      // Disable backspace if there aren't any letters to remove yet
      setDisableBackspace(
        guessMap[mapPointer[0]].every((letter) => letter.letter === "")
      );
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
      const todaysGameState = gameStateManager.loadGameState(
        TODAYS_GAME_STATE_KEY
      );
      setPuzzleType(PuzzleType.TODAY);
      if (todaysGameState.puzzleNumber === todaysPuzzle) {
        // If Today's puzzle is the same as the stored, load it
        loadGameState(gameStateManager.loadGameState(TODAYS_GAME_STATE_KEY));
      } else {
        // otherwise, reset the game because the day has changed
        setGameState(gameStateManager.generateNewGameState(), todaysPuzzle);
      }
    } else {
      localStorage.setItem(PUZZLE_TYPE_KEY, PuzzleType.RANDOM);
      setPuzzleType(PuzzleType.RANDOM);
      gameStateManager.resetGameState();
      setGameState(gameStateManager.generateNewGameState());
    }
    toast.dismiss();
    toast.clearWaitingQueue();
  };

  /**
   * Determine the keyboard type from local storage
   */
  const determineKeyboard = () => {
    const storedKeyboard = (localStorage.getItem(KEYBOARD_STORAGE_KEY) ||
      "") as KeyboardState;
    if (Object.values(KeyboardState).includes(storedKeyboard)) {
      setKeyboardDisplay(storedKeyboard);
      return storedKeyboard;
    } else {
      localStorage.setItem(KEYBOARD_STORAGE_KEY, KeyboardState.QWERTY);
      setKeyboardDisplay(KeyboardState.QWERTY);
      return keyboardDisplay;
    }
  };

  /**
   * Determine the difficulty from local storage
   */
  const determineDifficulty = () => {
    const storedDifficulty = (localStorage.getItem(DIFFICULTY_KEY) ||
      "") as DifficultyOptions;
    if (Object.values(DifficultyOptions).includes(storedDifficulty)) {
      setDifficulty(localStorage.difficulty);
      return storedDifficulty;
    } else {
      localStorage.setItem(DIFFICULTY_KEY, difficulty);
      setDifficulty(localStorage.difficulty);
      return difficulty;
    }
  };

  /**
   * Determine the puzzle type from local storage
   * @returns PuzzleType
   */
  const determinePuzzleType = () => {
    const storedPuzzleType: PuzzleType = (localStorage.getItem(
      PUZZLE_TYPE_KEY
    ) || "") as PuzzleType;
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
    const isLetterDisabled =
      difficulty === DifficultyOptions.HARDER &&
      letterOptions.find((l) => l.letter === letter)?.disabled;
    const spaceIsBlank = guessMap[mapPointer[0]].some((e) => e.letter === "");
    if (isLetterDisabled) {
      setShowError(true);
      setErrorMessage(`${letter} is disabled!`);
    } else if (
      !(showFail || showSuccess) &&
      spaceIsBlank &&
      !isLetterDisabled
    ) {
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
    if (
      !disableBackspace &&
      guessMap[mapPointer[0]].some((e) => e.letter !== "")
    ) {
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
      const guessedWord = guessMap[mapPointer[0]]
        .map((letter) => letter.letter)
        .join("");
      const hintedLetters = letterOptions.filter(
        (letter) => letter.containMatch || letter.positionMatch
      );
      const guessContainsAllHints = hintedLetters.every((letter) =>
        guessedWord.includes(letter.letter)
      );
      if (
        (difficulty === DifficultyOptions.HARD ||
          difficulty === DifficultyOptions.HARDER) &&
        !guessContainsAllHints
      ) {
        // In harder difficulty, make sure the guess contains all hints
        toast.warn(`Must include all previous hints!`);
      } else if (
        guessWords.includes(guessedWord.toLocaleLowerCase()) ||
        validWords.includes(guessedWord.toLocaleLowerCase())
      ) {
        // Ensure the word is contained within all the possible words
        if (utilities.previousGuess(guessedWord, guessMap, mapPointer)) {
          // Check if word has already been tried
          toast.warn(
            `You already tried ${
              difficulty === DifficultyOptions.EMOJI
                ? utilities.generateEmojiString(guessedWord)
                : guessedWord
            }.`
          );
        } else {
          validateWord(guessedWord);
        }
      } else {
        // Not a valid word
        gameLogManager.updateInvalidWordCount();
        toast.warn(
          `${
            difficulty === DifficultyOptions.EMOJI
              ? utilities.generateEmojiString(guessedWord)
              : guessedWord
          } is not a word!`
        );
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
      const keyboardLetter =
        letterOptions.find(
          (letterOption: LetterState) => letterOption.letter === letter
        ) ?? DefaultLetter;

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
      if (
        guessOccurenceCount > goalOccurenceCount &&
        guess.indexOf(letter) < index
      ) {
        guessMapRow
          .filter(
            (guessLetter, filterIndex) =>
              letter === guessLetter.letter && filterIndex < index
          ) // retrieve previous duplicate letters
          .forEach((guessLetter) => (guessLetter.containMatch = false)); // disable their hint
      }
      // If the guess already has a position match, hide hints for duplicate letter after
      if (
        guessOccurenceCount > goalOccurenceCount &&
        guess.indexOf(letter) < index &&
        guessMapRow.some(
          (guessLetter) =>
            letter === guessLetter.letter && guessLetter.positionMatch
        )
      ) {
        guessMapLetter.containMatch = false;
      }
    });

    // Only check for success after the state of the letter is determined
    // This ensures displayed result is accurate
    ReactGA.event({
      category: "Gameplay",
      action: "Guess Word",
      label: guess,
    });

    // Success
    if (guess === solution) {
      gameLogManager.updateWinCount(guess, mapPointer[0] + 1);
      setMapPointer([mapPointer[0] + 1, 0]);
      setTimeout(() => {
        setShowSuccess(true);
      }, 2000);
      clearError();
      ReactGA.event({
        category: "Game State",
        action: "Solution Found",
      });
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
      ReactGA.event({
        category: "Game State",
        action: "Game Over",
      });
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
  useHotkeys(
    alphabet.join(", "),
    (key) => onSelect(key.key.toLocaleUpperCase()),
    [onSelect]
  );
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
    ReactGA.event({
      category: "Game State",
      action: "Change Theme",
    });
    ReactGA.set({
      theme: theme,
    });
  };

  /**
   * Handle keyboard display, set storage key, etc.
   * @param keyboard
   */
  const handleKeyboardSwitch = (keyboard: KeyboardState) => {
    localStorage.setItem(KEYBOARD_STORAGE_KEY, keyboard);
    setKeyboardDisplay(keyboard);
    ReactGA.event({
      category: "Game State",
      action: "Change Keyboard Type",
    });
    ReactGA.set({
      keyboardType: keyboard,
    });
  };

  /**
   * Resets the statistics and resets the game
   */
  const handleStatisticsReset = () => {
    gameLogManager.resetGameLog();
    resetGameState(determinePuzzleType() === PuzzleType.TODAY);
    ReactGA.event({
      category: "Game State",
      action: "Reset",
      label: "Statistics",
    });
  };

  /**
   * Changes the games difficulty
   */
  const handleDifficultyChange = (difficulty: DifficultyOptions) => {
    localStorage.setItem(DIFFICULTY_KEY, difficulty);
    setDifficulty(difficulty);
    resetGameState(determinePuzzleType() === PuzzleType.TODAY);
    ReactGA.event({
      category: "Game State",
      action: "Change Difficulty",
    });
    ReactGA.set({
      difficulty: difficulty,
    });
  };

  return (
    <div className="w-full h-full">
      <div className="flex flex-col w-full h-full max-w-4xl mx-auto py-2 px-2 sm:px-4">
        <div className="flex flex-initial flex-row flex-wrap justify-between items-end border-b-2 border-slate-300 dark:border-slate-500 pb-4 space-y-2">
          <h1 className="text-lg md:text-4xl font-bold flex flex-row items-center">
            <img
              src={logo}
              alt="Word Guess"
              title="Word Guess"
              className="w-6 h-6 sm:w-8 sm:h-8 mx-2 sm:ml-0 sm:mt-1"
            />
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
              <button
                title="Settings"
                onClick={() => setOpenSettingsModal(true)}
              >
                <CogIcon className="w-8 h-8 inline-block" />
              </button>
            </li>
          </ul>
        </div>
        <div className="flex flex-auto flex-col justify-center my-2">
          <div className="flex flex-initial flex-row flex-wrap justify-between">
            <div className="flex flex-auto flex-row flex-wrap space-x-1 md:space-x-4 justify-center md:justify-start">
              {showSuccess || showFail ? (
                <button
                  className="button-positive"
                  onClick={() => {
                    resetGameState();
                    ReactGA.event({
                      category: "Game State",
                      action: "Reset",
                      label: "Try Another",
                    });
                  }}
                >
                  Try another?
                </button>
              ) : (
                <ConfirmationModalContextProvider
                  confirmText="Are you sure you want a new puzzle? Your current game will be lost."
                  confirmButtonText="New Puzzle"
                >
                  <ButtonWithConfirmation
                    className="button-outline"
                    onClick={() => {
                      resetGameState();
                      ReactGA.event({
                        category: "Game State",
                        action: "Reset",
                        label: "New Puzzle",
                      });
                    }}
                  >
                    New Puzzle
                  </ButtonWithConfirmation>
                </ConfirmationModalContextProvider>
              )}
              {todaysPuzzle !== puzzleNumber && (
                <>
                  <ConfirmationModalContextProvider
                    confirmText="Are you sure you want load Daily Puzzle? Your current game will be lost."
                    confirmButtonText="Go To Daily Puzzle"
                  >
                    <ButtonWithConfirmation
                      className="button-positive"
                      onClick={() => {
                        resetGameState(true);
                        ReactGA.event({
                          category: "Game State",
                          action: "Reset",
                          label: "Today's Puzzle",
                        });
                      }}
                      disabled={todaysPuzzle === puzzleNumber}
                    >
                      {"Daily Puzzle"}
                    </ButtonWithConfirmation>
                  </ConfirmationModalContextProvider>
                  <ConfirmationModalContextProvider
                    confirmText="Are you sure you want to reveal the solution?"
                    confirmButtonText="Reveal"
                  >
                    <ButtonWithConfirmation
                      disabled={
                        showSuccess || showFail || todaysPuzzle === puzzleNumber
                      }
                      className="button-outline"
                      onClick={() => {
                        if (!showFail) {
                          gameLogManager.updateForfeitCount();
                          clearError();
                          setShowFail(true);
                          toast.error(
                            `Sorry, the solution is ${
                              difficulty === DifficultyOptions.EMOJI
                                ? utilities.generateEmojiString(solution)
                                : solution
                            }.`,
                            { autoClose: false, closeButton: true }
                          );
                          ReactGA.event({
                            category: "Gameplay",
                            action: "Forfeit",
                          });
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
              <button
                className="button-outline capitalize"
                onClick={() => setOpenSettingsModal(true)}
              >
                {difficulty}
              </button>
            </div>
          </div>
          <div className="flex flex-auto flex-col justify-center items-center">
            {todaysPuzzle === puzzleNumber && (
              <span className="text-lg font-bold pb-2">
                {"Daily Puzzle - "}
                {currentDate.toLocaleString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            )}
            {todaysPuzzle !== puzzleNumber && (
              <span className="text-lg font-bold pb-2">
                Puzzle #{puzzleNumber}
              </span>
            )}
            <GuessDisplay
              guessMap={guessMap}
              mapPointer={mapPointer}
              showEmoji={difficulty === DifficultyOptions.EMOJI}
            />
          </div>
          <div className="flex flex-initial flex-col flex-auto justify-between">
            {(showFail || showSuccess) && (
              <div className="flex flex-col flex-auto justify-center items-center">
                {puzzleType === PuzzleType.TODAY && <Countdown></Countdown>}
                <div className="flex flex-row justify-center items-center space-x-1 md:space-x-4 my-2">
                  <button
                    className="button-outline"
                    onClick={() => setOpenShareModal(true)}
                  >
                    View Results
                  </button>

                  <button
                    className="button-positive"
                    onClick={() => {
                      resetGameState();
                      ReactGA.event({
                        category: "Game State",
                        action: "Reset",
                        label: "Try Another",
                      });
                    }}
                  >
                    Try another?
                  </button>
                </div>
              </div>
            )}
            <ToastContainer
              position="top-center"
              transition={Slide}
              limit={1}
              autoClose={3000}
              hideProgressBar
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnHover
              pauseOnFocusLoss
              draggable
              theme="colored"
              closeButton={false}
            ></ToastContainer>
            <Keyboard
              qwerty={keyboardDisplay === KeyboardState.QWERTY}
              showEmoji={difficulty === DifficultyOptions.EMOJI}
              letterOptions={letterOptions}
              onSelect={onSelect}
              disableSelect={(letter) =>
                (letter.disabled && difficulty === DifficultyOptions.HARDER) ||
                showSuccess ||
                showFail
              }
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
            <a
              href="https://alexmj212.dev/blog/understanding-how-wordle-works/"
              className="underline"
            >
              How Word Guess Works
            </a>
          </div>
          <div className="flex flex-auto flex-row space-x-4 justify-start md:justify-end items-end">
            {todaysPuzzle !== puzzleNumber && <span>#{puzzleNumber}</span>}
            <span id="build">
              Build:{" "}
              {buildVersion}
            </span>
            <a
              href="https://www.github.com/alexmj212/word-guess"
              className="underline"
            >
              Source
            </a>
          </div>
        </div>
      </div>
      <Modal
        open={openRulesModal}
        setOpen={setOpenRulesModal}
        title="Guess the Hidden Word!"
      >
        <div className="flex flex-col">
          <ul className="list-disc list-inside">
            <li>The hidden word is 5 letters.</li>
            <li>Select or type letters to spell a word.</li>
            <li>{'Use "Enter" to see if you are correct.'}</li>
            <li>
              Use <BackspaceIcon className="h-6 w-6 inline-block" /> to remove
              letters from your guess.
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
      <Modal
        open={openStatsModal}
        setOpen={setOpenStatsModal}
        title="Word Guess Statistics"
      >
        <StatBlock gameLog={gameLogManager.gameLog} showFull />
        <div className="flex flex-auto flex-row justify-center mt-4">
          <ConfirmationModalContextProvider
            confirmText="Are you sure you want to reset your statistics? Your current game will be lost."
            confirmButtonText="Reset"
          >
            <ButtonWithConfirmation
              className="button-negative"
              onClick={handleStatisticsReset}
            >
              Reset Statistics
            </ButtonWithConfirmation>
          </ConfirmationModalContextProvider>
        </div>
      </Modal>
      <Modal
        open={(showSuccess || showFail) && openShareModal}
        setOpen={setOpenShareModal}
        title={"Share Your Results"}
      >
        <StatBlock gameLog={gameLogManager.gameLog} />
        {puzzleType === PuzzleType.TODAY && <Countdown></Countdown>}
        <div className="flex flex-row space-x-2 mt-4">
          <button
            className="button-outline w-full h-12"
            onClick={() => {
              navigator.clipboard
                .writeText(
                  utilities.generateShareText(guessMap, puzzleNumber, showFail)
                )
                .then(() => {
                  toast.success("Copied to clipboard");
                })
                .catch(() => {
                  toast.error("Failed to copy to clipboard");
                });
            }}
          >
            <ShareIcon className="w-6 h-6 inline-block mr-2" /> Share Results
          </button>
          <button
            className="button-positive w-full"
            onClick={() => {
              resetGameState();
              ReactGA.event({
                category: "Game State",
                action: "Reset",
                label: "Try Another",
              });
            }}
          >
            Try Another?
          </button>
        </div>
      </Modal>
      <Modal
        open={openSettingsModal}
        setOpen={setOpenSettingsModal}
        title="Settings"
      >
        <dl>
          <div className="grid-row">
            <dt className="grid-label">Difficulty</dt>
            <dd className="grid-field">
              <ConfirmationModalContextProvider
                confirmText="Are you sure you want to change the difficulty? Your current game will be lost."
                confirmButtonText="Reset"
              >
                <RadioWithConfirmation
                  keys={Object.values(DifficultyOptions)}
                  selectedValue={difficulty}
                  keyDescription={difficultyDescriptions}
                  onChange={handleDifficultyChange}
                ></RadioWithConfirmation>
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
                        <div
                          className={`check-radio ${
                            checked ? "bg-blue-400" : "bg-white"
                          }`}
                        ></div>
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
              <RadioGroup
                value={keyboardDisplay}
                onChange={handleKeyboardSwitch}
              >
                {Object.values(KeyboardState).map((keyboard) => (
                  <RadioGroup.Option key={keyboard} value={keyboard}>
                    {({ checked }) => (
                      <div className="check-group">
                        <div
                          className={`check-radio ${
                            checked ? "bg-blue-400" : "bg-white"
                          }`}
                        ></div>
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
