# Sudoku App — Agent Guide

A personal, keyboard-first sudoku web app, built spec-first: Alix writes the specs and approves the work; agents implement.

## Sources of truth

- **`CONTEXT.md`** is the glossary. Use its terms exactly in code, tests, and commit messages. In documentation (specs, tickets, this guide, and the bodies of `CONTEXT.md`), write every reference to a glossary term in capitals with a leading ◆, with plurals as a lowercase `s` after the capitals: ◆ENTRY MODE, ◆GIVENs. Leave code, tests, commit messages, quoted on-screen text, headings, and the `CONTEXT.md` term headings and _Avoid_ lines in plain form. When a task uses a word the glossary lacks, or uses a glossary word differently, ask Alix before writing tests.
- **Backlog.md tickets** (in `backlog/`) hold the tasks and their acceptance criteria.
- **`docs/spec/`** holds behavior, one file per feature area. Build what the spec states. When the spec is silent or ambiguous on something the tests depend on, ask during step 2; for anything smaller, make a reasonable choice and list it as a **spec gap** in the handoff (step 7).

## Stack and architecture

- TypeScript, React, Vite, Vitest. Test-driven.
- ◆PUZZLE logic lives in `src/core/` as plain TypeScript with imports only from `src/core/` itself and the standard library — no React, no DOM. A future Angular UI will reuse it unchanged. A test enforces this boundary; the first task that creates `src/core/` also creates that test.
- All saved state (the ◆PUZZLE in progress, its undo history, imported ◆PUZZLEs) is read and written through a single storage interface in `src/core/`. Browser storage is one implementation of it, so a synced store could replace it later by swapping one module. The interface is `Store` in `src/core/store.ts`.
  - **One exception:** a small script in `index.html` reads the saved color scheme straight from browser storage, so the page is drawn in the right scheme before the app's code runs (otherwise a dark-scheme player sees a light flash on every reload). The color scheme is allowed this because it is closer to a browser setting than to game state: it isn't part of the ◆PUZZLE or solving, and nothing else depends on it. The script only reads; saving still goes through `Store`. The script must use the same key and format as the browser store, so changing either means changing both. Nothing else may read or write saved state outside `Store`.
- Every color in the UI comes from a CSS token (custom property), never a color literal where it is used, so a future skin can restyle the app by supplying its own token values (`docs/spec/display.md` §2).

## Agents

The **main session** runs the workflow below: it does steps 1, 3, 6, 7, and 8 itself, dispatches the other steps to subagents, and brings Alix the two checkpoints that are theirs (steps 2 and 7).

The subagent definitions live in `.agents/claude-agents/`; Claude Code reads them through the `.claude/agents` symlink. The main session handles every Backlog.md ticket operation, including writing the review record; subagents skip the Backlog.md workflow and return their results to the main session.

| Agent           | Step | Job                                                        |
|-----------------|------|------------------------------------------------------------|
| `test-writer`   | 2    | Acceptance criteria → failing tests                        |
| `implementer`   | 4    | Make the approved tests pass                               |
| `code-reviewer` | 5    | Adversarial, read-only review against spec and this guide  |
| `ux-reviewer`   | 5    | Read-only review of player-facing behavior; UI tasks only  |

Give each subagent what its job needs: the task's acceptance criteria, the relevant spec sections, and the branch name.

## Workflow for every task

Each step ends at its **checkpoint**; move to the next step only once it is met.

1. **Branch.** Start a branch or worktree from up-to-date `main`, named `task-<n>/<short-slug>` after the task's Backlog.md ticket (e.g. `task-3/mode-aware-clearing`). Checkpoint: you are on the new branch.
2. **Tests first** — `test-writer`. Turn the task's acceptance criteria into Vitest tests that fail. Show Alix the list (each test's name and a one-line description), plus any questions. Checkpoint: Alix approves the tests.
3. **Commit red.** Commit the approved tests: `test(<area>): <summary> (§n)`. Checkpoint: the new tests fail; everything else passes.
4. **Make it green** — `implementer`. Implement until the full suite passes, leaving the approved tests as written. Commit as `feat(<area>): …` or `fix(<area>): …`; add a `refactor(<area>): …` commit if needed. Checkpoint: full suite green.
5. **Review** — `code-reviewer`, plus `ux-reviewer` when the task changes what the player sees or does. Send each finding to `implementer`, which fixes it or declines it with a reason. Record every round in the review record (below). Repeat for at most two rounds. Escalate to Alix:
   - immediately, when a finding says the **spec** is wrong or contradicts itself — that is a spec gap for Alix to settle;
   - after round 2, when major findings remain open.

   Checkpoint: no open major findings, or the open ones are escalated.
6. **Tidy.** Rebase onto `main`. Each commit on the branch is one meaningful TDD step with a clear message. Checkpoint: the branch is a clean red → green sequence on top of current `main`.
7. **Hand off.** Post a "ready to merge" note to Alix containing:
   - what changed, in a few lines
   - test results
   - **spec gaps**: every decision made that the spec didn't cover
   - review summary: rounds, findings fixed, and **every declined finding** with its reason
   - the diff command: `git diff main...<branch>`

   Checkpoint: Alix approves the merge.
8. **Merge.** `git merge --ff-only <branch>` into `main`, push `main`, delete the branch. Pushing `main` deploys to production (Vercel), so push `main` only after Alix's approval in step 7. (The one exception is the daily learning-log commit; see "Learning log".) Checkpoint: `main` contains the branch's commits and the branch is gone.

## Review record

One entry per review round. For each finding: severity (major/minor), what and where, and the resolution — **Fixed** (how) or **Declined** (why).

- **Default:** the main session adds each round to the task's Backlog.md ticket through the `backlog` CLI (`backlog task edit --help` lists the options for notes).
- **When the `backlog` CLI is unavailable** (e.g. a cloud session): write the record to `docs/reviews/<branch>.md` (with `/` in the branch name replaced by `-`), commit it on the branch, and say so in the handoff so a later session with the CLI can copy it into the ticket.

## Learning log

`LEARNING-LOG.md` records how the project is planned and built, so Alix can learn from the process, not just ship the app. The main session adds to it while the work happens, not only at the end: whenever something is decided, a question is answered, a checkpoint catches a problem, or an agent's output goes wrong (trace that back to the spec or the task). Subagents don't write to it; they report what they noticed to the main session.

- Follow the format already in the file: dated sections, newest last, short bullets under bold labels, and a **Lesson:** where one shows up.
- Say who said what: "Alix: …" (quoting Alix's words where useful), "Observation (Claude): …", "Claude's own call, flagged for review: …".
- Glossary terms stay plain in the log.
- The log lives in git but is committed once a day, not with each task:
  - During the day, write entries in the main checkout and leave them uncommitted. Never commit the log on a task branch. When a step needs a clean working tree (e.g. the rebase in step 6), stash the log first or use `git rebase --autostash`.
  - Once a day, commit the log straight to `main` as `docs(log): entries for <date>` and push. The first session on a new day does this for any entries left from earlier days, and Alix may ask for it at any time. It changes no app code, so it needs no branch, review, or approval, though the push still deploys.
  - A cloud session can't leave changes uncommitted, so it commits its entries on its own branch and says so in the handoff.

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
