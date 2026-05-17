import { render } from "@testing-library/react";
import GuessDisplay from "./GuessDisplay";
import { LetterState } from "./App";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeLetter = (overrides: Partial<LetterState> = {}): LetterState => ({
  letter: "",
  containMatch: false,
  positionMatch: false,
  noMatch: false,
  disabled: false,
  ...overrides,
});

const blankMap = (): LetterState[][] =>
  Array.from({ length: 6 }, () => Array.from({ length: 5 }, () => makeLetter()));

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe("GuessDisplay — rendering", () => {
  it("renders 6 rows", () => {
    const { container } = render(
      <GuessDisplay
        guessMap={blankMap()}
        mapPointer={[0, 0]}
      />
    );
    // Each row is a flex div inside the outer wrapper
    const rows = container.firstChild?.childNodes;
    expect(rows).toHaveLength(6);
  });

  it("renders 5 cells per row", () => {
    const { container } = render(
      <GuessDisplay
        guessMap={blankMap()}
        mapPointer={[0, 0]}
      />
    );
    const firstRow = container.firstChild?.firstChild as HTMLElement;
    // Each cell is a .flip-card div
    const cells = firstRow.querySelectorAll(".flip-card");
    expect(cells).toHaveLength(5);
  });

  it("shows a letter from the guessMap in the correct cell", () => {
    const map = blankMap();
    map[0][0] = makeLetter({ letter: "A" });
    map[0][1] = makeLetter({ letter: "P" });

    const { container } = render(
      <GuessDisplay
        guessMap={map}
        mapPointer={[1, 0]} // cursor is past row 0 so no cursor overlay
      />
    );

    // Both front and back faces of the flip card render the letter
    const allText = container.textContent;
    expect(allText).toContain("A");
    expect(allText).toContain("P");
  });

  it("applies the 'flipped' class to rows before the current pointer row", () => {
    const map = blankMap();
    map[0] = map[0].map(() => makeLetter({ letter: "A" }));

    const { container } = render(
      <GuessDisplay
        guessMap={map}
        mapPointer={[1, 0]}
      />
    );

    const rows = container.firstChild?.childNodes;
    const firstRow = rows![0] as HTMLElement;
    const secondRow = rows![1] as HTMLElement;

    // Row 0 should be flipped, row 1 should not
    expect(firstRow.querySelector(".flip-card")).toHaveClass("flipped");
    expect(secondRow.querySelector(".flip-card")).not.toHaveClass("flipped");
  });

  it("applies position-match class on a green letter", () => {
    const map = blankMap();
    map[0][0] = makeLetter({ letter: "A", positionMatch: true });

    const { container } = render(
      <GuessDisplay
        guessMap={map}
        mapPointer={[1, 0]}
      />
    );

    const firstCell = container.querySelector(".flip-card");
    expect(firstCell?.querySelector(".flip-card-back")).toHaveClass("position-match");
  });

  it("applies contain-match class on a yellow letter", () => {
    const map = blankMap();
    map[0][0] = makeLetter({ letter: "A", containMatch: true });

    const { container } = render(
      <GuessDisplay
        guessMap={map}
        mapPointer={[1, 0]}
      />
    );

    const firstCell = container.querySelector(".flip-card");
    expect(firstCell?.querySelector(".flip-card-back")).toHaveClass("contain-match");
  });
});

// ---------------------------------------------------------------------------
// BUG-H6: duplicate keys from numeric addition `row + index`
// ---------------------------------------------------------------------------

describe("GuessDisplay — (BUG-H6) key uniqueness", () => {
  it("each cell within a single row has a unique key (no React warning within a row)", () => {
    // NOTE on BUG-H6: `key={row + index}` produces numeric-addition collisions
    // ACROSS rows (row=0,i=4 and row=1,i=3 both yield 4), but each row's cells
    // are siblings within their own parent <div>, so React only checks for
    // uniqueness within that parent. React therefore does NOT emit a warning in
    // the current layout. The bug is still a correctness hazard — if the layout
    // ever flattens rows into a single list the reconciler will malfunction —
    // but it cannot be characterised purely via console.error inspection today.
    //
    // TODO(bug-H6): fix by using key={`${row}-${index}`} in GuessDisplay.tsx:42
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(vi.fn());

    render(
      <GuessDisplay
        guessMap={blankMap()}
        mapPointer={[0, 0]}
      />
    );

    // No React duplicate-key warnings should appear (and currently none do,
    // because collisions happen across rows not within them).
    const dupKeyWarning = consoleSpy.mock.calls.some((args) =>
      args.some(
        (a) =>
          typeof a === "string" &&
          a.toLowerCase().includes("encountered two children with the same key")
      )
    );
    expect(dupKeyWarning).toBe(false);

    consoleSpy.mockRestore();
  });
});
