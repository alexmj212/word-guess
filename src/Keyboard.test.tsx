import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Keyboard from "./Keyboard";
import { LetterState } from "./App";
import { alphabet, qwertyKeyboard } from "./wordList";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeLetter = (letter: string, overrides: Partial<LetterState> = {}): LetterState => ({
  letter,
  containMatch: false,
  positionMatch: false,
  noMatch: false,
  disabled: false,
  ...overrides,
});

/** Build a full 26-letter set in alphabet order. */
const alphabetLetters = (): LetterState[] =>
  alphabet.map((l) => makeLetter(l));

/** Build a full 26-letter set in qwerty order (as App.tsx provides them). */
const qwertyLetters = (): LetterState[] =>
  qwertyKeyboard.map((l) => makeLetter(l));

const defaultProps = {
  onSelect: vi.fn(),
  disableSelect: () => false,
  onSubmit: vi.fn(),
  disableSubmit: false,
  onBackspace: vi.fn(),
  disableBackspace: false,
};

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe("Keyboard — rendering", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all 26 letter buttons in qwerty mode", () => {
    render(
      <Keyboard
        {...defaultProps}
        letterOptions={qwertyLetters()}
        qwerty={true}
      />
    );
    alphabet.forEach((letter) => {
      expect(screen.getByTitle(letter)).toBeInTheDocument();
    });
  });

  it("renders all 26 letter buttons in alphabet mode", () => {
    render(
      <Keyboard
        {...defaultProps}
        letterOptions={alphabetLetters()}
        qwerty={false}
      />
    );
    alphabet.forEach((letter) => {
      expect(screen.getByTitle(letter)).toBeInTheDocument();
    });
  });

  it("renders the Backspace button", () => {
    render(
      <Keyboard
        {...defaultProps}
        letterOptions={alphabetLetters()}
        qwerty={false}
      />
    );
    expect(screen.getByTitle("Backspace")).toBeInTheDocument();
  });

  it("renders the Enter/Guess button", () => {
    render(
      <Keyboard
        {...defaultProps}
        letterOptions={alphabetLetters()}
        qwerty={false}
      />
    );
    expect(screen.getByTitle("Guess Word")).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Interaction
// ---------------------------------------------------------------------------

describe("Keyboard — interaction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls onSelect with the correct letter when a key is clicked", async () => {
    const onSelect = vi.fn();
    render(
      <Keyboard
        {...defaultProps}
        onSelect={onSelect}
        letterOptions={alphabetLetters()}
        qwerty={false}
      />
    );
    await userEvent.click(screen.getByTitle("A"));
    expect(onSelect).toHaveBeenCalledWith("A");
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("calls onBackspace when the Backspace button is clicked", async () => {
    const onBackspace = vi.fn();
    render(
      <Keyboard
        {...defaultProps}
        onBackspace={onBackspace}
        letterOptions={alphabetLetters()}
        qwerty={false}
      />
    );
    await userEvent.click(screen.getByTitle("Backspace"));
    expect(onBackspace).toHaveBeenCalledTimes(1);
  });

  it("calls onSubmit when the Enter button is clicked", async () => {
    const onSubmit = vi.fn();
    render(
      <Keyboard
        {...defaultProps}
        onSubmit={onSubmit}
        letterOptions={alphabetLetters()}
        qwerty={false}
      />
    );
    await userEvent.click(screen.getByTitle("Guess Word"));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// Disabled states
// ---------------------------------------------------------------------------

describe("Keyboard — disabled states", () => {
  it("disables a letter button when disableSelect returns true for it", () => {
    render(
      <Keyboard
        {...defaultProps}
        disableSelect={(l) => l.letter === "A"}
        letterOptions={alphabetLetters()}
        qwerty={false}
      />
    );
    expect(screen.getByTitle("A")).toBeDisabled();
    expect(screen.getByTitle("B")).not.toBeDisabled();
  });

  it("disables the submit button when disableSubmit is true", () => {
    render(
      <Keyboard
        {...defaultProps}
        disableSubmit={true}
        letterOptions={alphabetLetters()}
        qwerty={false}
      />
    );
    expect(screen.getByTitle("Guess Word")).toBeDisabled();
  });

  it("disables the backspace button when disableBackspace is true", () => {
    render(
      <Keyboard
        {...defaultProps}
        disableBackspace={true}
        letterOptions={alphabetLetters()}
        qwerty={false}
      />
    );
    expect(screen.getByTitle("Backspace")).toBeDisabled();
  });
});

// ---------------------------------------------------------------------------
// BUG-M4: sort mutates the prop array in place
// ---------------------------------------------------------------------------

describe("Keyboard — (BUG-M4) sort mutation", () => {
  it("should not mutate the letterOptions prop array order", () => {
    // Provide letters in alphabet order and ask for qwerty rendering.
    // After render, if M4 is present, the original array is sorted in-place
    // and its order will match qwerty rather than the original alphabet order.
    const options = alphabetLetters(); // A, B, C ... Z
    const originalFirstLetter = options[0].letter; // "A"

    render(
      <Keyboard
        {...defaultProps}
        letterOptions={options}
        qwerty={true}
      />
    );

    // If the component mutated the array, options[0].letter would now be "Q"
    expect(options[0].letter).toBe(originalFirstLetter);
  });
});
