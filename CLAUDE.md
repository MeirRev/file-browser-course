# File Browser

## Forbidden

- At runtime the app makes no network requests, uses no localStorage or IndexedDB, and never writes to the user's files, so the files and everything about them stay on the user's machine, unchanged. This does not stop you from editing code, running tests or writing documentation during development.
- Code in `src/lib/` must not import React or anything from `src/components/`, so the core logic does not depend on the user interface.
- Use the CSS variables from `src/styles/tokens.css` for design values, and do not add parallel values outside it, so the design stays consistent.

## Conventions

- Keep each change focused on the request. Report unrelated bugs you find, but do not fix them.
- In the final report, separate checks you actually ran from manual checks that are still pending. Never present a check that was not run as passed.

## Stack

React and TypeScript, built with Vite. Tests use Vitest; linting uses ESLint.

## Commands

- `npm run dev` — start the dev server to view the app in the browser.
- `npm run check` — typecheck, lint and run the automated tests.
- `npm run build` — create a production build.

These are the available commands and what they do, not a list to run on every task.

## Background / open questions

No known open questions at the moment.
