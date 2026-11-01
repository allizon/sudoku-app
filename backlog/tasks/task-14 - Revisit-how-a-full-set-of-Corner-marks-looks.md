---
id: TASK-14
title: Revisit how a full set of Corner marks looks
status: Done
assignee: []
created_date: '2026-10-28T02:06:00Z'
updated_date: '2026-11-01T02:19:00Z'
labels:
  - display
milestone: m-0
dependencies: []
references:
  - src/ui/App.css
documentation:
  - docs/spec/display.md
type: bug
ordinal: 12000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Alix looked at task-6 in a real browser: everything fits, but they don't like how a cell looks when it holds many ◆CORNER MARKs ("the way the corner boxes look when full"). Alix hasn't said yet what bothers them about it, so ask before changing anything.

Current layout (display.md §3, App.css `.corner-marks` / `.corner-mark:nth-child`): the four corners fill first, then the middles of the top, bottom, left and right edges, with a ninth along the top edge between the top-left corner and the top middle. The marks are inset at least 7px to clear the ◆SELECTED CELL's ring, and they shrink on cells under ~42px so all nine fit. Tests in src/ui/candidates-layout.test.ts check the marks don't overlap; they model digit width as 0.6em.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Alix has said what they want changed about a cell full of ◆CORNER MARKs, and the change is recorded in display.md §3
- [x] #2 A cell holding all nine ◆CORNER MARKs looks the way Alix approved, checked in a real browser at desktop and phone sizes
- [x] #3 ◆CORNER MARKs still don't overlap each other or the ◆SELECTED CELL's ring at any grid size
<!-- AC:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-11-01T02:14:00Z

---

Review Round 1 (2026-10-28): code-reviewer and ux-reviewer. No major or minor findings. Implementation approved. AC #2 requires Alix to verify the 3×3 grid in a real browser at desktop and phone sizes.

---
<!-- COMMENTS:END -->
