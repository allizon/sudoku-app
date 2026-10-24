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
- `.claude/agents/`: `test-writer.md`, `implementer.md`, `code-reviewer.md`, `ux-reviewer.md`. Reviewers have no edit tools. Each ends on a checkpoint; the reviewers' checkpoint requires checking every relevant rule before an empty findings list counts.
- `AGENTS.md`: new "Agents" section (who does which step); workflow grew from 7 to 8 steps with a **Review** step (5); handoff now includes a review summary with every declined finding; new "Review record" section.
- Claude's own calls, flagged for review: the implementer may not change approved tests (it stops and reports instead); the ux-reviewer's five review areas (keyboard, visible state, feedback, accessibility, clarity), with WCAG AA as the contrast bar; reviewers flag disagreements with the spec as "spec questions."
