import { useEffect, useState } from 'react';
import { readExif, type ExifField } from '../lib/exif';
import { formatDimensions, readImageDimensions, type ImageDimensions } from '../lib/image';
import { DetailsList } from './DetailsList';

interface ImageMetadata {
  dimensions: ImageDimensions | null;
  exif: ExifField[];
}

export function ImageDetails({ file, name }: { file: File; name: string }) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewFailed, setPreviewFailed] = useState(false);
  const [metadata, setMetadata] = useState<ImageMetadata | null>(null);

  // A local blob: URL — the image never leaves the browser.
  useEffect(() => {
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setPreviewFailed(false);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    let cancelled = false;
    setMetadata(null);
    void Promise.all([readImageDimensions(file), readExif(file)]).then(([dimensions, exif]) => {
      if (!cancelled) setMetadata({ dimensions, exif });
    });
    return () => {
      cancelled = true;
    };
  }, [file]);

  return (
    <>
      <section className="details-section" aria-labelledby="image-section-title">
        <h3 className="section-title" id="image-section-title">
          Image
        </h3>
        <figure className="preview">
          {previewUrl && !previewFailed ? (
            <img src={previewUrl} alt={`Preview of ${name}`} onError={() => setPreviewFailed(true)} />
          ) : (
            <figcaption className="placeholder">
              {previewFailed ? 'This browser cannot display a preview of this format.' : 'Loading preview…'}
            </figcaption>
          )}
        </figure>
        <DetailsList
          items={[
            {
              label: 'Dimensions',
              value: metadata ? (metadata.dimensions ? formatDimensions(metadata.dimensions) : 'Unknown') : 'Reading…',
            },
          ]}
        />
      </section>

      <section className="details-section" aria-labelledby="exif-section-title">
        <h3 className="section-title" id="exif-section-title">
          EXIF
        </h3>
        {metadata === null ? (
          <p className="placeholder">Reading EXIF data…</p>
        ) : metadata.exif.length > 0 ? (
          <DetailsList items={metadata.exif} />
        ) : (
          <p className="placeholder">No EXIF data found in this image.</p>
        )}
      </section>
    </>
  );
}
