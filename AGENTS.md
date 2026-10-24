# Sudoku App — Agent Guide

A personal, keyboard-first sudoku web app, built spec-first: Alix writes the specs and approves the work; agents implement.

## Sources of truth

- **`CONTEXT.md`** is the glossary. Use its terms exactly in code, tests, and commit messages. When a task uses a word the glossary lacks, or uses a glossary word differently, ask Alix before writing tests.
- **`docs/spec/`** holds behavior, one file per feature area. Build what the spec states. When the spec is silent or ambiguous on something your tests depend on, ask during step 2; for anything smaller, make a reasonable choice and list it as a **spec gap** in the handoff (step 6).

## Stack and architecture

- TypeScript, React, Vite, Vitest. Test-driven.
- Game logic lives in `src/core/` as plain TypeScript with imports only from `src/core/` itself and the standard library — no React, no DOM. A future Angular UI will reuse it unchanged. A test enforces this boundary; the first task that creates `src/core/` also creates that test.

## Workflow for every task

Each step ends at its **checkpoint**; move to the next step only once it is met.

1. **Branch.** Start a branch or worktree from up-to-date `main`, named `<area>/<short-slug>` (e.g. `keymap/mode-aware-clearing`). Checkpoint: you are on the new branch.
2. **Tests first.** Turn the task's acceptance criteria into Vitest tests that fail. Show Alix the list (each test's name and a one-line description), plus any questions. Checkpoint: Alix approves the tests.
3. **Commit red.** Commit the approved tests: `test(<area>): <summary> (§n)`. Checkpoint: the new tests fail; everything else passes.
4. **Make it green.** Implement until the full suite passes. Commit as `feat(<area>): …` or `fix(<area>): …`; add a `refactor(<area>): …` commit if needed. Checkpoint: full suite green.
5. **Tidy.** Rebase onto `main`. Each commit on the branch is one meaningful TDD step with a clear message. Checkpoint: the branch is a clean red → green sequence on top of current `main`.
6. **Hand off.** Post a "ready to merge" note to Alix containing:
   - what changed, in a few lines
   - test results
   - **spec gaps**: every decision you made that the spec didn't cover
   - the diff command: `git diff main...<branch>`

   Checkpoint: Alix approves the merge.
7. **Merge.** `git merge --ff-only <branch>` into `main`, push `main`, delete the branch. Checkpoint: `main` contains the branch's commits and the branch is gone.

## Commit messages

Conventional commits. Scope is the spec area; end the subject with the spec section it implements, e.g. `feat(keymap): mode-aware clearing (§5)`. A `test:` commit is expected to fail on `main` until the next commit lands.

<!-- BACKLOG.MD GUIDELINES START -->
<!-- backlog.md-instructions-version: 1.55.3 -->
<CRITICAL_INSTRUCTION>

## Backlog.md Workflow

This project uses Backlog.md for task and project management.

**At the beginning of each conversation in this project, run `backlog instructions overview` before answering or taking action. Re-read it only if you have not read it yet in the current conversation.**

Use the overview to decide whether to search, read, create, or update Backlog tasks.

Before task lifecycle actions, read the matching detailed guide:
- `backlog instructions task-creation` before creating or splitting tasks
- `backlog instructions task-execution` before planning, changing status or assignee, adding a plan or implementation notes, or implementing task work
- `backlog instructions task-finalization` before checking acceptance criteria, writing final summaries, or moving tasks to terminal statuses

Use `backlog <command> --help` before running unfamiliar commands. Help shows options, fields, and examples.

Do not edit Backlog task, draft, document, decision, or milestone markdown files directly. Use the `backlog` CLI so metadata, relationships, and history stay consistent.

</CRITICAL_INSTRUCTION>
<!-- BACKLOG.MD GUIDELINES END -->
