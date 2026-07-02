import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import {
  bundleEntryOf,
  entryAnchorPathOf,
  isBundleKind,
  viewParamsOf,
  viewPathOf,
} from '@/app/blocks/_shared/bundles';
import { presentationLayoutOf } from '@/app/blocks/_shared/presentation-layout';
import { PresentationView } from '@/app/view/_present/presentation-view';

type PresentPageProps = {
  params: Promise<{ kind: string; group: string; name: string }>;
};

export function generateStaticParams() {
  return viewParamsOf();
}

async function presentedOf(params: PresentPageProps['params']) {
  const { kind, group, name } = await params;
  if (!isBundleKind(kind)) {
    return undefined;
  }
  const found = bundleEntryOf(kind, group, name);
  if (!found) {
    return undefined;
  }
  return { kind, ...found };
}

export async function generateMetadata({
  params,
}: PresentPageProps): Promise<Metadata> {
  const presented = await presentedOf(params);
  if (!presented) {
    return {};
  }
  return {
    title: `${presented.entry.title} - ndekoui`,
    description: presented.entry.description,
  };
}

export default async function PresentPage({ params }: PresentPageProps) {
  const presented = await presentedOf(params);
  if (!presented) {
    notFound();
  }
  const { kind, group, entry } = presented;

  return (
    <PresentationView
      title={entry.title}
      itemName={entry.name}
      groupName={group.name}
      backHref={entryAnchorPathOf(kind, group.slug, entry.name)}
      frameSrc={viewPathOf(kind, group.slug, entry.name)}
      layout={presentationLayoutOf(kind, group.slug)}
    />
  );
}
