import { describe, expect, it } from 'vitest';
import { isPdf, readPdfPageCount } from './pdf';

/** A minimal, valid PDF with `pages` pages and a classic cross-reference table. */
function classicPdf(pages: number): string {
  const kids = Array.from({ length: pages }, (_, i) => `${i + 3} 0 R`).join(' ');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    `<< /Type /Pages /Kids [${kids}] /Count ${pages} >>`,
    ...Array.from({ length: pages }, () => '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>'),
  ];
  let body = '%PDF-1.4\n';
  const offsets: number[] = [];
  objects.forEach((object, i) => {
    offsets.push(body.length);
    body += `${i + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = body.length;
  body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  body += offsets.map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`).join('');
  body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return body;
}

async function deflate(text: string): Promise<Uint8Array> {
  const stream = new Blob([text]).stream().pipeThrough(new CompressionStream('deflate'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/** A PDF 1.5-style file whose catalog and page tree sit in a compressed object stream. */
async function objectStreamPdf(pages: number): Promise<Blob> {
  const kids = Array.from({ length: pages }, (_, i) => `${i + 10} 0 R`).join(' ');
  const catalog = '<< /Type /Catalog /Pages 2 0 R /Names << /Count 999 >> >>';
  const tree = `<< /Type /Pages /Kids [${kids}] /Count ${pages} >>`;
  const header = `1 0 2 ${catalog.length + 1} `;
  const data = await deflate(`${header}${catalog}\n${tree}`);
  return new Blob([
    '%PDF-1.5\n',
    `5 0 obj\n<< /Type /ObjStm /N 2 /First ${header.length} /Filter /FlateDecode /Length ${data.length} >>\nstream\n`,
    data,
    '\nendstream\nendobj\n',
    '6 0 obj\n<< /Type /XRef /Root 1 0 R /Size 7 >>\nstream\n\nendstream\nendobj\n',
    'startxref\n0\n%%EOF\n',
  ]);
}

describe('isPdf', () => {
  it('recognizes PDFs by MIME type or extension', () => {
    expect(isPdf('report.pdf')).toBe(true);
    expect(isPdf('REPORT.PDF')).toBe(true);
    expect(isPdf('download', 'application/pdf')).toBe(true);
    expect(isPdf('notes.txt', 'text/plain')).toBe(false);
    expect(isPdf('photo.jpg', 'image/jpeg')).toBe(false);
  });
});

describe('readPdfPageCount', () => {
  it('counts a single page', async () => {
    await expect(readPdfPageCount(new Blob([classicPdf(1)]))).resolves.toBe(1);
  });

  it('counts twelve pages', async () => {
    await expect(readPdfPageCount(new Blob([classicPdf(12)]))).resolves.toBe(12);
  });

  it('reads the page tree from a compressed object stream', async () => {
    await expect(readPdfPageCount(await objectStreamPdf(7))).resolves.toBe(7);
  });

  it('uses the newest revision after an incremental update', async () => {
    const original = classicPdf(3);
    const update =
      '2 0 obj\n<< /Type /Pages /Kids [3 0 R 4 0 R] /Count 2 >>\nendobj\n' +
      'trailer\n<< /Size 6 /Root 1 0 R /Prev 0 >>\nstartxref\n0\n%%EOF\n';
    await expect(readPdfPageCount(new Blob([original, update]))).resolves.toBe(2);
  });

  it('resolves a page count stored as an indirect object', async () => {
    const pdf = classicPdf(1)
      .replace('/Count 1', '/Count 9 0 R')
      .replace('trailer', '9 0 obj\n4\nendobj\ntrailer');
    await expect(readPdfPageCount(new Blob([pdf]))).resolves.toBe(4);
  });

  it('returns null for data that is not a PDF', async () => {
    await expect(readPdfPageCount(new Blob(['just some text']))).resolves.toBeNull();
  });

  it('returns null for a truncated PDF', async () => {
    const pdf = classicPdf(5);
    await expect(readPdfPageCount(new Blob([pdf.slice(0, pdf.indexOf('2 0 obj'))]))).resolves.toBeNull();
  });

  it('returns null when the page tree has no usable count', async () => {
    const pdf = classicPdf(2).replace('/Count 2', '/Count -1');
    await expect(readPdfPageCount(new Blob([pdf]))).resolves.toBeNull();
  });

  it('returns null when a compressed object stream is corrupt', async () => {
    const blob = await objectStreamPdf(3);
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const start = new TextDecoder('latin1').decode(bytes).indexOf('stream\n') + 'stream\n'.length;
    bytes.fill(0x41, start, start + 8);
    await expect(readPdfPageCount(new Blob([bytes]))).resolves.toBeNull();
  });
});
