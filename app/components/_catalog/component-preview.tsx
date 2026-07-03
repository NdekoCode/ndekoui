'use client';

import { previewHosts } from '../_generated/preview-hosts';

type ComponentPreviewProps = {
  category: string;
  name: string;
};

/** A catalogue component, loaded with the rest of its category and nothing else. */
export function ComponentPreview({ category, name }: ComponentPreviewProps) {
  const PreviewHost = previewHosts[category];
  if (!PreviewHost) {
    return null;
  }
  return <PreviewHost name={name} />;
}
