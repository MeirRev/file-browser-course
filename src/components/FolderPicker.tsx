import { useCallback, useMemo, useRef, type ChangeEvent } from 'react';
import type { DirectoryEntry } from '../lib/entries';
import { describeError, isAbortError } from '../lib/errors';
import { buildTreeFromFiles } from '../lib/fileList';
import { fromDirectoryHandle, getDirectoryPicker } from '../lib/fsAccess';

interface FolderPickerProps {
  onOpen(folder: DirectoryEntry): void;
  onError(message: string): void;
}

/**
 * Opens a folder read-only: through the File System Access API where available
 * (Chromium browsers), otherwise through a hidden <input webkitdirectory>.
 */
export function FolderPicker({ onOpen, onError }: FolderPickerProps) {
  const nativePicker = useMemo(getDirectoryPicker, []);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // React has no typed prop for webkitdirectory, so set the attribute directly.
  const attachInput = useCallback((input: HTMLInputElement | null) => {
    inputRef.current = input;
    input?.setAttribute('webkitdirectory', '');
  }, []);

  async function handleClick() {
    if (!nativePicker) {
      inputRef.current?.click();
      return;
    }
    try {
      onOpen(fromDirectoryHandle(await nativePicker()));
    } catch (error) {
      if (!isAbortError(error)) onError(`Could not open the folder: ${describeError(error)}`);
    }
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    // Reset so that picking the same folder again still fires a change event.
    event.target.value = '';
    const folder = buildTreeFromFiles(files.map((file) => ({ relativePath: file.webkitRelativePath || file.name, file })));
    if (folder) onOpen(folder);
    else onError('The selected folder is empty, or the browser could not read it.');
  }

  return (
    <>
      <button type="button" className="button button--primary" onClick={() => void handleClick()}>
        Open folder…
      </button>
      {!nativePicker && <input ref={attachInput} type="file" multiple hidden onChange={handleInputChange} />}
    </>
  );
}
