export function describeError(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return String(error);
}

/** True when the user dismissed a picker dialog — not a real failure. */
export function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}
