---
name: release-semver-push
type: chore
description: Commit changes, choose the next semantic version, create the release tag, update changelog, and push.
created: 2026-06-12
---

# Release Semver Push

Use this chore when local changes are ready to become a tagged release. It commits the current work, analyses commits since the last tag to choose the next semantic version, bumps `package.json`, creates the release tag, regenerates `CHANGELOG.md`, commits the changelog into the release commit, and pushes the branch plus tag.

This chore is intentionally interactive at the commit-message and version-selection points.

## Pre-conditions

Before running this chore, ensure:
- [ ] You are on the branch that should be released.
- [ ] All intended changes are present in the working tree.
- [ ] No unrelated or surprise files are in `git status --short`.
- [ ] The remote branch and tag destination are correct.
- [ ] You have permission to push commits and tags.

## Steps

### Step 1: Review pending changes

Inspect the working tree before committing.

```bash
git status --short
git diff --stat
git diff
branch="$(git branch --show-current)"
```

Expected: only intended release changes are present, and `branch` is the branch to release.

### Step 2: Run the release gate

Run the repository gate before creating a release commit.

```bash
just check
```

Expected: formatting, linting, typecheck, unit tests, e2e tests, build, and pack all pass.

### Step 3: Commit current changes

Stage and commit the reviewed changes. Replace the message with an accurate Conventional Commit message.

```bash
git add -A
git commit -m "fix: describe the released change"
```

Expected: a new commit is created and `git status --short` is clean.

### Step 4: Analyse commits since the last tag

Review commit history since the most recent tag and decide the next semantic version.

```bash
last_tag="$(git describe --tags --abbrev=0)"
git log --oneline "${last_tag}"..HEAD
git diff --stat "${last_tag}"..HEAD
pnpm pkg get version
```

Expected: the change set is clear enough to choose the next version.

Version decision guide:
- Major: breaking API or behaviour change, including `!` commits or `BREAKING CHANGE` footers.
- Minor: backwards-compatible user-facing feature.
- Patch: backwards-compatible bug fix, docs/config/tooling update, or small maintenance release.

### Step 5: Set the chosen version

Store the chosen version in a shell variable. Replace the example with the selected semantic version.

```bash
version="0.2.3"
```

Expected: `version` contains the exact next version without a leading `v`.

### Step 6: Bump version, tag, and update changelog

Use the repository release recipe. It updates `package.json`, creates `v${version}`, regenerates `CHANGELOG.md`, amends the release commit to include the changelog, and moves the tag to the amended commit.

```bash
just release "${version}"
```

Expected: the release commit contains `package.json` and `CHANGELOG.md`, and local tag `v${version}` points at that commit.

### Step 7: Verify the release commit and tag

Confirm the working tree, latest commit, and tag target before pushing.

```bash
git status --short
git log --oneline -1
git show --stat --oneline "v${version}"
```

Expected: working tree is clean, latest commit is `chore: release v${version}`, and tag `v${version}` points at that commit.

### Step 8: Push branch and tag

Push the release commit and release tag.

```bash
git push origin HEAD
git push origin "v${version}"
```

Expected: the branch and `v${version}` tag are available on the remote.

### Step 9: Verify remote state

Check that the pushed branch and tag are visible remotely.

```bash
git ls-remote --heads origin "${branch}"
git ls-remote --tags origin "v${version}"
```

Expected: remote refs are returned for the pushed branch and tag.

## Failure Handling

If any step fails:
1. Stop immediately; do not continue to later release steps.
2. If review shows unrelated files, unstage them or ask the owner before proceeding.
3. If `just check` fails, fix the failing gate before committing.
4. If the initial commit message is wrong before release tagging, amend it before running `just release`.
5. If semantic-version choice is unclear, compare commits to the version decision guide and ask for confirmation.
6. If `just release` fails after changing files, inspect `git status --short`, `git log --oneline -3`, and `git tag --list "v${version}"` before retrying.
7. If push is rejected, fetch and inspect the remote state before any rebase, merge, force push, or tag replacement.
8. If the remote tag already exists, abort unless the release owner explicitly approves replacing it.

## Post-conditions

After successful completion:
- [ ] The release commit is on the remote branch.
- [ ] The `v${version}` tag exists on the remote.
- [ ] `package.json` contains the released version.
- [ ] `CHANGELOG.md` includes the released version entry.
- [ ] Local working tree is clean.

## Notes

- Do not run this chore for an unreviewed working tree.
- The `just release` recipe intentionally amends the release commit so `package.json` and `CHANGELOG.md` land together.
- Push the tag only after verifying the release commit and changelog.
- This chore does not publish the package to a registry.
