---
id: m-0
title: "M0 — Walking skeleton"
---

## Description

The whole stack, end to end: a deployed board that is fully keyboard-driven, with every input working and nothing checked. See docs/spec/milestones.md.

- Project setup: TypeScript, React, Vite, Vitest; src/core/ with the test that keeps UI imports out of it (AGENTS.md "Stack and architecture").
- Deployed to Vercel through its GitHub integration: every push to main deploys automatically.
- Grid rendering: Givens, placed digits, Center marks, and Corner marks are visibly distinct.
- Keymap, all of keymap.md except undo/redo: §1, §2, §3, §4, §5, §7, §8.
- Paste import, parsing only: import.md §2 (paste on the grid) and §3 (formats, including parse errors). Any puzzle that parses is loaded as-is — no validation.

Not in M0: anything that checks the grid or remembers history.
