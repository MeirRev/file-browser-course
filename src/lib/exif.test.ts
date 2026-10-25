import { describe, expect, it } from 'vitest';
import { formatExif, readExif } from './exif';

describe('formatExif', () => {
  it('formats camera settings for display', () => {
    const fields = formatExif(
      {
        Make: 'Canon',
        Model: ' EOS R6 ',
        DateTimeOriginal: new Date(2024, 0, 2, 3, 4, 5),
        ExposureTime: 0.004,
        FNumber: 2.8,
        ISO: 400,
        FocalLength: 35,
        Orientation: 'Horizontal (normal)',
        latitude: 31.7767,
        longitude: 35.2345,
      },
      'en-US',
    ).map((field) => ({ ...field, value: field.value.replace(/\s/g, ' ') }));

    expect(fields).toEqual([
      { label: 'Camera make', value: 'Canon' },
      { label: 'Camera model', value: 'EOS R6' },
      { label: 'Date taken', value: 'Jan 2, 2024, 3:04:05 AM', lang: 'en-US', dir: 'ltr' },
      { label: 'Exposure time', value: '1/250 s' },
      { label: 'Aperture', value: 'f/2.8' },
      { label: 'ISO', value: '400' },
      { label: 'Focal length', value: '35 mm' },
      { label: 'Orientation', value: 'Horizontal (normal)' },
      { label: 'GPS location', value: '31.77670, 35.23450' },
    ]);
  });

  it('shows the date taken in Hebrew order and direction, keeping the camera time', () => {
    expect(formatExif({ DateTimeOriginal: new Date(2024, 0, 2, 3, 4, 5) }, 'he-IL')).toEqual([
      { label: 'Date taken', value: '02.01.2024, 03:04:05', lang: 'he-IL', dir: 'rtl' },
    ]);
  });

  it('shows long exposures in seconds', () => {
    expect(formatExif({ ExposureTime: 2.5 })).toEqual([{ label: 'Exposure time', value: '2.5 s' }]);
  });

  it('skips missing, empty and unusable values', () => {
    expect(formatExif({ Make: '  ', Model: null, FNumber: 'n/a', ISO: Number.NaN, latitude: 31.7 })).toEqual([]);
  });
});

describe('readExif', () => {
  it('returns no fields for data that is not an image', async () => {
    await expect(readExif(new Blob(['not an image']))).resolves.toEqual([]);
  });
});
