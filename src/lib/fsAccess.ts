import { compareEntries, joinPath, type DirectoryEntry, type Entry, type FileEntry } from './entries';

/** The subset of FileSystemFileHandle this app relies on. */
export interface FileHandleLike {
  readonly kind: 'file';
  readonly name: string;
  getFile(): Promise<File>;
}

/** The subset of FileSystemDirectoryHandle this app relies on. */
export interface DirectoryHandleLike {
  readonly kind: 'directory';
  readonly name: string;
  values(): AsyncIterable<FileHandleLike | DirectoryHandleLike>;
}

export type DirectoryPicker = () => Promise<DirectoryHandleLike>;

interface PickerHost {
  showDirectoryPicker?: (options: { mode: 'read' }) => Promise<DirectoryHandleLike>;
}

/**
 * Returns a read-only folder picker backed by the File System Access API,
 * or null when the browser does not support it (e.g. Firefox, Safari).
 */
export function getDirectoryPicker(): DirectoryPicker | null {
  const host = globalThis as unknown as PickerHost;
  const picker = host.showDirectoryPicker;
  if (typeof picker !== 'function') return null;
  return () => picker.call(host, { mode: 'read' });
}

export function fromDirectoryHandle(handle: DirectoryHandleLike, parentPath?: string): DirectoryEntry {
  const path = joinPath(parentPath, handle.name);
  return {
    kind: 'directory',
    name: handle.name,
    path,
    async listChildren() {
      const children: Entry[] = [];
      for await (const child of handle.values()) {
        children.push(child.kind === 'directory' ? fromDirectoryHandle(child, path) : fromFileHandle(child, path));
      }
      return children.sort(compareEntries);
    },
  };
}

function fromFileHandle(handle: FileHandleLike, parentPath: string): FileEntry {
  return {
    kind: 'file',
    name: handle.name,
    path: joinPath(parentPath, handle.name),
    getFile: () => handle.getFile(),
  };
}
