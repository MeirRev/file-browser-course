import { describe, expect, it } from 'vitest';
import type { DirectoryEntry, Entry } from './entries';
import { buildTreeFromFiles } from './fileList';
import { fromDirectoryHandle, type DirectoryHandleLike, type FileHandleLike } from './fsAccess';

function file(name: string, contents = ''): File {
  return new File([contents], name, { lastModified: 0 });
}

function summarize(entries: Entry[]): string[] {
  return entries.map((entry) => `${entry.kind === 'directory' ? 'd' : 'f'} ${entry.path}`);
}

async function childDirectory(parent: DirectoryEntry, name: string): Promise<DirectoryEntry> {
  const child = (await parent.listChildren()).find((entry) => entry.name === name);
  if (child?.kind !== 'directory') throw new Error(`No folder named ${name}`);
  return child;
}

describe('buildTreeFromFiles', () => {
  it('returns null for an empty selection', () => {
    expect(buildTreeFromFiles([])).toBeNull();
  });

  it('nests files under their folders, folders first in natural order', async () => {
    const photo = file('b.jpg', 'jpeg');
    const root = buildTreeFromFiles([
      { relativePath: 'trip/notes10.txt', file: file('notes10.txt') },
      { relativePath: 'trip/photos/b.jpg', file: photo },
      { relativePath: 'trip/notes2.txt', file: file('notes2.txt') },
      { relativePath: 'trip/photos/a.jpg', file: file('a.jpg') },
      { relativePath: 'trip/Docs/plan.pdf', file: file('plan.pdf') },
    ]);
    if (!root) throw new Error('expected a tree');

    expect(root).toMatchObject({ kind: 'directory', name: 'trip', path: 'trip' });
    expect(summarize(await root.listChildren())).toEqual([
      'd trip/Docs',
      'd trip/photos',
      'f trip/notes2.txt',
      'f trip/notes10.txt',
    ]);

    const photos = await childDirectory(root, 'photos');
    expect(summarize(await photos.listChildren())).toEqual(['f trip/photos/a.jpg', 'f trip/photos/b.jpg']);

    const [, second] = await photos.listChildren();
    if (second?.kind !== 'file') throw new Error('expected a file');
    await expect(second.getFile()).resolves.toBe(photo);
  });
});

function fakeFile(name: string): FileHandleLike {
  return { kind: 'file', name, getFile: () => Promise.resolve(file(name)) };
}

function fakeDirectory(name: string, children: Array<FileHandleLike | DirectoryHandleLike>): DirectoryHandleLike & {
  reads: number;
} {
  const handle = {
    kind: 'directory' as const,
    name,
    reads: 0,
    async *values() {
      handle.reads += 1;
      yield* children;
    },
  };
  return handle;
}

describe('fromDirectoryHandle', () => {
  it('lists children lazily, sorted, with full paths', async () => {
    const nested = fakeDirectory('src', [fakeFile('main.ts')]);
    const root = fromDirectoryHandle(fakeDirectory('project', [fakeFile('README.md'), nested, fakeFile('.env')]));

    expect(root.path).toBe('project');
    expect(nested.reads).toBe(0);

    expect(summarize(await root.listChildren())).toEqual(['d project/src', 'f project/.env', 'f project/README.md']);
    expect(nested.reads).toBe(0);

    const src = await childDirectory(root, 'src');
    expect(summarize(await src.listChildren())).toEqual(['f project/src/main.ts']);
    expect(nested.reads).toBeGreaterThan(0);
  });

  it('reads file contents through the handle', async () => {
    const root = fromDirectoryHandle(fakeDirectory('docs', [fakeFile('a.txt')]));
    const [entry] = await root.listChildren();
    if (entry?.kind !== 'file') throw new Error('expected a file');
    await expect(entry.getFile()).resolves.toMatchObject({ name: 'a.txt' });
  });
});
