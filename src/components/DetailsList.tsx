import type { LocalizedText } from '../lib/fileInfo';

export interface DetailItem {
  label: string;
  value: string;
  /** For language-specific values such as dates, so they render in their own direction. */
  lang?: string;
  dir?: 'ltr' | 'rtl';
  /** Extra text shown after the value in its own language and direction, e.g. a relative time. */
  note?: LocalizedText;
}

export function DetailsList({ items }: { items: readonly DetailItem[] }) {
  return (
    <dl className="details-list">
      {items.map(({ label, value, lang, dir, note }) => (
        <div className="details-row" key={label}>
          <dt>{label}</dt>
          <dd lang={lang} dir={dir}>
            {value}
            {note && (
              <span className="details-note" lang={note.lang} dir={note.dir}>
                {note.text}
              </span>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}
