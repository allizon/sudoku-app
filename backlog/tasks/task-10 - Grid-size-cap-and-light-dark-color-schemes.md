---
id: TASK-10
title: Grid size cap and light/dark color schemes
status: In Progress
assignee:
  - '@claude'
created_date: '2026-10-24T20:20:00Z'
updated_date: '2026-10-26T02:04:00Z'
labels:
  - afk
milestone: m-0
dependencies:
  - TASK-1
documentation:
  - docs/spec/display.md
  - AGENTS.md
  - CONTEXT.md
ordinal: 9000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Implements docs/spec/display.md §1 (grid size) and §2 (color scheme). task-1 built the empty grid (src/ui/App.tsx, App.css) with cells capped at 58px and light colors only. This task raises the cap so the grid grows up to 1000px wide, and adds a dark color scheme with a mouse-only toggle (no key; display.md §2 makes it an exception to keymap §1), so every later color (the ◆ENTRY MODE LINE in task-6, ◆CANDIDATEs, M1 feedback colors) is chosen for both schemes. The chosen scheme is remembered across reloads through the single storage interface in src/core/ (AGENTS.md "Stack and architecture"); this is the first saved state, so this task likely introduces that interface, whose shape is not yet specified: propose it to Alix at the test step. The interface lives in src/core/; the browser-storage implementation lives outside core (e.g. src/storage/). Use CONTEXT.md terms exactly.

Preparation for skins (later; display.md §3): every color on the site is configurable through CSS tokens (custom properties), so that a future skin can change the app's appearance by supplying its own token values. The light and dark schemes are each a set of token values. Skins themselves are not built here: no skin picker, no skin loading. App.css currently has color literals (e.g. #222, #fafafa, #fff, #8a8a8a) that move into tokens. Later tasks take their colors from tokens too.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The grid grows with the window up to 1000px wide
- [ ] #2 The whole grid fits in the window without scrolling, at small and large window sizes
- [ ] #3 The app starts in the light color scheme, whatever the system light/dark setting
- [ ] #4 A mouse-only toggle switches between the light and dark color schemes; no key is mapped to it
- [ ] #5 The chosen color scheme is remembered across reloads, saved through the storage interface in src/core/
- [ ] #6 Grid lines and box lines meet at least 3:1 contrast in both schemes
- [ ] #7 Every color the app draws comes from a CSS token (custom property); App.css has no color literals outside the token definitions
- [ ] #8 The light and dark color schemes are each defined purely as token values, so a set of token values is all a future skin needs to supply
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Review round 1 (code-reviewer + ux-reviewer)
- R1 major — Toasts went to the bottom whenever width < 1448px, even with room beside a height-limited grid (e.g. 1440×900), against milestones.md M0. **Fixed**: placement measured from the drawn grid (src/ui/toast-placement.ts, data-placement), rem-aware; tests in display-review.test.ts.
- R2 minor — Dark focus flash dropped thin grid lines to 2.52:1. **Fixed**: dark thin line #6b7280 → #7a8190 (3.1:1 vs flash, 4.2:1 vs cells); tests for lines vs flash in both schemes.
- R3 minor — Bottom toast stack could cover the toggle. **Fixed**: toggle has fixed width; bottom stack starts right of it; tested.
- R4 minor — CSS color-scheme not set for dark (light scrollbars). **Fixed**: :root color-scheme: light; App and index.html script set inline color-scheme on <html> (dark rule must stay tokens-only).
- R5 minor — outline: 2px solid transparent written in place. **Declined**: draws no color; exists for forced-colors mode where the browser picks a system color; tokenizing would let a skin break that.
- R6 minor — Toggle's on state shown only by border color. **Fixed**: ○ Dark / ● Dark (dot aria-hidden); accessible name and aria-pressed unchanged.
- R7 minor — Toggle didn't return focus to the grid if it had already lost it. **Fixed**: toggle focuses the grid; tested.
- R8 minor — data-color-scheme left on <html> after unmount. **Fixed**: layout-effect cleanup.
- R9 minor (spec question, settled by Alix) — Light flash on reload in dark. **Fixed**: read-only inline script in index.html; exception recorded in AGENTS.md and display.md §2 (b89bdf4); tests incl. a key/format drift check.
- Also noted, minor: focus-flash contrast question made moot by R2.

## Review round 2 (code-reviewer + ux-reviewer) — no major findings
- S1 minor — Toast-placement test hardcoded 12rem/2rem, so ROOM_BESIDE_REM and App.css could drift. **Fixed**: test reads the clamp minimum and margins from App.css.
- S2 minor — Nothing checked that the beside rule overrides the fallback. **Fixed**: cascade test (no .toasts rule in at-rules; only the two data-placement rules set position/size).
- S3 minor — Placement re-measured only on window resize. **Fixed**: ResizeObserver on the grid (skipped where missing), plus window resize for the capped case.
- S4 minor — Bottom stack off-center, covers the hint, narrower stack wraps sooner. **Fixed with trade-off**: symmetric inset keeps it centered and clear of the toggle (toggle narrowed to 4rem); on short windows a toast still covers the hint while shown (no room for both without shrinking the grid).
- S5 minor — Dark box vs thin line fell to 2.09:1. **Fixed**: dark box line #c4c9d2 (2.35:1 vs thin lines).
- S6 minor — Overlong doc comment in Toasts.tsx. **Fixed**.
- S7 (Alix approved) — Removed the obsolete pinned @media (width < 1448px) test and CSS block; placement now only via data-placement, starting 'below' before measuring.
<!-- SECTION:NOTES:END -->
