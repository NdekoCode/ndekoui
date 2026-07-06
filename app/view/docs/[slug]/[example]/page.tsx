import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { docsExampleOf } from '@/app/docs/docs-catalog';
import { DocsExamplePreview } from '@/app/docs/docs-example-preview';
import { docsAnchorPathOf } from '@/app/docs/docs-paths';
import { ItemPresentation } from '@/app/view/_present/item-presentation';
import { motionItemNameOf } from '@/lib/site';

type DocsViewPageProps = {
  params: Promise<{ slug: string; example: string }>;
};

export function generateStaticParams() {
  return [];
}

export async function generateMetadata({
  params,
}: DocsViewPageProps): Promise<Metadata> {
  const { slug, example } = await params;
  const entry = docsExampleOf(slug, example);
  if (!entry) {
    return {};
  }
  return { title: `${entry.title} - ${entry.pageTitle} - ndekoui` };
}

export default async function DocsViewPage({ params }: DocsViewPageProps) {
  const { slug, example } = await params;
  const entry = docsExampleOf(slug, example);
  if (!entry) {
    notFound();
  }
  const itemName = motionItemNameOf(entry.slug);
  const backHref = docsAnchorPathOf(entry.slug, entry.anchor);

  return (
    <ItemPresentation
      title={entry.title}
      itemName={itemName}
      backLabel={entry.pageTitle}
      backHref={backHref}
      width='full'
      isReplayable={entry.isReplayable}
    >
      <DocsExamplePreview slug={entry.slug} example={entry.example} />
    </ItemPresentation>
  );
}
