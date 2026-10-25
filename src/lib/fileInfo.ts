export type FileCategory = 'image' | 'video' | 'audio' | 'text' | 'code' | 'document' | 'archive' | 'other';

export interface FileTypeInfo {
  /** Human-readable type, e.g. "JPEG image". */
  readonly label: string;
  /** MIME type, or an empty string when unknown. */
  readonly mime: string;
  readonly category: FileCategory;
}

interface KnownType {
  readonly label: string;
  readonly mime: string;
  readonly category: FileCategory;
}

const KNOWN_TYPES: Record<string, KnownType> = {
  jpg: { label: 'JPEG image', mime: 'image/jpeg', category: 'image' },
  jpeg: { label: 'JPEG image', mime: 'image/jpeg', category: 'image' },
  png: { label: 'PNG image', mime: 'image/png', category: 'image' },
  gif: { label: 'GIF image', mime: 'image/gif', category: 'image' },
  webp: { label: 'WebP image', mime: 'image/webp', category: 'image' },
  avif: { label: 'AVIF image', mime: 'image/avif', category: 'image' },
  bmp: { label: 'Bitmap image', mime: 'image/bmp', category: 'image' },
  svg: { label: 'SVG image', mime: 'image/svg+xml', category: 'image' },
  ico: { label: 'Icon', mime: 'image/x-icon', category: 'image' },
  tif: { label: 'TIFF image', mime: 'image/tiff', category: 'image' },
  tiff: { label: 'TIFF image', mime: 'image/tiff', category: 'image' },
  heic: { label: 'HEIC image', mime: 'image/heic', category: 'image' },
  heif: { label: 'HEIF image', mime: 'image/heif', category: 'image' },
  mp4: { label: 'MP4 video', mime: 'video/mp4', category: 'video' },
  mov: { label: 'QuickTime video', mime: 'video/quicktime', category: 'video' },
  webm: { label: 'WebM video', mime: 'video/webm', category: 'video' },
  mkv: { label: 'Matroska video', mime: 'video/x-matroska', category: 'video' },
  mp3: { label: 'MP3 audio', mime: 'audio/mpeg', category: 'audio' },
  wav: { label: 'WAV audio', mime: 'audio/wav', category: 'audio' },
  flac: { label: 'FLAC audio', mime: 'audio/flac', category: 'audio' },
  ogg: { label: 'Ogg audio', mime: 'audio/ogg', category: 'audio' },
  txt: { label: 'Plain text', mime: 'text/plain', category: 'text' },
  md: { label: 'Markdown', mime: 'text/markdown', category: 'text' },
  csv: { label: 'CSV', mime: 'text/csv', category: 'text' },
  log: { label: 'Log file', mime: 'text/plain', category: 'text' },
  json: { label: 'JSON', mime: 'application/json', category: 'code' },
  xml: { label: 'XML', mime: 'application/xml', category: 'code' },
  yaml: { label: 'YAML', mime: 'application/yaml', category: 'code' },
  yml: { label: 'YAML', mime: 'application/yaml', category: 'code' },
  toml: { label: 'TOML', mime: 'application/toml', category: 'code' },
  html: { label: 'HTML document', mime: 'text/html', category: 'code' },
  css: { label: 'CSS stylesheet', mime: 'text/css', category: 'code' },
  js: { label: 'JavaScript', mime: 'text/javascript', category: 'code' },
  mjs: { label: 'JavaScript module', mime: 'text/javascript', category: 'code' },
  ts: { label: 'TypeScript', mime: 'text/x-typescript', category: 'code' },
  tsx: { label: 'TypeScript JSX', mime: 'text/x-typescript', category: 'code' },
  jsx: { label: 'JavaScript JSX', mime: 'text/javascript', category: 'code' },
  py: { label: 'Python', mime: 'text/x-python', category: 'code' },
  java: { label: 'Java', mime: 'text/x-java', category: 'code' },
  c: { label: 'C source', mime: 'text/x-c', category: 'code' },
  cpp: { label: 'C++ source', mime: 'text/x-c++', category: 'code' },
  cs: { label: 'C# source', mime: 'text/x-csharp', category: 'code' },
  sh: { label: 'Shell script', mime: 'application/x-sh', category: 'code' },
  pdf: { label: 'PDF document', mime: 'application/pdf', category: 'document' },
  doc: { label: 'Word document', mime: 'application/msword', category: 'document' },
  docx: {
    label: 'Word document',
    mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    category: 'document',
  },
  xls: { label: 'Excel spreadsheet', mime: 'application/vnd.ms-excel', category: 'document' },
  xlsx: {
    label: 'Excel spreadsheet',
    mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    category: 'document',
  },
  ppt: { label: 'PowerPoint presentation', mime: 'application/vnd.ms-powerpoint', category: 'document' },
  pptx: {
    label: 'PowerPoint presentation',
    mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    category: 'document',
  },
  zip: { label: 'ZIP archive', mime: 'application/zip', category: 'archive' },
  rar: { label: 'RAR archive', mime: 'application/vnd.rar', category: 'archive' },
  '7z': { label: '7-Zip archive', mime: 'application/x-7z-compressed', category: 'archive' },
  tar: { label: 'TAR archive', mime: 'application/x-tar', category: 'archive' },
  gz: { label: 'Gzip archive', mime: 'application/gzip', category: 'archive' },
};

/** Lower-case extension without the dot; "" for none. Dotfiles like ".gitignore" have no extension. */
export function getExtension(fileName: string): string {
  const dot = fileName.lastIndexOf('.');
  return dot > 0 && dot < fileName.length - 1 ? fileName.slice(dot + 1).toLowerCase() : '';
}

/**
 * Describes a file's type from its name and (optional) browser-reported MIME type.
 * The browser's MIME type wins when present, since it may know types the table does not.
 */
export function getFileType(fileName: string, reportedMime = ''): FileTypeInfo {
  const extension = getExtension(fileName);
  const known = KNOWN_TYPES[extension];
  const mime = reportedMime || known?.mime || '';
  const category = known?.category ?? categoryFromMime(mime);
  const label = known?.label ?? (extension ? `${extension.toUpperCase()} file` : 'File');
  return { label, mime, category };
}

function categoryFromMime(mime: string): FileCategory {
  const [group] = mime.split('/');
  switch (group) {
    case 'image':
    case 'video':
    case 'audio':
    case 'text':
      return group;
    default:
      return 'other';
  }
}

const SIZE_UNITS = ['KB', 'MB', 'GB', 'TB'] as const;

/** "512 B", "1.5 KB", "3.2 MB" — binary (1024-based) units. */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return 'Unknown';
  if (bytes < 1024) return `${bytes} B`;
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < SIZE_UNITS.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(1)} ${SIZE_UNITS[unit]}`;
}

/** "1,536 bytes" — the exact size, for display next to {@link formatBytes}. */
export function formatExactBytes(bytes: number, locale?: string): string {
  return `${bytes.toLocaleString(locale)} ${bytes === 1 ? 'byte' : 'bytes'}`;
}

/** Text plus the language and direction it must be rendered with. */
export interface LocalizedText {
  readonly text: string;
  readonly lang: string;
  readonly dir: 'ltr' | 'rtl';
}

const RTL_LANGUAGES = new Set(['he', 'iw', 'ar', 'fa', 'ur']);

/** The user's language as reported by the browser. */
export function getDefaultLocale(): string {
  return globalThis.navigator?.language || 'en-US';
}

function languageOf(locale: string): string {
  return (locale.split('-')[0] ?? '').toLowerCase();
}

/**
 * Hebrew: day.month.year then 24-hour time, read right to left ("25.10.2026, 14:30:05").
 * Other languages: their usual date and time, e.g. "Oct 25, 2026, 2:30:05 PM" (en-US)
 * or "25 Oct 2026, 14:30:05" (en-GB).
 */
export function formatDateTime(timestamp: number, locale = getDefaultLocale(), timeZone?: string): LocalizedText {
  const language = languageOf(locale);
  const options: Intl.DateTimeFormatOptions =
    language === 'he' || language === 'iw'
      ? {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hourCycle: 'h23',
          timeZone,
        }
      : { dateStyle: 'medium', timeStyle: 'medium', timeZone };
  return {
    text: new Intl.DateTimeFormat(locale, options).format(timestamp),
    lang: locale,
    dir: RTL_LANGUAGES.has(language) ? 'rtl' : 'ltr',
  };
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * How many calendar days ago the timestamp was, in Hebrew and always as "לפני N ימים".
 * Days are counted in the viewer's time zone; future timestamps count as 0 days.
 */
export function formatDaysAgo(timestamp: number, now = Date.now()): LocalizedText {
  const startOfDay = (time: number) => {
    const date = new Date(time);
    return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  };
  const days = Math.max(0, Math.round((startOfDay(now) - startOfDay(timestamp)) / MS_PER_DAY));
  return { text: `לפני ${days} ימים`, lang: 'he', dir: 'rtl' };
}
