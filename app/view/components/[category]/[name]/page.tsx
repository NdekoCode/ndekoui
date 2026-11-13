import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { previewMetadataOf } from '@/app/_site/seo';
import { catalogAnchorPathOf } from '@/app/components/_catalog/component-paths';
import { ComponentPreview } from '@/app/components/_catalog/component-preview';
import { previewWidthOf } from '@/app/components/_catalog/preview-widths';
import { catalog } from '@/app/components/_generated/catalog';
import { ItemPresentation } from '@/app/view/_present/item-presentation';

type ComponentViewPageProps = {
  params: Promise<{ category: string; name: string }>;
};

function entryOf(categorySlug: string, name: string) {
  const category = catalog.find((item) => item.slug === categorySlug);
  if (!category) {
    return undefined;
  }
  const entry = category.entries.find((item) => item.name === name);
  if (!entry) {
    return undefined;
  }
  return { category, entry };
}

export function generateStaticParams() {
  return [];
}

export async function generateMetadata({
  params,
}: ComponentViewPageProps): Promise<Metadata> {
  const { category, name } = await params;
  const found = entryOf(category, name);
  if (!found) {
    return {};
  }
  return previewMetadataOf({
    title: `${found.entry.title} - ndekoui`,
    description: found.entry.description,
    path: `/view/components/${category}/${name}`,
  });
}

export default async function ComponentViewPage({
  params,
}: ComponentViewPageProps) {
  const { category: categorySlug, name } = await params;
  const found = entryOf(categorySlug, name);
  if (!found) {
    notFound();
  }
  const { category, entry } = found;
  const width = previewWidthOf(entry);
  const backHref = catalogAnchorPathOf(category.slug, entry.name);

  return (
    <ItemPresentation
      title={entry.title}
      itemName={entry.name}
      backLabel={category.name}
      backHref={backHref}
      width={width}
    >
      <ComponentPreview category={category.slug} name={entry.name} />
    </ItemPresentation>
  );
}
