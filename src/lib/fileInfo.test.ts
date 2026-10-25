import { describe, expect, it } from 'vitest';
import { formatBytes, formatDateTime, formatDaysAgo, formatExactBytes, getExtension, getFileType } from './fileInfo';

describe('formatBytes', () => {
  it.each([
    [0, '0 B'],
    [1023, '1023 B'],
    [1024, '1.0 KB'],
    [1536, '1.5 KB'],
    [5 * 1024 ** 2, '5.0 MB'],
    [1.25 * 1024 ** 3, '1.3 GB'],
    [3 * 1024 ** 5, '3072.0 TB'],
  ])('formats %d bytes as %s', (bytes, expected) => {
    expect(formatBytes(bytes)).toBe(expected);
  });

  it('rejects invalid sizes', () => {
    expect(formatBytes(-1)).toBe('Unknown');
    expect(formatBytes(Number.NaN)).toBe('Unknown');
  });
});

describe('formatExactBytes', () => {
  it('uses the singular for one byte', () => {
    expect(formatExactBytes(1, 'en-US')).toBe('1 byte');
    expect(formatExactBytes(1536, 'en-US')).toBe('1,536 bytes');
  });
});

describe('getExtension', () => {
  it.each([
    ['photo.JPG', 'jpg'],
    ['archive.tar.gz', 'gz'],
    ['.gitignore', ''],
    ['README', ''],
    ['trailing.', ''],
  ])('%s -> "%s"', (name, expected) => {
    expect(getExtension(name)).toBe(expected);
  });
});

describe('getFileType', () => {
  it('recognises known extensions without a MIME type', () => {
    expect(getFileType('IMG_0001.jpeg')).toEqual({ label: 'JPEG image', mime: 'image/jpeg', category: 'image' });
  });

  it('prefers the MIME type the browser reports', () => {
    expect(getFileType('scan.png', 'image/x-custom-png').mime).toBe('image/x-custom-png');
  });

  it('falls back to the MIME type for unknown extensions', () => {
    expect(getFileType('frame.jxl', 'image/jxl')).toEqual({ label: 'JXL file', mime: 'image/jxl', category: 'image' });
  });

  it('describes files with no extension or MIME type', () => {
    expect(getFileType('Makefile')).toEqual({ label: 'File', mime: '', category: 'other' });
  });
});

describe('formatDateTime', () => {
  const timestamp = Date.UTC(2026, 9, 25, 14, 30, 5);
  // ICU separates some parts with narrow no-break spaces; normalise whitespace for comparison.
  const format = (locale: string) => {
    const result = formatDateTime(timestamp, locale, 'UTC');
    return { ...result, text: result.text.replace(/\s/g, ' ') };
  };

  it('shows Hebrew as day.month.year then 24-hour time, right to left', () => {
    expect(format('he-IL')).toEqual({ text: '25.10.2026, 14:30:05', lang: 'he-IL', dir: 'rtl' });
    expect(format('he').dir).toBe('rtl');
  });

  it('uses the usual English order for each English locale', () => {
    expect(format('en-US')).toEqual({ text: 'Oct 25, 2026, 2:30:05 PM', lang: 'en-US', dir: 'ltr' });
    expect(format('en-GB')).toEqual({ text: '25 Oct 2026, 14:30:05', lang: 'en-GB', dir: 'ltr' });
  });
});

describe('formatDaysAgo', () => {
  const now = new Date(2026, 9, 25, 9, 0).getTime();

  it.each([
    [new Date(2026, 9, 22, 18, 0).getTime(), 'לפני 3 ימים'],
    [new Date(2026, 9, 24, 23, 59).getTime(), 'לפני 1 ימים'],
    [new Date(2026, 9, 25, 0, 1).getTime(), 'לפני 0 ימים'],
    [new Date(2025, 9, 25, 9, 0).getTime(), 'לפני 365 ימים'],
  ])('shows %d as %s', (timestamp, expected) => {
    expect(formatDaysAgo(timestamp, now)).toEqual({ text: expected, lang: 'he', dir: 'rtl' });
  });

  it('treats future timestamps as today', () => {
    expect(formatDaysAgo(now + 5 * 24 * 60 * 60 * 1000, now).text).toBe('לפני 0 ימים');
  });
});
