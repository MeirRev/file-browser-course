import type { DirectoryEntry, FileEntry } from './entries';
import { describeError } from './errors';

/**
 * A folder in the search results: either its own name matched (then it holds
 * all of its contents) or it leads to at least one match (then it holds only
 * the matching parts of its contents).
 */
export interface DirectoryMatch {
  readonly kind: 'directory';
  readonly entry: DirectoryEntry;
  /** Sub-folders, then files, in tree order. Empty for an empty or unreadable folder whose name matched. */
  readonly children: ReadonlyArray<DirectoryMatch | FileEntry>;
  /** Set when the folder is shown but its contents could not be read. */
  readonly error?: string;
}

export interface SearchFailure {
  /** Path of the folder that could not be read. */
  readonly path: string;
  readonly message: string;
}

export interface SearchResult {
  /** The matches under the root folder, or null when no file or folder matched. */
  readonly root: DirectoryMatch | null;
  /** Folders that could not be read, so their contents were not searched. */
  readonly failures: readonly SearchFailure[];
}

/** Case-sensitive "name contains query" test. Only names are compared, never contents. */
export function matchesName(name: string, query: string): boolean {
  return name.includes(query);
}

/**
 * Searches every folder under `root` (whether or not it was opened in the tree)
 * for files and folders whose name contains `query`. A matching folder comes
 * with all of its contents; a matching file comes under the folders that lead
 * to it. Each item appears once. A folder that cannot be read is recorded in
 * `failures` instead of failing the whole search. Rejects with the signal's
 * reason once `signal` is aborted.
 */
export async function searchTree(root: DirectoryEntry, query: string, signal?: AbortSignal): Promise<SearchResult> {
  const failures: SearchFailure[] = [];
  const match = await searchDirectory(root, query, false, failures, signal);
  // Folders are read in parallel, so failures arrive in no particular order.
  failures.sort((a, b) => a.path.localeCompare(b.path));
  return { root: match, failures };
}

/** `insideMatch` is true below a folder whose name matched: everything there is shown. */
async function searchDirectory(
  directory: DirectoryEntry,
  query: string,
  insideMatch: boolean,
  failures: SearchFailure[],
  signal: AbortSignal | undefined,
): Promise<DirectoryMatch | null> {
  const includeAll = insideMatch || matchesName(directory.name, query);
  signal?.throwIfAborted();
  let entries;
  try {
    entries = await directory.listChildren();
  } catch (error) {
    signal?.throwIfAborted();
    const message = describeError(error);
    failures.push({ path: directory.path, message });
    return includeAll ? { kind: 'directory', entry: directory, children: [], error: message } : null;
  }
  signal?.throwIfAborted();

  const children = await Promise.all(
    entries.map((entry) =>
      entry.kind === 'directory'
        ? searchDirectory(entry, query, includeAll, failures, signal)
        : includeAll || matchesName(entry.name, query)
          ? entry
          : null,
    ),
  );
  const matches = children.filter((child) => child !== null);
  return includeAll || matches.length > 0 ? { kind: 'directory', entry: directory, children: matches } : null;
}
