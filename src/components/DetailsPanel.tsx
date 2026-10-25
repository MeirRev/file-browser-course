import { useEffect, useState } from 'react';
import type { FileEntry } from '../lib/entries';
import { describeError } from '../lib/errors';
import { formatBytes, formatDateTime, formatExactBytes, getFileType } from '../lib/fileInfo';
import { DetailsList, type DetailItem } from './DetailsList';
import { ImageDetails } from './ImageDetails';

type LoadState = { status: 'loading' } | { status: 'ready'; file: File } | { status: 'error'; message: string };

export function DetailsPanel({ entry }: { entry: FileEntry }) {
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    entry.getFile().then(
      (file) => {
        if (!cancelled) setState({ status: 'ready', file });
      },
      (reason: unknown) => {
        if (!cancelled) setState({ status: 'error', message: `Could not read this file: ${describeError(reason)}` });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [entry]);

  return (
    <article className="details">
      <h2 className="details-title">{entry.name}</h2>
      {state.status === 'loading' && <p className="placeholder">Reading file…</p>}
      {state.status === 'error' && (
        <p className="alert" role="alert">
          {state.message}
        </p>
      )}
      {state.status === 'ready' && <FileDetails entry={entry} file={state.file} />}
    </article>
  );
}

function FileDetails({ entry, file }: { entry: FileEntry; file: File }) {
  const type = getFileType(entry.name, file.type);
  const modified = formatDateTime(file.lastModified);
  const items: DetailItem[] = [
    { label: 'Name', value: entry.name },
    { label: 'Size', value: `${formatBytes(file.size)} (${formatExactBytes(file.size)})` },
    { label: 'Type', value: type.mime ? `${type.label} (${type.mime})` : type.label },
    { label: 'Last modified', value: modified.text, lang: modified.lang, dir: modified.dir },
    { label: 'Path', value: entry.path },
  ];

  return (
    <>
      <section className="details-section" aria-labelledby="file-section-title">
        <h3 className="section-title" id="file-section-title">
          File
        </h3>
        <DetailsList items={items} />
      </section>
      {type.category === 'image' && <ImageDetails file={file} name={entry.name} />}
    </>
  );
}
