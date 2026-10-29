# Keymap

Status: **draft, all sections decided** — awaiting Alix's review.
Terms (◆GIVEN, ◆CANDIDATE, ◆CENTER MARK, ◆CORNER MARK, …) are defined in [`CONTEXT.md`](../../CONTEXT.md).

## 1. Principles

- The app is fully playable from the keyboard. The mouse is allowed but never required: clicking a cell makes it the ◆SELECTED CELL.
- Digit keys are identified by **physical key**, not by the character produced (e.g. a key that types `!` with Shift held is still "1").
- The number-row keys (1–9) and the numpad keys (1–9) both count as digit keys. `0` is not a digit key.
- Cmd + digit is never used (on macOS the browser reserves it for tab switching). Ctrl + digit and Alt + digit are never used either. Shift + digit is a digit press.
- Key auto-repeat is ignored: holding a digit key acts once, on the first press.

## 2. Entry modes

There are three **◆ENTRY MODEs**: _fill_, _center_, and _corner_.

| Mode   | A digit key…                                   |
|--------|------------------------------------------------|
| fill   | places that digit in the ◆SELECTED CELL         |
| center | toggles that digit as a ◆CENTER MARK            |
| corner | toggles that digit as a ◆CORNER MARK            |

- `N` cycles the ◆STICKY MODE: fill → center → corner → fill. Like the digit keys ([§1](#1-principles)), `N` is identified by physical key; Shift + `N` cycles too, Cmd/Ctrl/Alt + `N` is left to the browser, and key auto-repeat is ignored.
- The app starts in fill mode. The ◆STICKY MODE is not remembered across a reload, and an accepted import starts in fill mode ([`import.md`](./import.md) §5).
- The current mode is always visible on screen, as a small line of text under the grid naming the mode. Its color depends on the mode: gray for fill, blue for center, green for corner, with shades suited to each color scheme ([`display.md`](./display.md) §2).
- This line updates instantly whenever the mode changes. While a chord's letter is held ([§3](#3-letter-chords)), it shows the chord's mode; when the letter is released, it reverts to the ◆STICKY MODE.
- The ◆ENTRY MODE LINE reads "Fill mode", "Center mode", or "Corner mode". Screen readers announce it politely when the mode changes.

## 3. Letter chords

Chords apply a mode to digit presses without changing the ◆STICKY MODE.

| Chord           | Effect                                    |
|-----------------|-------------------------------------------|
| `C` + digit     | toggles that digit as a ◆CENTER MARK       |
| `S` + digit     | toggles that digit as a ◆CORNER MARK       |

Rules:

1. A chord is active for as long as its letter is held. Several digits can be pressed during one chord (hold `C`, press 1, 4, 7 → three ◆CENTER MARKs toggled).
2. `C` or `S` pressed and released with no digit does nothing.
3. Key auto-repeat from a held letter is ignored. A repeat with no first press before it (e.g. returning to the window with `C` still held) starts no chord; pressing the letter again does.
4. If the window loses focus, any held chord is released.
5. A chord overrides the ◆STICKY MODE for digit presses made while the letter is held; the ◆STICKY MODE is unchanged afterwards. While the letter is held, the ◆ENTRY MODE LINE shows the chord's mode ([§2](#2-entry-modes)).
6. If `C` and `S` are both held, no chord applies and digit presses do nothing. Releasing one of them while the other stays held brings back the other's chord.
7. Like `N` ([§2](#2-entry-modes)), `C` and `S` are identified by physical key. Shift + `C`/`S` starts a chord; Cmd/Ctrl/Alt + `C`/`S` starts no chord and is left to the browser (so Cmd+C still copies). Releasing the letter ends the chord whatever modifiers are held at the time. Letting go of Cmd also ends every held chord, because on macOS the browser doesn't report a letter released while Cmd is down; if the letter is in fact still held, press it again to resume.

## 4. Movement

- Exactly one cell is selected at all times. A newly opened ◆PUZZLE selects row 1, column 1.
- Arrow keys move the selection one cell. While Shift is held they do nothing, chord or not (Shift + arrow is reserved; see [§9](#9-not-in-this-version)).
- Movement wraps within the same row or column: right from column 9 → column 1 of the same row; down from row 9 → row 1 of the same column (and likewise for left and up).
- Cells holding ◆GIVENs can be selected.
- Letter keys do not move the selection.

## 5. Clearing

Delete and Backspace behave identically and clear one layer of the ◆SELECTED CELL, chosen by the active mode (◆STICKY MODE, or chord if one is held):

| Active mode              | Delete / Backspace…                                                                 |
|--------------------------|-------------------------------------------------------------------------------------|
| fill                     | removes the ◆PLACED DIGIT, revealing any hidden ◆CANDIDATEs; nothing if no digit      |
| center (or `C` held)     | removes all ◆CENTER MARKs in the cell                                                |
| corner (or `S` held)     | removes all ◆CORNER MARKs in the cell                                                |

On a cell holding a ◆PLACED DIGIT, Delete/Backspace in center or corner mode (or with `C` or `S` held) does nothing: the ◆CANDIDATEs hidden under the digit are kept. Delete/Backspace never deletes hidden ◆CANDIDATEs.

`X` clears **everything** from the ◆SELECTED CELL — ◆PLACED DIGIT, ◆CENTER MARKs, and ◆CORNER MARKs, including hidden ones — regardless of mode.

On a ◆GIVEN, neither Delete/Backspace nor `X` does anything.

## 6. Undo / redo

| Keys                                              | Action |
|---------------------------------------------------|--------|
| Cmd+Z (macOS) / Ctrl+Z                            | undo   |
| Shift+Cmd+Z (macOS) / Shift+Ctrl+Z / Ctrl+Y       | redo   |

What counts as one undo step:

- Each change to the grid is one step: placing, removing, or replacing a digit; toggling one ◆CANDIDATE; one Delete/Backspace; one `X`.
- Placing a digit and the ◆ELIMINATION it causes are one step together ([`feedback.md`](./feedback.md) §3).
- Each digit pressed during a chord is its own step. Hold `C`, press 1, 2, 3 → undo removes 3, then 2, then 1.
- Moving the selection and changing the ◆STICKY MODE are **not** undo steps.

Rules:

- Undo restores the cell exactly as it was, including hidden ◆CANDIDATEs and ◆CORNER MARKs (e.g. undoing `X` brings everything back).
- Undo/redo history is saved with the ◆PUZZLE and survives a page refresh.
- Making a new change after undoing discards the redo history.

## 7. Interaction with Givens and placed digits

Pressing a digit in **fill** mode, by what the ◆SELECTED CELL holds:

| The cell holds…              | Result                                                                                   |
|------------------------------|------------------------------------------------------------------------------------------|
| a ◆GIVEN                      | nothing happens                                                                          |
| the same ◆PLACED DIGIT        | the digit is removed (toggle)                                                            |
| a different ◆PLACED DIGIT     | the new digit replaces it                                                                |
| only ◆CANDIDATEs (or nothing) | the digit is placed; any ◆CANDIDATEs are hidden, not deleted, and reappear if the digit is later removed |

In **center** or **corner** mode, or with a chord held:

- On a cell holding a ◆GIVEN or a ◆PLACED DIGIT, a digit press does nothing.

## 8. Reserved keys

Letters with a meaning: `N`, `C`, `S`, `X`, `I` (opens import — see [`import.md`](./import.md) §2). New features must choose other letters.

Escape, while the grid has focus, dismisses every toast ([`milestones.md`](./milestones.md) M0). While the replace-puzzle confirmation has focus, Escape cancels it instead ([`import.md`](./import.md) §2).

## 9. Not in this version

- Selecting multiple cells at once (e.g. Shift+arrow). Deferred to a later milestone; it changes the behavior of every other key, so it will be specified as its own change.
