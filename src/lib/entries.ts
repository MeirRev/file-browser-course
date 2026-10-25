/**
 * A read-only view of a folder tree, independent of where the files came from
 * (File System Access API handles or an <input webkitdirectory> file list).
 */
export type Entry = FileEntry | DirectoryEntry;

export interface FileEntry {
  readonly kind: 'file';
  readonly name: string;
  /** Slash-separated path starting with the root folder's name. Unique within a tree. */
  readonly path: string;
  getFile(): Promise<File>;
}

export interface DirectoryEntry {
  readonly kind: 'directory';
  readonly name: string;
  readonly path: string;
  /** Children sorted with {@link compareEntries}. Loaded on demand. */
  listChildren(): Promise<Entry[]>;
}

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

/** Folders first, then natural name order ("file2" before "file10"). */
export function compareEntries(a: Entry, b: Entry): number {
  if (a.kind !== b.kind) return a.kind === 'directory' ? -1 : 1;
  return collator.compare(a.name, b.name) || a.name.localeCompare(b.name);
}

export function joinPath(parentPath: string | undefined, name: string): string {
  return parentPath === undefined ? name : `${parentPath}/${name}`;
}
