import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { previewMetadataOf } from '@/app/_site/seo';
import { docsExampleOf } from '@/app/docs/docs-catalog';
import { DocsExamplePreview } from '@/app/docs/docs-example-preview';
import { docsAnchorPathOf } from '@/app/docs/docs-paths';
import { ItemPresentation } from '@/app/view/_present/item-presentation';
import { registrySummaryOf } from '@/lib/registry-summary';
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
  const itemName = motionItemNameOf(entry.slug);
  const summary = registrySummaryOf(itemName);
  const fallback = `${entry.title}, an example of ${entry.pageTitle} from ndekoui.`;
  const description = summary?.description ?? fallback;
  return previewMetadataOf({
    title: `${entry.title} - ${entry.pageTitle} - ndekoui`,
    description,
    path: `/view/docs/${slug}/${example}`,
  });
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
