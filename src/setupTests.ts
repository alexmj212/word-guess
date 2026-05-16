// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";

// jsdom does not implement IntersectionObserver; @headlessui/react requires it.
global.IntersectionObserver = class IntersectionObserver {
  observe() {
    return;
  }
  unobserve() {
    return;
  }
  disconnect() {
    return;
  }
} as unknown as typeof IntersectionObserver;

// Clear localStorage before every test so state never bleeds across tests.
beforeEach(() => {
  localStorage.clear();
});
