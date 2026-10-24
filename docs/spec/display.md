# Display

Status: **draft, all sections decided** — awaiting Alix's review.
Terms (Given, Candidate, Center mark, Corner mark, …) are defined in [`CONTEXT.md`](../../CONTEXT.md).

## 1. Grid size

- The grid is as large as the window allows, up to **1000px** wide. (Interim; may be adjusted later.)
- The whole grid, and the entry mode line under it ([`keymap.md`](./keymap.md) §2), fit in the window without scrolling.

## 2. Color scheme

- The app has a light and a dark color scheme.
- Every color the app uses (grid lines, digits, Candidates, the entry mode line, and the feedback colors in [`feedback.md`](./feedback.md)) is chosen for both schemes.
- Every color is set through a CSS token (a CSS custom property); no color is written directly where it is used. Each scheme is a set of token values, so a future skin (§3) can change the app's appearance by supplying its own.
- The app starts in the light scheme. The player switches schemes with a toggle in the app; the system's light/dark setting is not used.
- The toggle is mouse-only, with no key. This is a setting, not part of solving, so it is an exception to "fully playable from the keyboard" ([`keymap.md`](./keymap.md) §1).
- The chosen scheme is remembered across reloads, saved through the storage interface ([`AGENTS.md`](../../AGENTS.md) "Stack and architecture").

## 3. Not in this version

- Skins: player-selectable visual themes beyond light and dark ([`milestones.md`](./milestones.md) "Later").
