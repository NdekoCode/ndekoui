'use client';

import { previewHosts } from './_generated/preview-hosts';

type DocsExamplePreviewProps = {
  slug: string;
  example: string;
};

/** An example of a docs page, loaded with the rest of its page and nothing else. */
export function DocsExamplePreview({ slug, example }: DocsExamplePreviewProps) {
  const PreviewHost = previewHosts[slug];
  if (!PreviewHost) {
    return null;
  }
  return <PreviewHost name={example} />;
}
