# Sudoku App — Learning Log

A running record of how this project is being planned and built, kept to learn from the *process*, not just ship the app.

**Why this project exists (the real goal):** practice using AI agentic tools for app development, specifically getting better at (1) thinking through and writing specs, and (2) breaking work down into manageable, orderable chunks. Agents mostly drive the implementation; Alix may do some hands-on work.

Each entry: what we did, what was decided, and what we learned about specs/breakdown. When an agent's output goes sideways, trace it back to the spec or the chunk and note it here.

---

## 2026-10-23 — Reframing the project

**Where things stood**
- Existing note (`alixnotes/1. Projects/Sudoku App.md`, created 2026-08-26) was dormant. Alix's assessment: "not a spec, it's barely a project sketch."
- `sudoku-app/` folder is empty; no code yet.

**Decided**
- The learning goal is agentic development practice; sudoku is the practice field, chosen because it's the most enticing project available. Fun matters.
- Focus skills: spec-writing and work breakdown, which also apply to Alix's day job as an engineering manager.
- Agents mostly drive; planning matters more than hands-on coding.
- Keep this log in the project folder.

**Working principles (Alix's own words)**
- Keep particular tasks pretty focused when possible; bigger chunks are sometimes necessary.
- Goal: make the work plan detailed *without being micro-manage-y*.

**Inconsistencies found in the sketch (unresolved)**
- sudoku.com is listed as the seed-puzzle source under "Decisions locked," but called a "source of LAST resort" under "import specifics."
- Color semantics: "Open questions" already narrows it (a single toggle color in v1), but "Actions" still lists "Decide color semantics."
- "In (QI / cheap)" vs. "In Q1" — typo or meaning?
- "Which technique set should the keyboard support first?" — the question itself is unclear.

**Open questions to carry forward**
- Where is the line between a scope note and a spec? (A test to apply to every chunk.)
- What makes a chunk "manageable" for an agent vs. for an experienced engineer?
- What separates "detailed" from "micro-manage-y" in a work plan?

**Next**
- Grill-me session on the spec, one branch at a time (keymap, data model, import, feedback).

## 2026-10-23 — Grill-me session, branch 1: how tasks get written

**Q1: Of *what*, *how*, and *done*, which get specified up front?**
- Agreed: spell out *what* (player-facing behavior) and *done* (acceptance criteria an agent can check on its own, ideally tests) in full. Leave *how* open apart from a short list of constraints.
- Alix: will eventually want to give direction over the code, but likely as suggestions *afterwards*, not up front, and possibly by pointing other skills (e.g. review skills) at the repo.
- Observation (Claude): this makes code review a planned phase of the loop rather than an afterthought. Worth deciding when it happens (per chunk? per milestone?).

**Q2: Stack — the one *how* decided up front?**
- Decided: TypeScript, Vite, Vitest, test-driven development.
- Alix, on framework: torn between Angular and React/Next.js. Wanted to learn Angular for work, but that's now less likely; work already uses React.
- Alix's idea: make the "back end" (game logic, even though it's all one app) usable by either framework, as an experiment/comparison.
- Observation (Claude): Next.js adds server-side features a local-only app doesn't need; plain React + Vite is the lighter React option. A framework-free core is good design regardless; a second UI is a scope question (see Q3).

**Q3: Second (Angular) UI — in parallel or later?**
- Decided: later milestone. Start with React.
- Constraint carried forward: the core may not import any UI framework (enforce with a lint rule or test).
- Alix: had suggested Next.js so it could deploy to their Vercel instance; also has their own hosting service. Still just for personal use. The goal is not being tied to one computer to use it.
- Observation (Claude): a static Vite build deploys to Vercel or any static host, so hosting doesn't require Next.js. But "not tied to one computer" raises a data question: localStorage is per browser (see Q4).

**Q4: Does state need to follow Alix across devices?**
- Decided: no — keep state in app/browser storage, per device. Static deploy to any host.
- Carried forward (proposed, not yet confirmed as a spec constraint): saved state goes through a single storage interface in the core, so sync could be added later by swapping one module. Manual portability via puzzle strings / exported game state.

**Q5: In the TDD loop, who writes tests and where does Alix step in?**
- Decided (as an experiment): Alix writes plain-language acceptance criteria (Given/When/Then) → agent writes failing tests → Alix approves the tests before implementation → agent makes them pass.
- Alix: likes it because "part of this is about refining my ability to define the work"; agrees it might get tedious — "we'll see."
- Watch for: does the test checkpoint feel tedious on small chunks? Note when it does, and when it catches a misunderstanding.

## 2026-10-23 — Branch 2: what gets built first

**Q6: What's Milestone 1?**
- Proposed M1: paste import, grid with locked givens, keyboard play (arrows, digits, N toggle, delete), candidates, conflict flag, undo/redo, autosave, deployed. Out: coloring, "solution checking," timer, streaks, other import formats.
- Alix: mostly agrees, but "solution checking" has to be in M1 — if it means "I have solved the puzzle successfully" or even "this number is in a correct cell."
- **Lesson: the term "solution checking" was ambiguous.** Claude used it to mean legal-but-wrong flagging (the sketch's "wrong-solution-flag"); Alix read it as possibly including puzzle-complete detection. Two readers, one term, two meanings — exactly the kind of gap an agent would fill with a guess.
- Alix's response: pause and nail down terminology in a domain-modeling session before continuing.

## 2026-10-23 — Terminology (domain-modeling), feeding `CONTEXT.md`

- Started `CONTEXT.md` at the repo root: a glossary only, no implementation details. Terms are added as each one is resolved.
- Checked `alixnotes/Sudoku Concepts.md` (solving-technique terms, nothing about app feedback) and `Sudoku App — Keymap.md` (empty).

**Q7: What did "solution checking" actually mean?**
- Split into Conflict (duplicate in row/col/box), Mistake (no Conflict, but doesn't match the Solution), and Solved (full grid, Givens intact, no Conflicts).
- Key point: Solved is detectable *without* knowing the Solution; only Mistake requires one.
- Added to glossary: Given, Solution, Conflict, Solved.
- Alix on Mistake: "I'd rather know when I enter the candidate that it's wrong." Decision: spec it out, then decide M1 vs. M2.
- Open: "candidate" there may mean a placed digit or a pencil mark; these lead to very different features (see Q8).

**Q8: Mistake on a placed digit or on a candidate?**
- Alix: meant a *placed* digit. Flagging candidates would reveal the answer.
- Rejected: flagging when the player removes the correct candidate. Alix: "I don't think I like that idea."
- Added to glossary: Mistake (placed digits only; candidates are never compared to the Solution).
- **Lesson:** Alix said "candidate" while meaning "placed digit" — in a single sentence about the very feature being defined. Even the spec's author slips between terms; a glossary is how the agent (and Alix) catch it.
- M1 vs. M2 for Mistake still to be decided once it's specced.

**Q9: What do Center marks and Corner marks mean?**
- Decided: follow the common convention. Center mark = "this cell could be this digit"; Corner mark = Snyder notation, "this digit must go in one of these marked cells in the box." Alix: the swapped version in `Sudoku Concepts` was a misunderstanding.
- Decided: "Candidate" is the umbrella term for both.
- Alix: hasn't yet been able to use Snyder notation — "one of the impetuses behind building this app."
- Added to glossary: Candidate, Center mark, Corner mark.
- Observation (Claude): that makes Corner marks a third reason to build, alongside keyboard and coloring, and a strong M1 candidate. It also means "N toggles fill/notes" now has three modes to cover (see Q10).

**Q10: How does the keyboard reach the three modes (fill, center, corner)?**
- Decided: `N` is a three-way sticky toggle (fill → center → corner → fill), current mode always visible.
- Decided: digits are identified by physical key, not typed character (Shift+1 sends `!` on many layouts).
- Alix's change to the proposal: instead of Shift+digit / Ctrl+digit, use letter chords — **C + digit = Center mark**, **S + digit = Corner mark (Snyder)**.
- Carried forward from proposal: avoid Cmd+digit (the browser owns it on macOS).
- Observation (Claude): letter chords are less standard than modifier keys, so they need edge cases spelled out (held-key repeat, lost focus, C/S pressed alone). See Q11.

**Q11: Letter-chord edge cases**
- Agreed, all six:
  1. A chord lasts while the letter is held (hold C, press 1/4/7 → three Center marks toggled).
  2. C or S pressed alone does nothing — *for now*.
  3. Auto-repeat from a held letter is ignored.
  4. Losing window focus releases the chord.
  5. A chord overrides the sticky mode for that keypress only; the sticky mode is unchanged.
  6. C and S held together → neither applies; digits do nothing.
- Alix on #2: hadn't considered bare C for color; will pick another letter for color if/when it comes up.
- Observation (Claude): decisions are accumulating only in this log. They need a home in the spec (see Q12).

**Q12: Where does the spec live, and who drafts it?**
- Decided: the repo is the source of truth. Proposed shape: `CONTEXT.md` (glossary), `LEARNING-LOG.md` (story), `AGENTS.md` (standing rules for every task), `docs/spec/*.md` (one file per feature area, plus `milestones.md`). Files are created as they're needed.
- Decided: spec drafting happens Q&A style — Claude asks, Alix answers, Claude writes it down, Alix reviews. Alix: "that's likely how I'd do it in a 'real world' scenario."
- Started `docs/spec/keymap.md` from the decisions in Q10–Q11; remaining sections marked _Open_.
- The vault's `Sudoku App — Keymap` note is still empty; it could become a pointer to the repo (Alix's call).

**Q13: A digit in fill mode on a non-empty cell**
- Agreed: Given → nothing; same digit → removed (toggle); different digit → replaces; Candidates only → digit placed, Candidates hidden (not deleted) and restored if the digit is removed.
- Agreed: in center/corner mode or with a chord, a digit press on a filled cell does nothing.
- Why hidden-not-deleted: a wrong placement shouldn't wipe out Candidates the player worked out — consistent with "no penalty."
- Written into `keymap.md` §7.

**Q14: What do Delete/Backspace clear?**
- Agreed: clearing follows the active mode, as digits do (fill → placed digit; center/`C` → Center marks; corner/`S` → Corner marks). Nothing on a Given.
- Alix: fully resetting a cell is "pretty rare," but added **`X` = clear everything from the cell and start over.**
- Letters now spoken for: `N`, `C`, `S`, `X`.
- Written into `keymap.md` §5.

**Q15: Undo/redo — keys and granularity**
- Agreed: standard Cmd/Ctrl+Z, Shift+Cmd/Ctrl+Z, Ctrl+Y. One step per grid change; selection moves and mode changes aren't undoable; undo restores exactly; history survives refresh; a new change discards redo.
- Alix on chords: one step per digit — "if I've gone C-1-2-3, then we should undo C-3-2-1 in order."
- Why persist history: without it, a refresh would be a hidden penalty.
- Written into `keymap.md` §6.

**Q16: Movement**
- Agreed: arrows move one cell; same-row/same-column wrap; Givens are selectable; always one selected cell (row 1, column 1 at start); no letter-key movement.
- Agreed: multi-cell selection is pushed to a later milestone, even though it would help Snyder marking; start with one cell at a time.
- `keymap.md` now has every section decided (§4 written; added §8 reserved keys and §9 not-in-this-version). Awaiting Alix's review.
- Observation (Claude): the keymap went from one line in the sketch ("N toggles note/fill") to nine sections in about an hour of Q&A, and most of the new content is edge cases. That ratio is probably typical for an agent-ready spec.

## 2026-10-23 — Repo setup and development process

- Repo initialized on `main` (matching Alix's other repos: local identity, Node `.gitignore` adapted for Vite, `.nvmrc` 24.15.0, README). First commit `0dbb761`, pushed to https://github.com/allizon/sudoku-app.
- Practical note: the sandbox on Alix's computer can't reach GitHub over SSH, so Claude pushes from its own workspace (via a git bundle).

**Branching and merging**
- Alix: as the only human on the project, doesn't need PRs to get work into `main`. Agents must work in branches or worktrees; once Alix approves the work, it can be merged straight to `main` without a PR.
- Open: what "approve" consists of, and what has to be true before a merge (see next question).
- Decided (as an experiment; "we can always go back to PRs later"): two checkpoints per chunk — (1) approve tests before implementation, (2) a "ready to merge" handoff afterwards: what changed, test results, anything the agent decided that the spec didn't cover, and a pointer to the diff.
- Alix's inclination for merge style: squash merges. Discussing trade-offs.
- Decided (as an experiment): **fast-forward merges** to start. Alix: "that process is new to me, so I want to see how it feels." Squash stays an option to revisit.
- Consequence: every branch commit lands on `main`, so commit hygiene on branches matters (see next question).

**Commit conventions on branches**
- Agreed: one commit per TDD step — `test:` (approved, failing tests) → `feat:`/`fix:` (passes) → optional `refactor:`. Conventional-commit style, as in Alix's other repos, with the spec section named (e.g. `feat(keymap): mode-aware clearing (§5)`).
- Agreed: no wip/typo commits; the agent tidies the branch, rebases onto `main` before the handoff, and merges with `--ff-only`.
- Alix: OK with `test:` commits failing on `main` temporarily — the red → green history is worth it. (If bisecting later, `git bisect skip` those commits.)

**`AGENTS.md` (process half)**
- Written earlier than planned, while the process was fresh, so the first real task can test whether it works. `CLAUDE.md` is one line, `@AGENTS.md`, as in `draft-zero`.
- Contents: sources of truth (`CONTEXT.md`, `docs/spec/`), stack, the core boundary, the 7-step task workflow with a checkpoint per step, and commit conventions. Feature behavior stays in `docs/spec/`.
- Claude's own call, flagged for review: ask about spec gaps that affect tests during the test step; record smaller ones as "spec gaps" in the handoff.
- Left out on purpose: the single storage interface (still unconfirmed), and commands (no `package.json` yet — the environment should be the source of truth for those).
- Awaiting Alix's review before committing — the first use of the "approve, then merge" flow, applied to the process doc itself.
- Alix's review:
  1. Spec-gap rule (ask if it affects tests; otherwise record in the handoff): approved.
  2. Branch naming `<area>/<short-slug>`: fine for now. Alix will likely adopt **Backlog.md** (https://github.com/MrLesk/Backlog.md/) for repo-local issue tracking; branch names should then tie to its tickets. Installing it is likely the next task.
  3. Single storage interface: add it as a rule now, even though its details aren't worked out. Now confirmed (supersedes "proposed" in Q4).
- Backlog.md install deferred to Alix's computer: the npm registry is blocked from both Claude's workspace and the computer's sandbox.

## 2026-10-23 — Agent personas

- Alix wants different agent personas for different parts of the process, each "really focused in on their jobs." First ideas: a TypeScript pro, a React pro, a code reviewer ("preferably fairly antagonistic"), a UI/UX pro. Unsure what else is needed. Has barely used personas; wants guidance on best practices and setup.
- Setup: Claude Code subagents, one Markdown file each in `.claude/agents/`; `description` decides when it's used, `tools` limits what it can do, each runs in a fresh context.
- Guidance discussed: focus comes from a narrow job, a defined output, and restricted tools more than from persona framing; a reviewer's independence (fresh context, sees only spec + diff) matters more than its tone; every agent is a file to maintain, so start small.
- Decided: organize agents **by workflow step, not by technology**, "especially to start while I'm figuring out what I'm doing with them." Proposed set: test-writer (step 2), implementer (steps 4–5; carries the TypeScript/React expertise), code-reviewer (adversarial, read-only, before step 6), ux-reviewer (UI chunks only, read-only).
- Why separate test-writer from implementer: one agent writing both tends to write tests that fit the code it already has in mind.

**Who coordinates the agents?**
- Agreed: a main session coordinates and dispatches each agent; Alix keeps the two checkpoints (approve tests, approve merge).
- Alix: code-reviewer findings go back to implementer automatically, but the issues found and their resolutions are logged. "I would indeed like to be able to see what the discussion looks like, but don't need to be involved with every bit of it (just like a real manager!)"
- Open: where that review record lives, and when a back-and-forth escalates to Alix.
- Decided: the review record lives in the task's Backlog.md ticket (until it's installed, `docs/reviews/<branch>.md`), one short entry per round: each finding, its severity, and fixed/declined with a reason. The checkpoint-2 handoff summarizes it.
- Decided escalation rules: (1) at most two review rounds, then remaining major findings go to Alix; (2) findings the implementer declines are listed at checkpoint 2; (3) spec contradictions (reviewer says code is wrong per spec, implementer says the spec is wrong) go to Alix immediately — they're spec gaps, not for agents to settle.

**Drafts written (uncommitted, for Alix's review alongside the Backlog.md install)**
- Agent files: `test-writer.md`, `implementer.md`, `code-reviewer.md`, `ux-reviewer.md` — parked in `_drafts/claude-agents/` because remote tools can't write into `.claude/`; Alix moves them to `.claude/agents/`. Reviewers have no edit tools. Each ends on a checkpoint; the reviewers' checkpoint requires checking every relevant rule before an empty findings list counts.
- `AGENTS.md`: new "Agents" section (who does which step); workflow grew from 7 to 8 steps with a **Review** step (5); handoff now includes a review summary with every declined finding; new "Review record" section.
- Claude's own calls, flagged for review: the implementer may not change approved tests (it stops and reports instead); the ux-reviewer's five review areas (keyboard, visible state, feedback, accessibility, clarity), with WCAG AA as the contrast bar; reviewers flag disagreements with the spec as "spec questions."

## 2026-10-24 — Backlog.md installed, agent files moved

- Alix installed Backlog.md, moved the agent files to `.agents/claude-agents/`, and pushed everything to origin.
- Backlog.md config: `task_prefix: "task"`, statuses To Do / In Progress / Done, `auto_commit: false`.
- `backlog init` appended a `<CRITICAL_INSTRUCTION>` block to `AGENTS.md`: run `backlog instructions overview` at the start of each conversation, read task-specific guides before lifecycle actions, and change tickets only via the `backlog` CLI, never by editing their files.
- Observations (Claude), raised for discussion:
  - `AGENTS.md` says the subagents live in `.claude/agents/`, which is where Claude Code looks for them; they're now in `.agents/claude-agents/`.
  - History has a merge commit (`d9e0ad1`): the Backlog.md commit landed on `main` while `agent-personas` was open, so a fast-forward wasn't possible without a rebase first. Also one commit with the message `[agent-personas] -m`.
  - The Backlog.md rule "only via the CLI" affects the review record: agents must write review rounds into tickets with `backlog` commands. Claude's cloud workspace can't run the CLI (npm is blocked), but local sessions can.
- Alix's responses:
  - `.agents/` was deliberate: Alix wants the setup to be agent-agnostic. Asked whether the docs should point at `.agents/` instead.
  - On the merge commit: "I didn't do the process right, that's on me. New mistakes next time!"
  - On the Backlog.md block: asked for a recommended fix.
- **Lesson:** the first time the process met real work, the human skipped a step (rebase before merge). The checkpoints only work if they're actually followed — for people as much as for agents.

**Fixes (branch `tooling/agents-dir-and-backlog`)**
- `.agents/` is the agent-agnostic source of truth for agent definitions; Claude Code reads them via a `.claude/agents → ../.agents/claude-agents` symlink (Alix created it). `AGENTS.md` now points at `.agents/`.
- The main session owns all Backlog.md ticket operations, including the review record; subagents skip the Backlog.md workflow. Written in our "Agents" section, outside the Backlog-managed block so upgrades won't overwrite it.
- Review record: written into the ticket via the `backlog` CLI by default; when the CLI is unavailable (cloud sessions), `docs/reviews/<branch>.md` on the branch, flagged in the handoff. Alix: will work *mostly* on the Mac, sometimes in cloud sessions — hence the fallback.
- Branch naming: `task-<n>/<short-slug>`, from Backlog.md's `task` prefix.
- Backlog tickets added to "Sources of truth" as the home of tasks and acceptance criteria.
- This change itself went through a branch and the merge checkpoint.

## 2026-10-24 — Branch 3: feedback (`docs/spec/feedback.md`)

**Conflict behavior**
- Proposed and not objected to: mark every cell involved (placed digits strongly, Givens lightly); Conflicts are live, recalculated after every change; Conflict takes priority over Mistake; candidates are never Conflicts. Written into `feedback.md` §2.
- Alix: relies on current apps removing candidates after a placement — "mainly for removing tedium (and potential mistakes later in the puzzle)." So candidate elimination is a real M1 need, not an assist to defer.
- Open: Alix said "after a *successful* placement." Does successful mean conflict-free, or correct per the Solution? (See next question.)

**Which placements trigger Elimination?**
- Options: (a) any placement, (b) any conflict-free placement, (c) only placements matching the Solution.
- Decided: **(b)**. (c) would leak Mistakes (no removal = wrong digit) and depend on the solver; (a) would rearrange the grid around a Conflict.
- Agreed: remove both Center and Corner marks of the digit from the placed cell's Peers; placement + Elimination is one undo step; removing/replacing the digit later (not via undo) doesn't restore Candidates; always on, no setting in M1.
- Added to glossary: **Peer**, **Elimination**. Written into `feedback.md` §3; `keymap.md` §6 now points to it for the undo rule.
- **Lesson:** "successful" was a third hidden term. Each adjective in a requirement ("successful," "correct," "wrong") is a candidate for a glossary entry or a decision.

**Mistakes: behavior and milestone**
- Proposed and not objected to: flagged immediately on placement; visually distinct from Conflicts; live (re-evaluated after every change); blocks nothing; when there's no known Solution, no Mistakes are shown and the app says checking is unavailable.
- Decided: **Mistakes are in M1.** This brings a solver and import-time handling of puzzles with no or multiple solutions into M1 — to be specified in `import.md`.
- Written into `feedback.md` §4.

**What happens when Solved?**
- Agreed: clear on-screen announcement; grid locks; selection and movement still work; undo still works and unlocks; Solved state survives refresh.
- Alix: "I wouldn't mind a *little* pizzazz to the 'solved' message, but confetti isn't necessary :)" — exact treatment left as a design decision; motion must respect reduced-motion.
- Dependency recorded: "Solved never contains a Mistake" holds only if every puzzle with a known Solution has exactly one solution; `import.md` must guarantee it.
- `feedback.md`: all sections decided, awaiting review.

## 2026-10-24 — Branch 4: import (`docs/spec/import.md`)

**Validation at import**
- Decided: solve every puzzle at import; accept only puzzles with exactly one solution. Alix: "I don't want multi-solution puzzles."
- Rejection order: unparseable → conflicting Givens → no solution → multiple solutions; each with a specific message.
- Decided: import can wait for the solve (no background thread).
- Written into `import.md` §3; Sample A carried over from the sketch as §4.
- Claude checked Sample A by exhaustive search: exactly one solution; the permalink form is the same puzzle. Both forms and the solution added to §4 as fixtures.

**Paste formats in M1**
- Conflict found in the sketch: `-` means "empty" in Sample A's notation but is also a border character in grid-style text.
- Agreed: one rule — strip whitespace and commas, expect 81 characters; `1`–`9` Givens; `.`/`0`/`-` empty; anything else is a parse error with character and position. Covers 81-char strings, row-by-row text, and comma/space variants.
- Out of M1: bordered grids; `.sdm` bundles. Alix wants `.sdm` in a future milestone.
- Alix hadn't heard of `.sdm` — though it was in the sketch's format list. Written into `import.md` §2.
- Observation (Claude): a spec can accumulate requirements nobody actually chose. Possible check for future specs: "who wanted this, and why?"

**Replacing the current game**
- Agreed: one game at a time in M1 — Alix: "one-game-at-a-time is perfect."
- Proposed and not objected to: confirm before replacing an unfinished game; no prompt if Solved or empty; fresh game state on import; a rejected import changes nothing. Written into `import.md` §5 (renumbered).

**Starting an import from the keyboard**
- Gap found between spec files: `keymap.md` promises full keyboard play, but nothing said how an import starts.
- Agreed: paste (Cmd/Ctrl+V) on the grid imports the clipboard; `I` opens a visible import field; the replace confirmation is keyboard-driven with focus on cancel. Written into `import.md` §2; `I` added to reserved keys in `keymap.md` §8.
- Alix asked whether there's a service to fetch puzzles automatically, or a good source to link to from the app.
- Claude's research (2026-10-24): free JSON APIs exist (YouDoSudoku, Dosuku at sudoku-api.vercel.app) and include solution and difficulty, but top out around "hard" and add a network dependency. The Sudoku Exchange puzzle bank (github.com/grantm/sudoku-exchange-puzzle-bank) has several hundred thousand puzzles, stated free of copyright, rated with Sukaku Explainer; "Diabolical" = rating 5.0+. One puzzle per line: hash, 81 digits, rating.
- Decided: **built-in puzzles from the Sudoku Exchange bank in M2** (Alix: "number three sounds fantastic"). Recorded in `import.md` "Not in this version" with the source details.
- `import.md`: all sections decided, awaiting review. `feedback.md` cross-references now point at `import.md` §4.

## 2026-10-24 — Milestones (`docs/spec/milestones.md`)

- Observation (Claude): M1 had roughly doubled since the first sketch (Corner marks, Elimination, Mistakes, solver all added). Proposed one milestone with a "first playable" point partway through.
- Alix's alternative: a **Milestone 0** — a board that's keyboard-traversable, with all keys and input methods *working*, but not solvable: nothing is checked. "Just to make sure everything is working together correctly." M1 then makes it playable/solvable and adds feedback, undo, etc.
- Observation (Claude): this is a walking skeleton / tracer bullet — it proves the whole stack end to end before any game logic. Exact M0 boundary still to settle.
- Agreed M0: project setup + core boundary test, deployed, grid rendering, the whole keymap except undo, Givens unchangeable, paste import with parsing only (no validation).
- Agreed M1: undo/redo, import validation, `I` field + replace confirmation, all feedback (Conflicts, Elimination, Mistakes, Solved), autosave.
- Three boundary calls confirmed: undo in M1 (it's history, entangled with Elimination and autosave); paste in M0 minus validation; deploy in M0.
- The "first playable point" idea is no longer needed — M0 plays that role.
- `milestones.md` drafted with M0, M1, M2 (built-in puzzles, library, `.sdm`; coloring open), and a "Later" list.

**Deploy target**
- Decided: **Vercel**, via its GitHub integration — every push to `main` auto-deploys. Alix: that auto-deploy isn't available with their own hosting provider.
- Consequence: Alix's merge approval is now also the release decision. Added to `AGENTS.md` step 8 so agents know pushing `main` ships.

---

_The entries from here to "2026-10-25 — Moving to Claude Code" were written afterwards from the written records: Backlog.md tickets (descriptions, review records, final summaries), commit messages, and spec diffs. Things said only in conversation and never written down aren't here. Quotes from Alix are only included where a record quotes them._

## 2026-10-24 — From milestones to tickets

- Milestones M0–M2 entered into Backlog.md (`d873ef4`); M0 split into task-1 to task-8 (`9f99822`), later joined by task-9 (Vercel setup, Alix's own), task-10 (grid size and color schemes) and task-11 (focus flash).
- Tickets labelled `afk` (an agent can do it alone) or `hitl` (needs Alix, e.g. connecting Vercel in its dashboard).
- Each ticket names its dependencies, so Backlog.md shows the order: task-1 first, then deploy, selection, and paste in parallel, then fill mode, then modes, chords, and clearing.

**Glossary and spec changes made while writing the tickets**
- "Puzzle" replaces "game" everywhere; new terms: Placed digit, Selected cell, Entry mode (`57feae2`), later Sticky mode and Entry mode line (`6cc6281`).
- Keymap §1: the mouse is allowed but never required; clicking a cell selects it (`9f99822`).
- Keymap §5: Delete never removes hidden Candidates; only `X` does (`9442219`).
- M0 paste rules: paste only onto an empty grid; errors and the refusal appear as a top-right toast, as an interim choice.
- New spec file `display.md`: grid size cap, light/dark schemes with a mouse-only toggle, where the Entry mode line goes (`0711e14`, `c6a5031`). Every color comes from a CSS token so a future skin can restyle the app (`e2ac312`).
- Writing convention: glossary terms are marked ◆CAPITALS in specs, tickets, and guides; code, tests, and commit messages stay plain (`912d261`). This log was left out of that change.
- Observation (Claude): writing tickets turned up questions the specs hadn't answered (mouse use, Delete on hidden Candidates, grid size, dark mode). Breaking the work into tasks is also a review of the spec.

## 2026-10-24 — task-1: scaffold and core boundary

- First task through the full 8-step workflow. The main session set up the toolchain (npm scripts, Vite, Vitest, strict TypeScript) before test-writer started, so the tests had something to run on.
- Alix approved the tests; decisions made then: Node built-ins and type-only imports count as boundary violations; DOM globals are flagged in `src/core/`; the storage interface will live in `src/core/` with the browser implementation outside it.
- Two review rounds, five major findings, all in the boundary checker (template-literal imports, triple-slash references, globals reached through `globalThis`/`self`). Fixed by adding a second check: `src/core/` is also type-checked with no DOM or Node types.
- A reviewer asked a spec question about commit scope for setup work; Alix settled it: `(setup)` / `(§M0)`.
- UX review raised three questions for later: grid size cap, dark mode, where the Entry mode line goes. These became `display.md` and task-10.
- Observation (Claude): every major finding was about the tool that enforces the architecture rule, not about the grid. An adversarial reviewer will dig into wherever the code is most complicated, and that won't always be where the product risk is.

## 2026-10-24 — task-9 and task-2: deploying

- Alix connected the repo to Vercel (task-9, `hitl`). task-2 checked it: GitHub showed "Vercel: success" for a push to `main` with no manual step, and the live site served the same files as a local build. Production: https://sudoku-app-navy.vercel.app/.
- Review: the README claimed the type-check runs on every deploy, but nothing in the repo made that true. Fixed with `vercel.json` pinning the build command (`a6b2b60`). The record notes the main session made this fix itself rather than sending it to implementer, "given size" — a small departure from the workflow.
- No tests: a README and config-only task.

## 2026-10-24/25 — task-4: paste import (parsing only)

**Settled with Alix at the tests checkpoint** (all spec gaps)
- Fixture puzzles: `fixtures/puzzles/puzzle-{1,2}.txt` with solutions, built by `scripts/generate-puzzle.py`.
- Error wording: "unexpected 'x' at row R, column C"; "found N cells, expected 81"; both errors at once → two toasts, count first.
- Refusal text, toast lifetime (10 s, click to dismiss, stacked), no toast on success, 81 empty cells don't count as loaded.

**Review**
- Round 1: two majors, both about focus: clicking a toast moved focus off the grid, so the next paste silently did nothing; and the grid wasn't focused on load, so the first Cmd+V did nothing. Fixed, Alix choosing how in several places (grid focused on load, Escape dismisses toasts, one shared announcement area for screen readers, invisible characters named by code point).
- Round 2: no majors. Two minors declined because they contradicted earlier choices of Alix's (toasts covering the grid on narrower windows; positions past row 9), so they went to Alix in the handoff.
- Alix's decisions after round 2: toasts move below the grid when there's no room beside it; a bad character past cell 81 is "after the 81st cell"; a visible "Paste a puzzle to start" hint; a softer red for the refusal toast.
- task-11 (replace the always-on focus ring with a one-second pale-blue flash) was folded into task-4 at Alix's request, then got its own one-round review.

**Lesson: decisions were piling up in the ticket, not the spec.** By the end of task-4, a dozen behavior decisions existed only in ticket notes and the handoff. Alix: "yes, add them to the spec to keep it up-to-date." They went into `import.md`, `milestones.md`, and `keymap.md` (`d44e63e`), and the rule since then is that settled behavior is written into `docs/spec/` on the task's branch. Otherwise a later task (e.g. the M1 replace dialog, which also uses Escape) could be built without knowing about them.

- Observation (Claude): the escalation rule worked as designed. Agents declined findings that clashed with Alix's earlier choices rather than overriding them, and Alix then changed two of those choices once the reviewers' evidence was in front of them.

## 2026-10-25 — task-3: Selected cell and movement

- One review round, two majors, both fixed: an accepted paste didn't reset the selection to row 1, column 1 (the existing test for it couldn't fail), and screen readers weren't told which cell was selected.
- Modified arrows (Shift/Alt/Ctrl/Cmd) now do nothing and are left to the browser, since keymap §9 puts Shift+arrow off until later.
- Declined minors flagged for Alix: the selection ring's size on small cells; no dark scheme yet; "no cell background" will clash with future Conflict/Mistake tints.
- Observation (Claude): a test that couldn't fail is a pattern now seen in task-3 and task-4. Reviewers catch these; the test-approval checkpoint doesn't, because a test's name can read correctly while its assertion checks nothing.

## 2026-10-25 — task-5: fill mode

- Keymap §1 grew during the task: numpad digits count, Ctrl/Alt+digit and key repeat are ignored (`0fdd370`). code-reviewer flagged the spec edit as made without approval; declined, because the main session made it on Alix's instructions. The process check fired even though nothing was wrong.
- ux-reviewer: Placed digits and Givens differ only by weight in forced-colors mode. Fixed by making Placed digits italic — then Alix had the italics dropped (`d059731`), so that finding is open again.
- Observation (Claude): a reviewer's fix can be a design choice in disguise. The italics answered an accessibility finding but changed how the grid looks, which is Alix's call.

**After merging: paste broke in production (task-13)**
- After task-5 was deployed, pasting into the empty grid on the live app did nothing — no puzzle, no toast. All 440 tests still passed. Filed as a high-priority bug; cause not yet known.
- **Lesson:** the tests run in a simulated browser (jsdom), and the agents' summaries said so each time ("not exercised in a real browser"). task-13 is the first time that gap let a regression reach production. Its acceptance criteria require reproducing the bug in a real browser and a test that would have caught it.

**task-12 written: confirm before replacing a puzzle**
- Open point for Alix before tests: `import.md` §5 asks for confirmation only once a digit or Candidate has been entered; Alix had described the trigger as "non-empty cells," which could include Givens.
- Observation (Claude): the same kind of gap as "solution checking" and "successful" earlier — an everyday phrase standing in for a precise rule.

## 2026-10-25 — task-10: grid size and color schemes

- Introduced `Store` (`src/core/store.ts`), the single storage interface, with the browser implementation in `src/storage/`. The color scheme is the first saved state.
- Spec question settled by Alix: a dark-scheme player saw a light flash on every reload. A small read-only script in `index.html` now reads the saved scheme before the app loads — the first exception to "only `Store` touches saved state," recorded in `AGENTS.md` and `display.md` §2 with the reason (the scheme is closer to a browser setting than to game state).
- Round 1 major: toasts went below the grid on any window under 1448px wide, even with room beside it. Fixed by measuring the drawn grid.
- Round 2: no majors; Alix approved removing an obsolete test. Trade-off noted: on short windows a toast can cover the hint while shown; `milestones.md` now says toasts may cover the Entry mode line (`707ca87`).
- Contrast checked by calculation, not by eye; Alix's manual checks were listed in the handoff.
- Test count so far: 104 (task-1) → 246 (task-4) → 306 (task-3) → 440 (task-5) → 606 (task-10).

## 2026-10-25 — Moving to Claude Code

- Work moved from the Claude desktop app to Claude Code, and the log stopped being updated: nothing past the milestones entry until this backfill.
- Decided: the log is kept up to date as we work, not just at the end. The rule is now in `AGENTS.md` so any agent, in any tool, follows it, not just one Claude Code setup.
- Claude's own calls, flagged for review: the main session writes the log (subagents report to it, as with Backlog.md); log updates are committed on the branch of the work they describe; glossary terms stay plain here, as in the earlier entries, rather than taking the ◆ marking.

**Same day: when the log gets committed**
- Alix: the log "should live in git, but can be updated/pushed once a day, not with every accepted commit or push."
- Supersedes the earlier call to commit log updates on each task's branch. Now: entries stay uncommitted in the main checkout during the day; once a day they go straight to `main` as one `docs(log)` commit and are pushed, with no branch or approval. Written into `AGENTS.md` ("Learning log", plus a note on step 8).
- Claude's own calls, flagged for review: the first session on a new day commits any leftover entries; cloud sessions, which can't leave changes uncommitted, commit theirs on their branch.
- Observation (Claude): every log commit was going to trigger a production deploy, because pushing `main` deploys. Batching the log once a day keeps deploys for actual changes to the app.

## 2026-10-26 — task-6: Entry modes and Candidates

- Started on branch `task-6/entry-modes-and-candidates`; test-writer dispatched with ACs, keymap §1/§2/§7, display §2, and the glossary.
- Observation (Claude): task-13 (paste broken in production, high priority) is still To Do while task-6 starts. task-6 doesn't depend on it, but paste is how a Puzzle with Givens gets onto the grid in the live app.
- test-writer: 176 failing tests in 4 files, no existing tests changed. On the first run, 17 UI tests passed only because N did nothing (the app stayed in fill mode); the test-writer caught and fixed them before handing back. It also ran the core tests against throwaway stubs to show they can fail.
- Observation (Claude): that's the "test that can't fail" pattern from task-3 and task-4, caught this time by the test-writer itself, because the brief asked it to check.
- Open for Alix at the test checkpoint: N by physical key or typed letter; Shift+N; exact wording of the Entry mode line; whether a grid with only Candidates refuses a paste; screen-reader announcement of mode changes.
- Alix approved the tests ("approved") without answering the five questions. Claude's own call, flagged for review: took that as approval of the tests as written — N by physical key, Shift+N cycles, a grid with only Candidates refuses a paste, line wording left to the implementer (only the mode name is checked), and no screen-reader announcement of mode changes. The last two differ from Claude's recommendations and go in the handoff as spec gaps.
- Committed red: 176 new tests failing, the 606 existing ones passing.
- Green in one pass (`dcc3681`): 782 tests, typecheck clean, no tests changed. Candidates live in a new `'candidates'` cell kind plus a hidden field on `'placed'`, so "empty" still means "holds nothing".
- The implementer added `aria-live="polite"` to the Entry mode line, though Alix hadn't asked for it (it was question 5, left unanswered). Nothing in the tests forbade it. Flag for Alix in the handoff.
- Observation (Claude): the implementer noticed that the existing grid-size test measures only the hint line, so it can't catch the new Entry mode line pushing the page into scrolling. Another test that looks like it covers something it doesn't. Sent to code-reviewer to assess.
- Review round 1: code-reviewer found no wrong behavior but two major test gaps, both "tests that can't fail" again. The grid-size test ignores the Entry mode line. The test meant to show Center and Corner marks look different compares the unresolved `var(...)` strings, which always differ, while both tokens actually resolve to the same gray. Position, the real difference, wasn't tested at all.
- Both reviewers independently found that Corner marks sit on the Selected cell's ring on cells under about 75px, down to about 4:1 contrast (calculated, not seen in a browser).
- ux-reviewer: an accepted paste didn't reset to fill mode, though import.md §5 says it should. The spec covered it; the tests didn't.
- **Lesson:** "the tests pass" and "the test checks what its name says" are different claims. Comparing CSS strings instead of resolved values is a new way a test can look right and check nothing.
- Review round 2: no majors, and all round 1 fixes checked out. Three new minors went back to the implementer. Two of the new grid-size tests could never fail on their own. A correct fix to the grid-size model had loosened an approved test by 24px without changing any of its assertions. And the 7px floor added to keep Corner marks clear of the ring made Corner marks 1 and 9 overlap on phone-sized cells.
- Observation (Claude): every review fix this task added new tests, and round 2 still found tests among them that couldn't fail. Fixing a test gap doesn't make the next test trustworthy.
- **Lesson:** "no assertion was changed" isn't enough to say a test kept its strength. A test can get weaker when the helper it measures through changes.
- Round 2 fixes (`04551b0`): all three fixed. Fixing the 1-and-9 overlap turned up a second one (marks 1 and 7) on tiny cells. The fix caps the Corner mark size there, down to about 4.6px text on a 30px cell. That's for Alix to look at on a phone.
- Tidy: the branch was already on current main. Reworded the round 1 commit subject to name import §5. 844 tests green. Handing off.
- Alix: "approved for all" — the merge, the two strengthened approved tests, and the spec gaps as listed (including the unrequested screen-reader announcement).
- Caught at merge: the settled decisions were only in the handoff, not in `docs/spec/`, which Alix had asked for on task-4. Added `9c69593` (keymap §2, new display §3 for Candidates) before merging.
- **Lesson:** the rule was in memory, not in AGENTS.md's workflow steps, so the checklist I was following didn't prompt for it. Worth a line in step 7: check that settled decisions are in the spec before handing off.
- Merged and pushed (deploys). Still open for Alix: whether every letter key goes by physical key; a stray mark before any puzzle blocks paste with misleading text; hidden Candidates aren't announced; a real-browser look at mark layout on small cells.

## 2026-10-27 — after task-6: follow-ups settled

- Alix: letter keys don't need a layout rule — "since this is for me, that's overkill." N stays as built.
- Alix: "don't worry about screen readers … this is for me." Existing ARIA stays; no more effort on it, and reviewers shouldn't raise it. Saved as a standing preference.
- Alix: "ignore any marks before the puzzle loads." Exact behavior still to confirm before it becomes a ticket.
- Alix looked in a real browser: "everything fits," but doesn't like how a full set of Corner marks looks. Filed as task-14 (bug).
- Observation (Claude): two of the four open questions turned out not to matter for a one-person app. Knowing who the app is for up front would have kept them off the test checkpoint.
- Alix confirmed: until a Puzzle is loaded, digit keys do nothing in every Entry mode, placed digits included (not "paste wipes them"). Filed as task-15.
- Alix approved adding to AGENTS.md step 7: check that settled decisions are written into docs/spec/ before handing off. The rule was only in Claude's memory before, so the workflow didn't prompt for it during task-6.
