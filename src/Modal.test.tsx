import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Modal from "./Modal";

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe("Modal — rendering", () => {
  it("renders the title and children when open", () => {
    render(
      <Modal title="Test Title" open={true} setOpen={jest.fn()}>
        <p>Modal content</p>
      </Modal>
    );
    expect(screen.getByText("Test Title")).toBeInTheDocument();
    expect(screen.getByText("Modal content")).toBeInTheDocument();
  });

  it("does not render content when closed", () => {
    render(
      <Modal title="Hidden Title" open={false} setOpen={jest.fn()}>
        <p>Hidden content</p>
      </Modal>
    );
    expect(screen.queryByText("Hidden Title")).not.toBeInTheDocument();
    expect(screen.queryByText("Hidden content")).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Close behaviour
// ---------------------------------------------------------------------------

describe("Modal — closing", () => {
  it("calls setOpen(false) when the close button is clicked", async () => {
    const setOpen = jest.fn();
    render(
      <Modal title="Close Test" open={true} setOpen={setOpen} />
    );

    // The close button is the one with an XIcon; it's the only button rendered
    // in the modal header area.
    const buttons = screen.getAllByRole("button");
    // The first button rendered by headlessui Dialog is the close (X) button
    await userEvent.click(buttons[0]);

    expect(setOpen).toHaveBeenCalledWith(false);
  });
});
