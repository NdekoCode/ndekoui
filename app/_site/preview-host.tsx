import type { ComponentType } from 'react';

type PreviewModule = { previews: Record<string, ComponentType> };

export type PreviewHostProps = { name: string };

/** One component for a whole preview module, that renders the entry named in its props. */
export function previewHostOf({ previews }: PreviewModule) {
  function PreviewHost({ name }: PreviewHostProps) {
    const Preview = previews[name];
    if (!Preview) {
      return null;
    }
    return <Preview />;
  }

  return PreviewHost;
}
