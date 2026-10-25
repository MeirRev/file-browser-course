export interface DetailItem {
  label: string;
  value: string;
  /** For language-specific values such as dates, so they render in their own direction. */
  lang?: string;
  dir?: 'ltr' | 'rtl';
}

export function DetailsList({ items }: { items: readonly DetailItem[] }) {
  return (
    <dl className="details-list">
      {items.map(({ label, value, lang, dir }) => (
        <div className="details-row" key={label}>
          <dt>{label}</dt>
          <dd lang={lang} dir={dir}>
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
