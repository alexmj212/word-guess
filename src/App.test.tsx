import { render, screen } from "@testing-library/react";
import App from "./App";

// ---------------------------------------------------------------------------
// Smoke test — App renders without crashing
// ---------------------------------------------------------------------------

describe("App — smoke test", () => {
  it("renders the Word Guess header without crashing", () => {
    render(<App />);
    // The h1 contains "Word Guess" as text (alongside the logo img)
    expect(screen.getByRole("heading", { name: /word guess/i })).toBeInTheDocument();
  });
});
