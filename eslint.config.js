import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const NO_NETWORK = 'The app is offline-only: no network calls.';
const NO_PERSISTENCE = 'The app keeps no data: no browser storage.';
const READ_ONLY = 'Folder access is read-only: no write operations.';

const forbiddenGlobals = [
  { name: 'fetch', message: NO_NETWORK },
  { name: 'XMLHttpRequest', message: NO_NETWORK },
  { name: 'WebSocket', message: NO_NETWORK },
  { name: 'EventSource', message: NO_NETWORK },
  { name: 'localStorage', message: NO_PERSISTENCE },
  { name: 'sessionStorage', message: NO_PERSISTENCE },
  { name: 'indexedDB', message: NO_PERSISTENCE },
  { name: 'caches', message: NO_PERSISTENCE },
];

const forbiddenProperties = [
  ...['window', 'globalThis', 'self'].flatMap((object) =>
    forbiddenGlobals.map(({ name, message }) => ({ object, property: name, message })),
  ),
  { object: 'navigator', property: 'sendBeacon', message: NO_NETWORK },
  { object: 'navigator', property: 'storage', message: NO_PERSISTENCE },
  { property: 'createWritable', message: READ_ONLY },
  { property: 'removeEntry', message: READ_ONLY },
  { property: 'showSaveFilePicker', message: READ_ONLY },
];

export default tseslint.config(
  { ignores: ['dist', 'node_modules', '_bmad', '_bmad-output', '.claude'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'no-restricted-globals': ['error', ...forbiddenGlobals],
      'no-restricted-properties': ['error', ...forbiddenProperties],
    },
  },
  {
    // The core must stay framework-agnostic.
    files: ['src/lib/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['react', 'react/*', 'react-dom', 'react-dom/*'],
              message: 'src/lib must not depend on React or any UI framework.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['*.{js,ts}'],
    languageOptions: { globals: globals.node },
  },
);
