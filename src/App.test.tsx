import { render, screen } from "@testing-library/react";
import App from "./App";

// ---------------------------------------------------------------------------
// Smoke test — App renders without crashing
// ---------------------------------------------------------------------------

describe("App — smoke test", () => {
  it("renders the Word Guess header without crashing", () => {
    render(<App />);
    // @headlessui/react 1.7+ uses aria-modal="true" on the Dialog, which means
    // testing-library's role queries only see inside the dialog when it is open.
    // The rules modal auto-opens on first visit (gamesPlayed === 0), so we
    // query by text rather than role to reach the h1 outside the modal.
    expect(screen.getByText("Word Guess")).toBeInTheDocument();
  });
});
