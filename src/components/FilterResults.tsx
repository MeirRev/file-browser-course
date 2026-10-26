import { useEffect, useState } from 'react';
import type { DirectoryEntry, FileEntry } from '../lib/entries';
import { describeError } from '../lib/errors';
import { searchTree, type DirectoryMatch, type SearchResult } from '../lib/search';
import { FileNode, TreeStatus, depthStyle } from './TreeView';

interface FilterResultsProps {
  root: DirectoryEntry;
  /** Non-empty, case-sensitive part of a file or folder name. */
  query: string;
  selectedPath: string | null;
  onSelect(entry: FileEntry): void;
}

type SearchState =
  | { status: 'searching' }
  | { status: 'done'; result: SearchResult }
  | { status: 'error'; message: string };

/** Files and folders under `root` whose name contains `query`, shown under the folders that lead to them. */
export function FilterResults({ root, query, selectedPath, onSelect }: FilterResultsProps) {
  const [state, setState] = useState<SearchState>({ status: 'searching' });

  useEffect(() => {
    let cancelled = false;
    // Aborting stops the folder scan early; the flag keeps a superseded search from replacing newer results.
    const controller = new AbortController();
    setState({ status: 'searching' });
    searchTree(root, query, controller.signal).then(
      (result) => {
        if (!cancelled) setState({ status: 'done', result });
      },
      (reason: unknown) => {
        if (!cancelled) setState({ status: 'error', message: `The search failed: ${describeError(reason)}` });
      },
    );
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [root, query]);

  if (state.status === 'searching') {
    return (
      <p className="placeholder" role="status">
        Searching…
      </p>
    );
  }
  if (state.status === 'error') {
    return (
      <p className="alert filter-alert" role="alert">
        {state.message}
      </p>
    );
  }

  const { root: match, failures } = state.result;
  return (
    <>
      {failures.length > 0 && (
        <div className="alert filter-alert" role="alert">
          <p className="filter-alert-title">
            Search incomplete: {failures.length === 1 ? '1 folder' : `${failures.length} folders`} could not be read.
          </p>
          <ul className="filter-failures">
            {failures.map((failure) => (
              <li key={failure.path}>
                {failure.path}: {failure.message}
              </li>
            ))}
          </ul>
        </div>
      )}
      {match ? (
        <ul className="tree" role="tree" aria-label={`Files and folders matching “${query}”`}>
          <MatchDirectoryNode match={match} depth={0} selectedPath={selectedPath} onSelect={onSelect} />
        </ul>
      ) : (
        failures.length === 0 && (
          <p className="placeholder" role="status">
            No file or folder names contain “{query}”. The filter is case-sensitive.
          </p>
        )
      )}
    </>
  );
}

interface MatchDirectoryNodeProps {
  match: DirectoryMatch;
  depth: number;
  selectedPath: string | null;
  onSelect(entry: FileEntry): void;
}

function MatchDirectoryNode({ match, depth, selectedPath, onSelect }: MatchDirectoryNodeProps) {
  const [expanded, setExpanded] = useState(true);
  const childDepth = depth + 1;

  return (
    <li className="tree-item" role="treeitem" aria-expanded={expanded}>
      <button type="button" className="tree-row" style={depthStyle(depth)} onClick={() => setExpanded((value) => !value)}>
        <span className="tree-chevron" aria-hidden="true">
          {expanded ? '▾' : '▸'}
        </span>
        <span className="tree-icon" aria-hidden="true">
          {expanded ? '📂' : '📁'}
        </span>
        <span className="tree-name">{match.entry.name}</span>
      </button>
      {expanded && (
        <ul className="tree-group" role="group">
          {match.error !== undefined ? (
            <TreeStatus depth={childDepth} tone="error">
              {`Could not read this folder: ${match.error}`}
            </TreeStatus>
          ) : match.children.length === 0 ? (
            <TreeStatus depth={childDepth}>Empty folder</TreeStatus>
          ) : (
            match.children.map((child) =>
              child.kind === 'directory' ? (
                <MatchDirectoryNode
                  key={child.entry.path}
                  match={child}
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
