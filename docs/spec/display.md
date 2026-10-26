# Display

Status: **draft, all sections decided** — awaiting Alix's review.
Terms (◆GIVEN, ◆CANDIDATE, ◆CENTER MARK, ◆CORNER MARK, …) are defined in [`CONTEXT.md`](../../CONTEXT.md).

## 1. Grid size

- The grid is as large as the window allows, up to **1000px** wide. (Interim; may be adjusted later.)
- The whole grid, and the ◆ENTRY MODE LINE under it ([`keymap.md`](./keymap.md) §2), fit in the window without scrolling.

## 2. Color scheme

- The app has a light and a dark color scheme.
- Every color the app uses (grid lines, digits, ◆CANDIDATEs, the ◆ENTRY MODE LINE, and the feedback colors in [`feedback.md`](./feedback.md)) is chosen for both schemes.
- Every color is set through a CSS token (a CSS custom property); no color is written directly where it is used. Each scheme is a set of token values, so a future skin (§3) can change the app's appearance by supplying its own. Each color token holds only a color (line widths and other sizes are separate tokens), so a skin supplies colors and nothing else.
- The app starts in the light scheme. The player switches schemes with a toggle in the app; the system's light/dark setting is not used.
- The toggle is mouse-only, with no key. It is also left out of the Tab order, so no key reaches it. This is a setting, not part of solving, so it is an exception to "fully playable from the keyboard" ([`keymap.md`](./keymap.md) §1).
- In both schemes, grid lines and box lines meet at least 3:1 contrast against the background, and text (◆GIVENs, ◆PLACED DIGITs, the hint line, toasts) meets at least 4.5:1.
- The chosen scheme is remembered across reloads, saved through the storage interface ([`AGENTS.md`](../../AGENTS.md) "Stack and architecture").
- On a reload, the page is drawn in the chosen scheme from the start, with no flash of the other scheme. To do that, a script in the page reads the saved scheme before the app loads, outside the storage interface. This exception is allowed because the color scheme is closer to a browser setting than to game state: it isn't part of the ◆PUZZLE or solving (AGENTS.md records the exception).

## 3. Not in this version

- Skins: player-selectable visual themes beyond light and dark ([`milestones.md`](./milestones.md) "Later").
