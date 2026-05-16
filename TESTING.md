# Testing

## How to run

```
npm test -- --watchAll=false
```

To run a specific file:

```
npm test -- --watchAll=false --testPathPattern="GameLogManager"
```

## What is covered

| File | What is tested |
|------|----------------|
| `src/util.test.ts` | `previousGuess` (normal, edge, boundary cases), `generateShareText` (win/loss/emoji output), `generateEmojiString` (normal, empty, unknown-character silent-drop nit N1) |
| `src/GameStateManager.test.ts` | Default state shape, save/load round-trip (random key and today's key), reset, corrupted JSON fallback, missing-field schema gap (BUG-M6) |
| `src/GameLogManager.test.ts` | Default zero state, win counting, streak and max-streak math, solvedWords tracking, loss/streak reset, persistence across instances, shared-reference mutation (BUG-C2), missing-return-on-catch (BUG-C3) |
| `src/Keyboard.test.tsx` | Renders all 26 keys in qwerty and alphabet layouts, calls `onSelect`/`onBackspace`/`onSubmit` with correct args, disabled states for letters/backspace/submit, in-place sort mutation (BUG-M4) |
| `src/GuessDisplay.test.tsx` | 6 rows × 5 cells rendered, letter text from guessMap, `flipped` class on submitted rows, hint classes (position-match / contain-match), key-uniqueness context for BUG-H6 |
| `src/Modal.test.tsx` | Renders when open, does not render when closed, close button calls `setOpen(false)` |
| `src/App.test.tsx` | Smoke test: renders without crashing, header is visible |

## Intentionally failing tests (expected red)

These tests are written to **fail on the current code** and will go green once the corresponding bug is fixed. They are prefixed with `[BUG-Cx]` so CI output is unambiguous.

| Test name | Bug | Why it fails |
|-----------|-----|--------------|
| `[BUG-C2] resetGameLog should not mutate DefaultGameLog across instances` | C2 / M5 | `resetGameLog()` does `this.gameLog = DefaultGameLog` (shared reference) then mutates `lastUpdated` via `_saveGameLog()`. After a reset, every subsequent `new GameLogManager()` starts with the already-incremented stats from the mutated singleton. |
| `[BUG-C3] returns a valid gameLog when localStorage contains garbage JSON` | C3 | `_getGameLog()`'s `catch` block has no `return` statement. When JSON parsing fails, `this.gameLog` is left as `undefined` and the very next property access (`mgr.gameLog.gamesPlayed`) throws `TypeError`. |
| `[BUG-M6] throws or produces invalid state when cursorPointer is missing from saved state` | M6 | `_getGameState()` only validates `letterOptions.length`; a saved state missing `cursorPointer` is returned as-is. Accessing `cursorPointer[0]` then throws `TypeError: Cannot read properties of undefined (reading '0')`. |
| `should not mutate the letterOptions prop array order` (Keyboard BUG-M4) | M4 | `Keyboard.tsx` calls `letterOptions.sort(...)` directly, mutating the caller's state array in place. After render the original array's order reflects the sorted result. Fix: `[...letterOptions].sort(...)`. |

## What is not covered and why

- **Full game-loop integration** (`onSelect` → `validateWord` → stat update): `validateWord` and the surrounding game logic in `App.tsx` are deeply coupled to React state, multiple side effects, and react-toastify. Testing them requires either a full mount with mocked word lists and timers, or an architectural extraction that hasn't happened yet.
- **H2 (`puzzleNumber === 0` falsy bug)**: `setGameState` lives inside `App.tsx` and is not exported; it is only reachable via a full component interaction chain. Worth testing once the game loop is extracted to a hook.
- **H3 (hard mode doesn't enforce position)**: Same coupling issue — the enforcement lives inside `onSubmit` in `App.tsx`. Characterising it requires setting up a guessed row with a green letter and then triggering a second submit, which requires the full game mount with mocked word lists.
- **H5 (redundant `indexOf` in `generateNewPuzzle`)**: No deterministic surface — `generateNewPuzzle` calls `Math.random` internally and returns void; the only observable effect is which word is set in React state. Worth testing with `jest.spyOn(Math, 'random')` once the function is extracted.
- **M1/M3 (`determineDifficulty` stale-state return)**: `determineDifficulty` is a closure inside `App` that reads from React state via `useState`. Testing the return value requires mounting `App` and reading state, which requires the full game-loop test harness.
- **C1 (direct mutation of React state)**: The bug is in `onSelect` and `onBackspace` mutating `guessMap` before calling any setter. It "works" under React 17's synchronous renderer. There is no pure-function surface to test; the correct characterization is a concurrent-mode integration test.
