---
title: "License & Publish Setup"
type: quick-work
date: 2026-06-01
---

# License & Publish Setup

## Task

Add license file, prepare package.json for publishing, create repo at bopstack org, commit AGENTS.md and push.

## Changes

- `LICENSE` — added standard MIT license (copyright BopStack, 2026)
- `package.json` — added `repository` (git+https://github.com/BopStack/config.git), `bugs`, `homepage`, `author`, `engines` (node >=20), `publishConfig` (public access)
- GitHub repo created: `BopStack/config` (public)
- Git remote configured: `git@github.com:BopStack/config.git`
- `AGENTS.md`, `LICENSE`, `package.json` committed and pushed to `origin/main`

## Verification

- `gh repo create BopStack/config` returned success URL
- `git push -u origin main` succeeded (new branch tracked)
- gh auth status: logged in as brunoti, scoped for repos/orgs

## Notes

- Package is `@bopstack/config` — scoped, so `publishConfig.access: public` is required for npm publishing
- Repo follows pattern of existing `BopStack/lint` org repos
