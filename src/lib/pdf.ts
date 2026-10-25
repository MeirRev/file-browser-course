import { getExtension } from './fileInfo';

/** True for files the browser reports as PDF or that carry a .pdf extension. */
export function isPdf(fileName: string, reportedMime = ''): boolean {
  return reportedMime === 'application/pdf' || getExtension(fileName) === 'pdf';
}

/**
 * Reads the number of pages of a PDF, entirely in memory.
 * Follows the trailer's /Root to the catalog's page tree and returns its /Count, looking inside
 * compressed object streams when needed. Returns null when the page count can't be determined,
 * e.g. for damaged, truncated or encrypted files.
 */
export async function readPdfPageCount(pdf: Blob): Promise<number | null> {
  try {
    const bytes = new Uint8Array(await pdf.arrayBuffer());
    return await new PdfReader(bytes).pageCount();
  } catch {
    return null;
  }
}

interface ObjectLocation {
  /** Offset of the first byte after "N G obj". */
  readonly start: number;
}

type Reference = readonly [number: number, generation: number];

const OBJECT_HEADER = /(\d+)\s+(\d+)\s+obj\b/g;

class PdfReader {
  /** One character per byte, so string offsets are byte offsets. */
  private readonly text: string;
  private readonly objects = new Map<number, ObjectLocation>();
  private compressed: Map<number, string> | null = null;

  constructor(private readonly bytes: Uint8Array) {
    this.text = latin1(bytes);
    // Scanning instead of trusting the xref table copes with wrong offsets; later definitions
    // (incremental updates) replace earlier ones.
    for (const match of this.text.matchAll(OBJECT_HEADER)) {
      this.objects.set(Number(match[1]), { start: match.index + match[0].length });
    }
  }

  async pageCount(): Promise<number | null> {
    const header = this.text.indexOf('%PDF-');
    if (header === -1 || header > 1024) return null;
    // The last /Root belongs to the newest trailer or cross-reference stream.
    const roots = [...this.text.matchAll(/\/Root\s+(\d+)\s+(\d+)\s+R\b/g)];
    const root = roots.at(-1);
    if (!root) return null;

    const catalog = await this.resolve([Number(root[1]), Number(root[2])]);
    const pagesRef = catalog && topLevelReference(catalog, 'Pages');
    const pages = pagesRef && (await this.resolve(pagesRef));
    if (!pages) return null;

    let count: string | null = topLevelValue(pages, 'Count');
    const countRef = count && parseReference(count);
    if (countRef) count = await this.resolve(countRef);
    const n = count === null ? Number.NaN : Number(count.trim());
    return Number.isInteger(n) && n >= 0 ? n : null;
  }

  /** The object's body: a dictionary's text, or a plain value such as a number. */
  private async resolve([number]: Reference): Promise<string | null> {
    const location = this.objects.get(number);
    if (location) return this.bodyAt(location.start);
    return (await this.compressedObjects()).get(number) ?? null;
  }

  private bodyAt(start: number): string {
    const end = this.text.indexOf('endobj', start);
    const body = this.text.slice(start, end === -1 ? undefined : end);
    const stream = body.search(/\bstream\b/);
    return stream === -1 ? body : body.slice(0, stream);
  }

  /** Objects stored inside /Type /ObjStm streams, decompressed on first use. */
  private async compressedObjects(): Promise<Map<number, string>> {
    if (this.compressed) return this.compressed;
    const found = new Map<number, string>();
    for (const { start } of this.objects.values()) {
      const dict = this.bodyAt(start);
      if (!/\/Type\s*\/ObjStm\b/.test(dict)) continue;
      const content = await this.streamContent(start, dict);
      const count = Number(topLevelValue(dict, 'N'));
      const first = Number(topLevelValue(dict, 'First'));
      if (content === null || !Number.isInteger(count) || !Number.isInteger(first)) continue;

      const header = content.slice(0, first).trim().split(/\s+/).map(Number);
      for (let i = 0; i < count; i += 1) {
        const number = header[2 * i];
        const offset = header[2 * i + 1];
        const next = i + 1 < count ? header[2 * i + 3] : undefined;
        if (number === undefined || offset === undefined) break;
        const body = content.slice(first + offset, next === undefined ? undefined : first + next);
        if (!found.has(number)) found.set(number, body);
      }
    }
    this.compressed = found;
    return found;
  }

  private async streamContent(objectStart: number, dict: string): Promise<string | null> {
    const keyword = this.text.indexOf('stream', objectStart + dict.length);
    if (keyword === -1) return null;
    let dataStart = keyword + 'stream'.length;
    if (this.text[dataStart] === '\r') dataStart += 1;
    if (this.text[dataStart] === '\n') dataStart += 1;

    const length = Number(topLevelValue(dict, 'Length'));
    let dataEnd = Number.isInteger(length) ? dataStart + length : -1;
    if (dataEnd < dataStart || this.text.slice(dataEnd).trimStart().slice(0, 9) !== 'endstream') {
      // /Length is missing, indirect or wrong: fall back to the endstream keyword.
      dataEnd = this.text.indexOf('endstream', dataStart);
      if (dataEnd === -1) return null;
      while (dataEnd > dataStart && (this.text[dataEnd - 1] === '\n' || this.text[dataEnd - 1] === '\r')) dataEnd -= 1;
    }

    const data = this.bytes.subarray(dataStart, dataEnd);
    const filter = topLevelValue(dict, 'Filter')?.replace(/[[\]\s]/g, '');
    if (!filter) return latin1(data);
    return filter === '/FlateDecode' ? latin1(await inflate(data)) : null;
  }
}

async function inflate(data: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

function latin1(bytes: Uint8Array): string {
  let text = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    text += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return text;
}

/** A number, reference, name or array, after optional whitespace. */
const VALUE = /\s*(\d+\s+\d+\s+R\b|[-+]?\d+(?:\.\d+)?|\/[^\s/<>[\]()]+|\[[^\]]*\])/.source;

/**
 * The raw value of a key in the outermost dictionary of `body` — a number, reference, name or
 * array — ignoring keys inside nested dictionaries and strings.
 */
function topLevelValue(body: string, key: string): string | null {
  let depth = 0;
  let inString = 0;
  let flat = '';
  for (let i = body.indexOf('<<'); i !== -1 && i < body.length; i += 1) {
    const char = body[i];
    if (inString) {
      if (char === '\\') i += 1;
      else if (char === '(') inString += 1;
      else if (char === ')') inString -= 1;
    } else if (char === '(') {
      inString = 1;
    } else if (body.startsWith('<<', i) || body.startsWith('>>', i)) {
      depth += char === '<' ? 1 : -1;
      i += 1;
      if (depth === 0) break;
      flat += ' ';
    } else if (depth === 1) {
      flat += char;
    }
  }
  const value = new RegExp(`/${key}(?![A-Za-z0-9])${VALUE}`).exec(flat);
  return value?.[1] ?? null;
}

function topLevelReference(body: string, key: string): Reference | null {
  const value = topLevelValue(body, key);
  return value === null ? null : parseReference(value);
}

function parseReference(value: string): Reference | null {
  const match = /^\s*(\d+)\s+(\d+)\s+R\b/.exec(value);
  return match ? [Number(match[1]), Number(match[2])] : null;
}
