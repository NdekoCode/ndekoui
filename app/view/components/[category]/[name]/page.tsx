import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { catalogAnchorPathOf } from '@/app/components/_catalog/component-paths';
import { previewWidthOf } from '@/app/components/_catalog/preview-widths';
import { catalog } from '@/app/components/_generated/catalog';
import { ComponentPresentation } from '@/app/view/_present/component-presentation';

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
  return {
    title: `${found.entry.title} - ndekoui`,
    description: found.entry.description,
  };
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
    <ComponentPresentation
      title={entry.title}
      itemName={entry.name}
      categorySlug={category.slug}
      categoryName={category.name}
      backHref={backHref}
      width={width}
    />
  );
}
