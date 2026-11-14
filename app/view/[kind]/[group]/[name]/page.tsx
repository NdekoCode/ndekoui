import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { BundlePreview } from '@/app/blocks/_shared/bundle-preview';
import { previewMetadataOf } from '@/app/_site/seo';
import {
  bundleEntryOf,
  isBundleKind,
  viewParamsOf,
  viewPathOf,
} from '@/app/blocks/_shared/bundles';

type ViewPageProps = {
  params: Promise<{ kind: string; group: string; name: string }>;
};

export function generateStaticParams() {
  return viewParamsOf();
}

export async function generateMetadata({
  params,
}: ViewPageProps): Promise<Metadata> {
  const { kind, group, name } = await params;
  if (!isBundleKind(kind)) {
    return {};
  }
  const found = bundleEntryOf(kind, group, name);
  if (!found) {
    return {};
  }
  return previewMetadataOf({
    title: `${found.entry.title} - ndekoui`,
    description: found.entry.description,
    path: viewPathOf(kind, group, name),
  });
}

export default async function ViewPage({ params }: ViewPageProps) {
  const { kind, group: groupSlug, name } = await params;
  if (!isBundleKind(kind)) {
    notFound();
  }
  const found = bundleEntryOf(kind, groupSlug, name);
  if (!found) {
    notFound();
  }
  return <BundlePreview kind={kind} group={groupSlug} name={name} />;
}
