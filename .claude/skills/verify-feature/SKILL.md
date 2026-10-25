---
name: verify-feature
description: Verify a feature in this file-browser project and assess whether it is ready to commit. Use when the user asks to check, test or verify a feature, or asks if work is ready to commit.
---

# Verify feature

Verify only. Report and stop:

- Do not edit code, tests, configuration or settings.
- Do not stage, commit or push.
- If a check fails, report the failure and wait for the user's instructions. Do not try to fix it.

## Steps

1. **Identify the feature and its scope.** Ask the user which feature to verify if it is unclear. Run `git status` and `git diff` (plus `git diff --staged`) to list the files that changed. Point out any change that does not belong to the feature.
2. **Run `npm run check`** (typecheck, lint, tests). For each stage, report whether it passed or failed. For a failure, quote the relevant error lines. The script stops at the first failure, so name the stages that did not run.
3. **Suggest manual checks.** Give a short list of manual checks for this feature in the browser (`npm run dev`), including edge cases such as an empty folder, files with no extension or dotfiles, very large files, Hebrew/RTL names and dates, and unreadable files. Include a check that the feature makes no network requests and does not use localStorage or IndexedDB (see `.claude/rules/local-only.md`).
4. **Separate done from pending.** List what you actually ran and saw, and separately what the user still has to check by hand. Never present a check that has not run as passed.
5. **List missing evidence.** Say what is still missing before the work can be committed, such as manual checks that have not been done, untested edge cases or failing stages. Then give a short verdict: ready, ready once the listed checks are done, or not ready.
