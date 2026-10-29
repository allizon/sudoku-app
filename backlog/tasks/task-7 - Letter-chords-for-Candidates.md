---
id: TASK-7
title: Letter chords for Candidates
status: Done
assignee:
  - '@claude'
created_date: 2026-10-24 19:22
updated_date: '2026-10-29T00:17:00Z'
labels:
  - afk
milestone: m-0
dependencies:
  - TASK-6
documentation:
  - docs/spec/keymap.md
  - CONTEXT.md
ordinal: 7000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Let the player hold C or S to mark ◆CANDIDATEs without changing the ◆STICKY MODE. Builds on task-6, which provides center and corner modes and ◆CANDIDATE toggling.

Spec: keymap §3 (letter chords), all six rules, and keymap §2 (the ◆ENTRY MODE LINE follows the chord while its letter is held). A chord behaves like its mode for each digit press, including keymap §7 (a digit press does nothing on a ◆GIVEN or a ◆PLACED DIGIT). Clearing while a chord is held is task-8. Use the terms in CONTEXT.md exactly.

Known gap, deliberately left open: what the ◆ENTRY MODE LINE shows while C and S are both held (keymap §3 rule 6) is unspecified. Alix considers that case user error and not worth pursuing now; do not add behavior or tests for it, and do not list it as a spec gap in the handoff.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 While C is held, each digit press toggles that digit as a ◆CENTER MARK in the ◆SELECTED CELL
- [x] #2 While S is held, each digit press toggles that digit as a ◆CORNER MARK in the ◆SELECTED CELL
- [x] #3 Several digits can be pressed during one chord (hold C, press 1, 4, 7 → three ◆CENTER MARKs toggled)
- [x] #4 Pressing and releasing C or S with no digit does nothing
- [x] #5 Key auto-repeat from a held C or S is ignored
- [x] #6 When the window loses focus, any held chord is released
- [x] #7 A chord overrides the ◆STICKY MODE only for its digit presses; the ◆STICKY MODE is unchanged afterwards
- [x] #8 While C and S are both held, digit presses do nothing
- [x] #9 During a chord, a digit press on a ◆GIVEN or a ◆PLACED DIGIT does nothing
- [x] #10 The ◆ENTRY MODE LINE updates instantly whenever the ◆ENTRY MODE changes: while C or S is held it shows the chord's mode, and when the key is released it reverts to the ◆STICKY MODE
- [x] #11 Chord rules live in src/core/ where they are independent of the DOM and are covered by unit tests; key and focus handling, and the ◆ENTRY MODE LINE updates, are covered by UI tests
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Review round 1 (code-reviewer + ux-reviewer):
- MAJOR (both reviewers): chord stuck on macOS when C/S is released while Cmd is held; the browser sends no keyup (App.tsx:146-154). Spec rule 7 couldn't be met. Escalated to Alix, who chose: letting go of Cmd ends every chord. Spec updated. Resolution: pending implementer.
- MINOR (ux): arrows ignored in a Shift-started chord (App.tsx:235). Alix: keep it; spec §4 now says arrows do nothing while Shift is held. Resolution: no code change.
- MINOR (ux): §3 rule 5 wording ('for that keypress only') clashed with rule 1. Alix approved rewording. Resolution: Fixed in spec.
- MINOR (code): no test that the release is heard off the grid. Resolution: pending implementer.
- MINOR (code): the release-with-modifier rule is tested only with Shift. Resolution: pending implementer.
- MINOR (code): no test that window listeners are removed on unmount. Resolution: pending implementer.

Review round 1 resolutions (implementer, 351c6f2 tests + 95055e3 fix):
- MAJOR stuck chord on Cmd: Fixed. Window keyup of Meta (key 'Meta' or code MetaLeft/MetaRight) releases every held letter. Tests: MetaLeft/MetaRight, both letters held, fresh C restarts, repeat doesn't.
- MINOR release off the grid: Fixed with a test (grid.blur(), keyup on body).
- MINOR release with Ctrl/Alt/Cmd: Fixed with tests.
- MINOR listener cleanup on unmount: Fixed with a test.
Verified: 5 Cmd tests red at 351c6f2, full suite 995 green at 95055e3, typecheck clean.

Review round 2 (code-reviewer + ux-reviewer): no majors.
- MINOR (code): Cmd tests sent key and code together, so they couldn't tell the two checks apart (letter-chords-review.test.tsx:38-41). Fixed in 271812a: separate cases with key only, MetaLeft only, and MetaRight only. The implementer confirmed each case fails when its check is removed.
- MINOR (code): cleanup test required exactly one keyup and one blur listener (letter-chords-review.test.tsx:128-142). Fixed in 271812a: it now checks that every window listener added is removed.
- MINOR (ux): tapping Cmd mid-chord ends a chord whose letter is still held (App.tsx:150-153). Declined: this is the trade-off Alix chose in §3 rule 7. The browser can't report the letter's state while Cmd is down, and the line shows the chord ended.
Verified: 996 tests pass, typecheck clean, approved tests unchanged.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Hold C or S to toggle Center or Corner marks with digit presses without changing the Sticky mode (keymap §3). Chord rules are in src/core/chord.ts, with the physical-key lookup in keys.ts. App.tsx starts a chord on a C/S press on the grid. A chord ends when its letter is released anywhere in the page, when the window loses focus, or when Cmd is released. That last case exists because macOS sends no keyup for a letter released while Cmd is down; it was found in review and settled by Alix. The Entry mode line follows the chord.
Verification: 996 tests pass, including the core unit tests (chord.test.ts) and UI tests (letter-chords.test.tsx, letter-chords-review.test.tsx). Typecheck is clean. Two review rounds; no open majors.
Spec gaps listed at handoff: N during a chord; paste mid-chord; C/S press heard only on the grid; preventDefault on chord letters and on digit presses with both letters held; how Cmd is detected (key or code; Windows/Super counts too).
Risk: the Cmd fix relies on known macOS browser behavior and hasn't been seen in a real browser yet.
<!-- SECTION:FINAL_SUMMARY:END -->
