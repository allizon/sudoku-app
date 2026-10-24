# Display

Status: **draft** — grid size and color scheme decided; the toggle key and whether the scheme is remembered are open.
Terms (Given, Candidate, Center mark, Corner mark, …) are defined in [`CONTEXT.md`](../../CONTEXT.md).

## 1. Grid size

- The grid is as large as the window allows, up to **1000px** wide. (Interim; may be adjusted later.)
- The whole grid, and the entry mode line under it ([`keymap.md`](./keymap.md) §2), fit in the window without scrolling.

## 2. Color scheme

- The app has a light and a dark color scheme.
- Every color the app uses (grid lines, digits, Candidates, the entry mode line, and the feedback colors in [`feedback.md`](./feedback.md)) is chosen for both schemes.
- The app starts in the light scheme. The player switches schemes with a toggle in the app; the system's light/dark setting is not used.
- The toggle is reachable from the keyboard and with the mouse ([`keymap.md`](./keymap.md) §1).
- _Open:_ which key toggles the scheme (not one of the reserved letters in [`keymap.md`](./keymap.md) §8), and whether the choice is remembered across reloads.

## 3. Not in this version

- Skins: player-selectable visual themes beyond light and dark ([`milestones.md`](./milestones.md) "Later").
