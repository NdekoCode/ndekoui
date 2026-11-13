import {
  SHARE_CARD_SIZE,
  SHARE_CARD_TYPE,
  shareCardOf,
} from '@/app/_site/share-card';
import { countLabel } from '@/lib/site';

import { catalog } from '../_generated/catalog';

type CategoryShareImageProps = {
  params: Promise<{ category: string }>;
};

export const alt =
  'A family of ndekoui components: its name, its count and its first variants.';

export const size = SHARE_CARD_SIZE;

export const contentType = SHARE_CARD_TYPE;

export const dynamicParams = false;

export function generateStaticParams() {
  return catalog.map((category) => ({ category: category.slug }));
}

export default async function CategoryShareImage({
  params,
}: CategoryShareImageProps) {
  const { category: slug } = await params;
  const category = catalog.find((item) => item.slug === slug);
  if (!category) {
    return shareCardOf({
      title: 'Components',
      description: 'React components that animate every change of state.',
    });
  }
  const titles = category.entries.map((entry) => entry.title);
  return shareCardOf({
    eyebrow: countLabel(
      category.entries.length,
      'component variant',
      'component variants'
    ),
    title: `${category.name} components`,
    description: titles.join(', '),
  });
}
