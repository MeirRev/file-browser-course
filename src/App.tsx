import { useState } from 'react';
import { DetailsPanel } from './components/DetailsPanel';
import { FolderPicker } from './components/FolderPicker';
import { TreeView } from './components/TreeView';
import type { DirectoryEntry, FileEntry } from './lib/entries';

export function App() {
  const [root, setRoot] = useState<DirectoryEntry | null>(null);
  const [selected, setSelected] = useState<FileEntry | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Bumped on every open so reopening a folder with the same name starts a fresh tree.
  const [openCount, setOpenCount] = useState(0);

  function handleOpen(folder: DirectoryEntry) {
    setRoot(folder);
    setOpenCount((count) => count + 1);
    setSelected(null);
    setError(null);
  }

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1 className="app-title">File Browser</h1>
          <p className="app-subtitle">Read-only · runs entirely in your browser · nothing is uploaded or saved</p>
        </div>
        <FolderPicker onOpen={handleOpen} onError={setError} />
      </header>

      {error && (
        <div className="alert" role="alert">
          {error}
        </div>
      )}

      <main className="layout">
        <nav className="tree-pane" aria-label="Folder contents">
          {root ? (
            <TreeView key={openCount} root={root} selectedPath={selected?.path ?? null} onSelect={setSelected} />
          ) : (
            <p className="placeholder">No folder open. Choose “Open folder…” to browse one.</p>
          )}
        </nav>
        <section className="details-pane" aria-label="File details">
          {selected ? (
            <DetailsPanel key={selected.path} entry={selected} />
          ) : (
            <p className="placeholder">{root ? 'Select a file to see its details.' : 'File details appear here.'}</p>
          )}
        </section>
      </main>
    </div>
  );
}
