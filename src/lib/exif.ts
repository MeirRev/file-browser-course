import exifr from 'exifr';
import { formatDateTime, getDefaultLocale, type LocalizedText } from './fileInfo';

export interface ExifField {
  readonly label: string;
  readonly value: string;
  /** Set when the value is language-specific text, such as a date. */
  readonly lang?: string;
  readonly dir?: LocalizedText['dir'];
}

type RawExif = Record<string, unknown>;
type Formatter = (value: unknown, locale: string) => string | LocalizedText | null;

const PARSE_OPTIONS = {
  tiff: true,
  exif: true,
  gps: true,
  ifd1: false,
  xmp: false,
  icc: false,
  iptc: false,
  jfif: false,
  ihdr: false,
  translateValues: true,
  reviveValues: true,
};

/**
 * Reads the EXIF fields worth showing from an image, entirely in memory.
 * Returns an empty list when the file has no EXIF data or exifr can't parse it.
 */
export async function readExif(image: Blob, locale = getDefaultLocale()): Promise<ExifField[]> {
  try {
    const raw: unknown = await exifr.parse(image, PARSE_OPTIONS);
    return isRecord(raw) ? formatExif(raw, locale) : [];
  } catch {
    return [];
  }
}

const FIELDS: ReadonlyArray<readonly [key: string, label: string, format: Formatter]> = [
  ['Make', 'Camera make', formatPlain],
  ['Model', 'Camera model', formatPlain],
  ['LensModel', 'Lens', formatPlain],
  ['DateTimeOriginal', 'Date taken', formatPlain],
  ['ExposureTime', 'Exposure time', formatExposure],
  ['FNumber', 'Aperture', (value) => withNumber(value, (n) => `f/${round(n, 1)}`)],
  ['ISO', 'ISO', formatPlain],
  ['FocalLength', 'Focal length', (value) => withNumber(value, (n) => `${round(n, 1)} mm`)],
  ['Flash', 'Flash', formatPlain],
  ['WhiteBalance', 'White balance', formatPlain],
  ['Orientation', 'Orientation', formatPlain],
  ['ExifImageWidth', 'EXIF width', (value) => withNumber(value, (n) => `${n} px`)],
  ['ExifImageHeight', 'EXIF height', (value) => withNumber(value, (n) => `${n} px`)],
  ['Software', 'Software', formatPlain],
  ['Artist', 'Artist', formatPlain],
  ['Copyright', 'Copyright', formatPlain],
];

/** Turns exifr's output into labelled, display-ready rows, skipping missing values. */
export function formatExif(raw: RawExif, locale = getDefaultLocale()): ExifField[] {
  const fields: ExifField[] = [];
  for (const [key, label, format] of FIELDS) {
    const value = format(raw[key], locale);
    if (typeof value === 'string') fields.push({ label, value });
    else if (value) fields.push({ label, value: value.text, lang: value.lang, dir: value.dir });
  }
  const { latitude, longitude } = raw;
  if (typeof latitude === 'number' && typeof longitude === 'number') {
    fields.push({ label: 'GPS location', value: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}` });
  }
  return fields;
}

function formatPlain(value: unknown, locale: string): string | LocalizedText | null {
  // exifr revives EXIF dates (which carry no time zone) as local times, so formatting
  // in the local time zone shows the time exactly as the camera recorded it.
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : formatDateTime(value.getTime(), locale);
  if (typeof value === 'number') return Number.isFinite(value) ? String(round(value, 4)) : null;
  if (typeof value === 'string') return value.trim() || null;
  return null;
}

function formatExposure(value: unknown): string | null {
  return withNumber(value, (seconds) =>
    seconds >= 1 || seconds <= 0 ? `${round(seconds, 1)} s` : `1/${Math.round(1 / seconds)} s`,
  );
}

function withNumber(value: unknown, format: (n: number) => string): string | null {
  return typeof value === 'number' && Number.isFinite(value) ? format(value) : null;
}

function round(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function isRecord(value: unknown): value is RawExif {
  return typeof value === 'object' && value !== null;
}
