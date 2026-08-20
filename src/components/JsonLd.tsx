import { serializeJsonLd } from "@/lib/jsonld";

/**
 * schema.org structured data for a page.
 *
 * Always use this instead of a raw `<script dangerouslySetInnerHTML>`: it
 * escapes `<` so user-supplied text (school names, descriptions) can't break
 * out of the tag.
 */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
