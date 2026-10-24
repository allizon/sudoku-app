---
id: TASK-2
title: Deploy to Vercel on every push to main
status: In Progress
assignee:
  - '@claude'
created_date: 2026-10-24 19:21
updated_date: '2026-10-24T21:18:00Z'
labels:
  - hitl
milestone: m-0
dependencies:
  - TASK-1
  - TASK-9
documentation:
  - AGENTS.md
  - docs/spec/milestones.md
ordinal: 2000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
M0 requires the app to be deployed to Vercel through its GitHub integration, so that every push to main deploys automatically. Doing this right after the scaffold (task-1, which provides a buildable app showing an empty grid) proves the full path to production before any features exist.

Human-in-the-loop: connecting the GitHub repository to a Vercel project is done by Alix in the Vercel dashboard; an agent cannot do it. The agent's part is to make the build deployable, write down the setup, and verify the result once Alix has connected it.

Pushing main deploys to production, so push main only with Alix's approval (AGENTS.md workflow step 8).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The GitHub repository is connected to a Vercel project (done by Alix)
- [ ] #2 A push to main triggers a production deploy without any manual step
- [ ] #3 The deployed URL shows the same empty grid as the local build
- [ ] #4 README.md records the production URL and states that every push to main deploys
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verified before merge: GitHub commit status 'Vercel: success, Deployment has completed' on main c6a5031 (pushed with no manual step); live https://sudoku-app-navy.vercel.app/ serves assets/index-FWB0E65u.js and index-DqDGYLJm.css, identical content-hashed files to a local build of main. No tests: README/config-only task.
## Review round 1
- minor README claimed the type-check runs on deploy without checking Vercel's build command — Fixed: added vercel.json with buildCommand 'npm run build'; README points to it (fixed by main session, not implementer, given size).
- minor README didn't say tests don't run on Vercel / what a failed deploy means — Fixed: README says the previous version stays live and to run npm test before pushing.
- minor preview deploys for branches not mentioned — Declined: unverified for this project; not in the acceptance criteria.
- minor (§M0) commit suffix isn't a spec section — Declined: Alix approved (setup)/(§M0) for milestone work.
<!-- SECTION:NOTES:END -->
