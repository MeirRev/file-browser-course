# Local-only file processing

The app processes files locally in the browser. At runtime it makes no network requests, uses no localStorage or IndexedDB, and never writes to the user's files, so the files and everything about them stay on the user's machine, unchanged.

This rule is about what the app does when someone uses it. It does not stop you from editing code, running tests or writing documentation during development.
