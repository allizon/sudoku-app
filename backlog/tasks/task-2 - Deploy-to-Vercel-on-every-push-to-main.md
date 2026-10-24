---
id: TASK-2
title: Deploy to Vercel on every push to main
status: To Do
assignee: []
created_date: '2026-10-24 19:21'
updated_date: '2026-10-24 19:26'
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
