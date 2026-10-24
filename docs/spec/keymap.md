# Keymap

Status: **draft, all sections decided** — awaiting Alix's review.
Terms (Given, Candidate, Center mark, Corner mark, …) are defined in [`CONTEXT.md`](../../CONTEXT.md).

## 1. Principles

- The app is fully playable from the keyboard; the mouse is never required.
- Digit keys are identified by **physical key**, not by the character produced (e.g. a key that types `!` with Shift held is still "1").
- Cmd + digit is never used (on macOS the browser reserves it for tab switching).

## 2. Entry modes

There are three **entry modes**: _fill_, _center_, and _corner_.

| Mode   | A digit key…                                   |
|--------|------------------------------------------------|
| fill   | places that digit in the selected cell         |
| center | toggles that digit as a Center mark            |
| corner | toggles that digit as a Corner mark            |

- `N` cycles the sticky mode: fill → center → corner → fill.
- The current mode is always visible on screen.

## 3. Letter chords

Chords apply a mode to digit presses without changing the sticky mode.

| Chord           | Effect                                    |
|-----------------|-------------------------------------------|
| `C` + digit     | toggles that digit as a Center mark       |
| `S` + digit     | toggles that digit as a Corner mark       |

Rules:

1. A chord is active for as long as its letter is held. Several digits can be pressed during one chord (hold `C`, press 1, 4, 7 → three Center marks toggled).
2. `C` or `S` pressed and released with no digit does nothing.
3. Key auto-repeat from a held letter is ignored.
4. If the window loses focus, any held chord is released.
5. A chord overrides the sticky mode for that keypress only; the sticky mode is unchanged afterwards.
6. If `C` and `S` are both held, no chord applies and digit presses do nothing.

## 4. Movement

- Exactly one cell is selected at all times. A newly opened puzzle selects row 1, column 1.
- Arrow keys move the selection one cell.
- Movement wraps within the same row or column: right from column 9 → column 1 of the same row; down from row 9 → row 1 of the same column (and likewise for left and up).
- Cells holding Givens can be selected.
- Letter keys do not move the selection.

## 5. Clearing

Delete and Backspace behave identically and clear one layer of the selected cell, chosen by the active mode (sticky mode, or chord if one is held):

| Active mode              | Delete / Backspace…                                                                 |
|--------------------------|-------------------------------------------------------------------------------------|
| fill                     | removes the placed digit, revealing any hidden Candidates; nothing if no digit      |
| center (or `C` held)     | removes all Center marks in the cell                                                |
| corner (or `S` held)     | removes all Corner marks in the cell                                                |

`X` clears **everything** from the selected cell — placed digit, Center marks, and Corner marks — regardless of mode.

On a Given, neither Delete/Backspace nor `X` does anything.

## 6. Undo / redo

| Keys                                              | Action |
|---------------------------------------------------|--------|
| Cmd+Z (macOS) / Ctrl+Z                            | undo   |
| Shift+Cmd+Z (macOS) / Shift+Ctrl+Z / Ctrl+Y       | redo   |

What counts as one undo step:

- Each change to the grid is one step: placing, removing, or replacing a digit; toggling one Candidate; one Delete/Backspace; one `X`.
- Placing a digit and the Elimination it causes are one step together ([`feedback.md`](./feedback.md) §3).
- Each digit pressed during a chord is its own step. Hold `C`, press 1, 2, 3 → undo removes 3, then 2, then 1.
- Moving the selection and changing the sticky mode are **not** undo steps.

Rules:

- Undo restores the cell exactly as it was, including hidden Candidates and Corner marks (e.g. undoing `X` brings everything back).
- Undo/redo history is saved with the game and survives a page refresh.
- Making a new change after undoing discards the redo history.

## 7. Interaction with Givens and placed digits

Pressing a digit in **fill** mode, by what the selected cell holds:

| The cell holds…              | Result                                                                                   |
|------------------------------|------------------------------------------------------------------------------------------|
| a Given                      | nothing happens                                                                          |
| the same placed digit        | the digit is removed (toggle)                                                            |
| a different placed digit     | the new digit replaces it                                                                |
| only Candidates (or nothing) | the digit is placed; any Candidates are hidden, not deleted, and reappear if the digit is later removed |

In **center** or **corner** mode, or with a chord held:

- On a cell holding a Given or a placed digit, a digit press does nothing.

## 8. Reserved keys

Letters with a meaning: `N`, `C`, `S`, `X`, `I` (opens import — see [`import.md`](./import.md) §2). New features must choose other letters.

## 9. Not in this version

- Selecting multiple cells at once (e.g. Shift+arrow). Deferred to a later milestone; it changes the behavior of every other key, so it will be specified as its own change.
