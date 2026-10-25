import { compareEntries, joinPath, type DirectoryEntry, type Entry, type FileEntry } from './entries';

export interface RelativeFile {
  /** Path relative to the picked folder's parent, e.g. "photos/2024/a.jpg" (File.webkitRelativePath). */
  readonly relativePath: string;
  readonly file: File;
}

interface DraftDirectory {
  readonly name: string;
  readonly path: string;
  readonly directories: Map<string, DraftDirectory>;
  readonly files: FileEntry[];
}

/**
 * Builds a tree from the flat file list produced by <input webkitdirectory>.
 * Returns null when the list is empty. Empty sub-folders are not part of such
 * a list, so they cannot appear in the tree.
 */
export function buildTreeFromFiles(items: readonly RelativeFile[]): DirectoryEntry | null {
  const first = items[0];
  if (!first) return null;

  const rootName = splitPath(first.relativePath)[0] ?? '';
  const root = createDraft(rootName, rootName);

  for (const { relativePath, file } of items) {
    const segments = splitPath(relativePath);
    // Drop the root folder name; the remaining segments end with the file name.
    const fileName = segments.pop() ?? file.name;
    let directory = root;
    for (const segment of segments.slice(1)) {
      let next = directory.directories.get(segment);
      if (!next) {
        next = createDraft(segment, joinPath(directory.path, segment));
        directory.directories.set(segment, next);
      }
      directory = next;
    }
    directory.files.push({
      kind: 'file',
      name: fileName,
      path: joinPath(directory.path, fileName),
      getFile: () => Promise.resolve(file),
    });
  }

  return finalize(root);
}

function splitPath(path: string): string[] {
  return path.split(/[\\/]/).filter(Boolean);
}

function createDraft(name: string, path: string): DraftDirectory {
  return { name, path, directories: new Map(), files: [] };
}

function finalize(draft: DraftDirectory): DirectoryEntry {
  const children: Entry[] = [...Array.from(draft.directories.values(), finalize), ...draft.files].sort(compareEntries);
  return {
    kind: 'directory',
    name: draft.name,
    path: draft.path,
    listChildren: () => Promise.resolve(children),
  };
}
