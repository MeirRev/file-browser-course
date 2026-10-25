import { useEffect, useState, type CSSProperties } from 'react';
import type { DirectoryEntry, Entry, FileEntry } from '../lib/entries';
import { describeError } from '../lib/errors';
import { getFileType, isLargeFile, type FileCategory } from '../lib/fileInfo';

interface TreeViewProps {
  root: DirectoryEntry;
  selectedPath: string | null;
  onSelect(entry: FileEntry): void;
}

export function TreeView({ root, selectedPath, onSelect }: TreeViewProps) {
  return (
    <ul className="tree" role="tree" aria-label={root.name}>
      <DirectoryNode entry={root} depth={0} initiallyExpanded selectedPath={selectedPath} onSelect={onSelect} />
    </ul>
  );
}

interface NodeProps<T extends Entry> {
  entry: T;
  depth: number;
  selectedPath: string | null;
  onSelect(entry: FileEntry): void;
}

function DirectoryNode({
  entry,
  depth,
  initiallyExpanded = false,
  selectedPath,
  onSelect,
}: NodeProps<DirectoryEntry> & { initiallyExpanded?: boolean }) {
  const [expanded, setExpanded] = useState(initiallyExpanded);
  const [children, setChildren] = useState<Entry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!expanded || children !== null || error !== null) return;
    let cancelled = false;
    entry.listChildren().then(
      (loaded) => {
        if (!cancelled) setChildren(loaded);
      },
      (reason: unknown) => {
        if (!cancelled) setError(`Could not read this folder: ${describeError(reason)}`);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [entry, expanded, children, error]);

  function toggle() {
    setExpanded((value) => !value);
    // Collapsing and re-expanding retries a folder that failed to load.
    setError(null);
  }

  const childDepth = depth + 1;

  return (
    <li className="tree-item" role="treeitem" aria-expanded={expanded}>
      <button type="button" className="tree-row" style={depthStyle(depth)} onClick={toggle}>
        <span className="tree-chevron" aria-hidden="true">
          {expanded ? '▾' : '▸'}
        </span>
        <span className="tree-icon" aria-hidden="true">
          {expanded ? '📂' : '📁'}
        </span>
        <span className="tree-name">{entry.name}</span>
      </button>
      {expanded && (
        <ul className="tree-group" role="group">
          {error !== null ? (
            <TreeStatus depth={childDepth} tone="error">
              {error}
            </TreeStatus>
          ) : children === null ? (
            <TreeStatus depth={childDepth}>Loading…</TreeStatus>
          ) : children.length === 0 ? (
            <TreeStatus depth={childDepth}>Empty folder</TreeStatus>
          ) : (
            children.map((child) =>
              child.kind === 'directory' ? (
                <DirectoryNode
                  key={child.path}
                  entry={child}
                  depth={childDepth}
                  selectedPath={selectedPath}
                  onSelect={onSelect}
                />
              ) : (
                <FileNode
                  key={child.path}
                  entry={child}
                  depth={childDepth}
                  selectedPath={selectedPath}
                  onSelect={onSelect}
                />
              ),
            )
          )}
        </ul>
      )}
    </li>
  );
}

const CATEGORY_ICONS: Record<FileCategory, string> = {
  image: '🖼️',
  video: '🎞️',
  audio: '🎵',
  text: '📄',
  code: '📜',
  document: '📕',
  archive: '🗜️',
  other: '📄',
};

function FileNode({ entry, depth, selectedPath, onSelect }: NodeProps<FileEntry>) {
  const selected = entry.path === selectedPath;
  const { category } = getFileType(entry.name);
  const [large, setLarge] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // A file that cannot be read simply gets no badge; the details panel reports the error.
    entry.getFile().then(
      (file) => {
        if (!cancelled) setLarge(isLargeFile(file.size));
      },
      () => {},
    );
    return () => {
      cancelled = true;
    };
  }, [entry]);

  return (
    <li className="tree-item" role="treeitem" aria-selected={selected}>
      <button
        type="button"
        className={selected ? 'tree-row tree-row--selected' : 'tree-row'}
        style={depthStyle(depth)}
        onClick={() => onSelect(entry)}
      >
        <span className="tree-chevron" aria-hidden="true" />
        <span className="tree-icon" aria-hidden="true">
          {CATEGORY_ICONS[category]}
        </span>
        <span className="tree-name">{entry.name}</span>
        {large && <span className="tree-badge">Large file</span>}
      </button>
    </li>
  );
}

function TreeStatus({ depth, tone, children }: { depth: number; tone?: 'error'; children: string }) {
  return (
    <li className={tone === 'error' ? 'tree-status tree-status--error' : 'tree-status'} style={depthStyle(depth)}>
      {children}
    </li>
  );
}

function depthStyle(depth: number): CSSProperties {
  return { '--depth': depth } as CSSProperties;
}
