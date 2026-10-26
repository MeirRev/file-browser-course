import { describe, expect, it } from 'vitest';
import type { DirectoryEntry, Entry, FileEntry } from './entries';
import { buildTreeFromFiles } from './fileList';
import { fromDirectoryHandle, type DirectoryHandleLike, type FileHandleLike } from './fsAccess';
import { matchesName, searchTree, type DirectoryMatch } from './search';

function tree(paths: string[]): DirectoryEntry {
  const root = buildTreeFromFiles(
    paths.map((relativePath) => ({ relativePath, file: new File([''], relativePath.split('/').pop() ?? '') })),
  );
  if (!root) throw new Error('expected a tree');
  return root;
}

/** Flattens a match tree into "d path" / "f path" lines, depth-first. */
function summarize(match: DirectoryMatch | null): string[] {
  if (!match) return [];
  return [
    `d ${match.entry.path}`,
    ...match.children.flatMap((child) => (child.kind === 'directory' ? summarize(child) : [`f ${child.path}`])),
  ];
}

function fakeFile(name: string): FileHandleLike {
  return { kind: 'file', name, getFile: () => Promise.resolve(new File([''], name)) };
}

function fakeDirectory(name: string, children: Array<FileHandleLike | DirectoryHandleLike>): DirectoryHandleLike {
  return {
    kind: 'directory',
    name,
    async *values() {
      yield* children;
    },
  };
}

function brokenDirectory(name: string): DirectoryHandleLike {
  return {
    kind: 'directory',
    name,
    // eslint-disable-next-line require-yield
    async *values() {
      throw new Error('Permission denied');
    },
  };
}

describe('matchesName', () => {
  it('matches any part of the name, case-sensitively', () => {
    expect(matchesName('Report.pdf', 'port')).toBe(true);
    expect(matchesName('Report.pdf', 'Rep')).toBe(true);
    expect(matchesName('Report.pdf', 'rep')).toBe(false);
    expect(matchesName('Report.pdf', 'PDF')).toBe(false);
  });
});

describe('searchTree', () => {
  it('keeps only matching files and the folders that lead to them', async () => {
    const root = tree(['trip/notes.txt', 'trip/plan.txt', 'trip/photos/beach.jpg', 'trip/photos/notes-beach.txt']);
    const result = await searchTree(root, 'notes');
    expect(summarize(result.root)).toEqual([
      'd trip',
      'd trip/photos',
      'f trip/photos/notes-beach.txt',
      'f trip/notes.txt',
    ]);
    expect(result.failures).toEqual([]);
  });

  it('is case-sensitive', async () => {
    const root = tree(['docs/Readme.md', 'docs/readme.txt', 'docs/README']);
    expect(summarize((await searchTree(root, 'readme')).root)).toEqual(['d docs', 'f docs/readme.txt']);
    expect(summarize((await searchTree(root, 'README')).root)).toEqual(['d docs', 'f docs/README']);
    expect((await searchTree(root, 'ReadMe')).root).toBeNull();
  });

  it('searches nested folders that were never opened', async () => {
    const reads: string[] = [];
    function tracked(name: string, children: Array<FileHandleLike | DirectoryHandleLike>): DirectoryHandleLike {
      const handle = fakeDirectory(name, children);
      return {
        ...handle,
        values() {
          reads.push(name);
          return handle.values();
        },
      };
    }
    const root = fromDirectoryHandle(
      tracked('project', [tracked('src', [tracked('deep', [tracked('deeper', [fakeFile('target.ts')])])])]),
    );

    const result = await searchTree(root, 'target');
    expect(summarize(result.root)).toEqual([
      'd project',
      'd project/src',
      'd project/src/deep',
      'd project/src/deep/deeper',
      'f project/src/deep/deeper/target.ts',
    ]);
    expect(reads).toEqual(['project', 'src', 'deep', 'deeper']);
  });

  it('reports every file with the same name in different folders separately', async () => {
    const root = tree(['app/index.ts', 'app/a/index.ts', 'app/b/index.ts', 'app/b/other.ts']);
    const result = await searchTree(root, 'index.ts');
    expect(summarize(result.root)).toEqual([
      'd app',
      'd app/a',
      'f app/a/index.ts',
      'd app/b',
      'f app/b/index.ts',
      'f app/index.ts',
    ]);

    const files: FileEntry[] = [];
    (function collect(match: DirectoryMatch | null) {
      for (const child of match?.children ?? []) {
        if (child.kind === 'directory') collect(child);
        else files.push(child);
      }
    })(result.root);
    expect(new Set(files.map((file) => file.path)).size).toBe(3);
  });

  it('shows a matching folder with all of its contents, including sub-folders', async () => {
    const root = tree([
      'home/Backups/2024/jan.zip',
      'home/Backups/list.txt',
      'home/docs/cv.pdf',
      'home/docs/Backup-notes.txt',
    ]);
    expect(summarize((await searchTree(root, 'Backup')).root)).toEqual([
      'd home',
      'd home/Backups',
      'd home/Backups/2024',
      'f home/Backups/2024/jan.zip',
      'f home/Backups/list.txt',
      'd home/docs',
      'f home/docs/Backup-notes.txt',
    ]);
  });

  it('matches folder names case-sensitively too', async () => {
    const root = tree(['home/Backups/list.txt', 'home/backup-2024/a.txt', 'home/old-backup.zip', 'home/other.txt']);
    expect(summarize((await searchTree(root, 'backup')).root)).toEqual([
      'd home',
      'd home/backup-2024',
      'f home/backup-2024/a.txt',
      'f home/old-backup.zip',
    ]);
  });

  it('shows an empty folder whose name matches', async () => {
    const root = fromDirectoryHandle(
      fakeDirectory('root', [fakeDirectory('Archive', []), fakeDirectory('empty', []), fakeFile('a.txt')]),
    );
    const result = await searchTree(root, 'Archive');
    expect(summarize(result.root)).toEqual(['d root', 'd root/Archive']);
    expect(result.failures).toEqual([]);
  });

  it('lists each item once when a matching folder also holds matching items', async () => {
    const root = tree(['root/logs/logs-old/logs.txt', 'root/logs/other.txt']);
    expect(summarize((await searchTree(root, 'logs')).root)).toEqual([
      'd root',
      'd root/logs',
      'd root/logs/logs-old',
      'f root/logs/logs-old/logs.txt',
      'f root/logs/other.txt',
    ]);
  });

  it('shows an unreadable matching folder with its error and reports the failure', async () => {
    const root = fromDirectoryHandle(fakeDirectory('root', [brokenDirectory('Secrets')]));
    const result = await searchTree(root, 'Secret');
    expect(summarize(result.root)).toEqual(['d root', 'd root/Secrets']);
    expect(result.root?.children[0]).toMatchObject({ kind: 'directory', error: 'Permission denied' });
    expect(result.failures).toEqual([{ path: 'root/Secrets', message: 'Permission denied' }]);
  });

  it('returns no root and no failures when nothing matches', async () => {
    const result = await searchTree(tree(['a/b.txt']), 'zzz');
    expect(result).toEqual({ root: null, failures: [] });
  });

  it('reports unreadable folders as failures and keeps the other matches', async () => {
    const root = fromDirectoryHandle(
      fakeDirectory('root', [brokenDirectory('locked'), fakeDirectory('open', [fakeFile('match.txt')])]),
    );
    const result = await searchTree(root, 'match');
    expect(summarize(result.root)).toEqual(['d root', 'd root/open', 'f root/open/match.txt']);
    expect(result.failures).toEqual([{ path: 'root/locked', message: 'Permission denied' }]);
  });

  it('reports a failure, not an empty result, when the root folder cannot be read', async () => {
    const result = await searchTree(fromDirectoryHandle(brokenDirectory('root')), 'x');
    expect(result.root).toBeNull();
    expect(result.failures).toEqual([{ path: 'root', message: 'Permission denied' }]);
  });

  it('stops with the abort reason once the signal is aborted', async () => {
    const controller = new AbortController();
    let release: () => void = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const slow: DirectoryEntry = {
      kind: 'directory',
      name: 'slow',
      path: 'slow',
      async listChildren(): Promise<Entry[]> {
        await gate;
        return [{ kind: 'file', name: 'a.txt', path: 'slow/a.txt', getFile: () => Promise.resolve(new File([''], 'a')) }];
      },
    };

    const search = searchTree(slow, 'a', controller.signal);
    controller.abort(new Error('superseded'));
    release();
    await expect(search).rejects.toThrow('superseded');
  });
});
