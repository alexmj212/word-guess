// jest-dom adds custom matchers for asserting on DOM nodes.
// The /vitest entry point registers them with Vitest's expect.
import "@testing-library/jest-dom/vitest";

// jsdom does not implement IntersectionObserver; @headlessui/react requires it.
globalThis.IntersectionObserver = class IntersectionObserver {
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

// Node.js 22+ exposes a built-in localStorage stub on globalThis that lacks
// .clear(), .getItem(), .setItem(), etc. Vitest's jsdom environment sets up a
// proper localStorage on `globalThis.jsdom.window`, but the Node stub wins the
// global `localStorage` identifier because it was already on globalThis.
//
// Fix: install a simple in-memory localStorage shim that satisfies the test
// contract: clear(), getItem(), setItem(), removeItem(), and length.
function makeLocalStorageShim() {
  let store: Record<string, string> = {};
  return {
    get length() {
      return Object.keys(store).length;
    },
    key(index: number): string | null {
      return Object.keys(store)[index] ?? null;
    },
    getItem(key: string): string | null {
      return Object.prototype.hasOwnProperty.call(store, key)
        ? store[key]
        : null;
    },
    setItem(key: string, value: string): void {
      store[key] = String(value);
    },
    removeItem(key: string): void {
      delete store[key];
    },
    clear(): void {
      store = {};
    },
  };
}

// Only replace if Node's stub is missing .clear (i.e. we're on Node 22+
// and jsdom hasn't already replaced it).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const existingLocalStorage = (globalThis as any).localStorage;
if (
  typeof existingLocalStorage === "undefined" ||
  typeof existingLocalStorage.clear !== "function"
) {
  const shim = makeLocalStorageShim();
  Object.defineProperty(globalThis, "localStorage", {
    value: shim,
    writable: true,
    configurable: true,
  });
}

// Clear localStorage before every test so state never bleeds across tests.
beforeEach(() => {
  localStorage.clear();
});
