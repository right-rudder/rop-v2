import type { Faq } from "@/lib/structured-data";

/**
 * Visible question/answer list. Plain headings and paragraphs — no
 * disclosure widgets — so the text that backs the page's FAQPage structured
 * data is always on the page for readers and crawlers alike.
 */
export function FaqList({ items }: { items: Faq[] }) {
  return (
    <dl className="divide-y divide-line rounded-2xl border border-line bg-surface">
      {items.map((item) => (
        <div key={item.q} className="px-5 py-5 md:px-6">
          <dt className="font-display text-lg font-bold leading-snug tracking-tight text-ink">
            {item.q}
          </dt>
          <dd className="mt-2 max-w-prose leading-relaxed text-muted">{item.a}</dd>
        </div>
      ))}
    </dl>
  );
}
