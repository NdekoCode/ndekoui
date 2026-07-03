import { notFound } from 'next/navigation';

import { BundlePreview } from '@/app/blocks/_shared/bundle-preview';
import {
  bundleEntryOf,
  isBundleKind,
  viewParamsOf,
} from '@/app/blocks/_shared/bundles';

type ViewPageProps = {
  params: Promise<{ kind: string; group: string; name: string }>;
};

export function generateStaticParams() {
  return viewParamsOf();
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
