export interface ImageDimensions {
  readonly width: number;
  readonly height: number;
}

/**
 * Reads an image's pixel dimensions locally. Returns null when the browser
 * cannot decode the format (e.g. HEIC or TIFF in most browsers).
 */
export async function readImageDimensions(image: Blob): Promise<ImageDimensions | null> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(image);
      const dimensions = { width: bitmap.width, height: bitmap.height };
      bitmap.close();
      return dimensions;
    } catch {
      // Some formats (notably SVG) can't become a bitmap; try an <img> instead.
    }
  }
  return readDimensionsWithImageElement(image);
}

function readDimensionsWithImageElement(image: Blob): Promise<ImageDimensions | null> {
  if (typeof Image === 'undefined') return Promise.resolve(null);
  return new Promise((resolve) => {
    const url = URL.createObjectURL(image);
    const element = new Image();
    element.onload = () => {
      URL.revokeObjectURL(url);
      const { naturalWidth: width, naturalHeight: height } = element;
      resolve(width > 0 && height > 0 ? { width, height } : null);
    };
    element.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    element.src = url;
  });
}

export function formatDimensions({ width, height }: ImageDimensions): string {
  return `${width} × ${height} px`;
}
