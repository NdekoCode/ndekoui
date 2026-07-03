type JsonLdProps = {
  data: Record<string, unknown>;
};

/** Structured data for search engines and assistants. `<` is escaped so the JSON cannot end the script early. */
export function JsonLd({ data }: JsonLdProps) {
  const json = JSON.stringify(data);
  const safeJson = json.replace(/</g, '\\u003c');

  return (
    <script
      type='application/ld+json'
      dangerouslySetInnerHTML={{ __html: safeJson }}
    />
  );
}
