'use client';

import type { ComponentType } from 'react';

import type { PreviewHostProps } from '@/app/_site/preview-host';
import { previewHosts as blockHosts } from '@/app/blocks/_generated/preview-hosts';
import { previewHosts as templateHosts } from '@/app/templates/_generated/preview-hosts';

import type { BundleKind } from './types';

const HOSTS: Record<
  BundleKind,
  Record<string, ComponentType<PreviewHostProps>>
> = {
  blocks: blockHosts,
  templates: templateHosts,
};

type BundlePreviewProps = {
  kind: BundleKind;
  group: string;
  name: string;
};

/** A block or template, loaded with the rest of its group and nothing else. */
export function BundlePreview({ kind, group, name }: BundlePreviewProps) {
  const PreviewHost = HOSTS[kind][group];
  if (!PreviewHost) {
    return null;
  }
  return <PreviewHost name={name} />;
}
