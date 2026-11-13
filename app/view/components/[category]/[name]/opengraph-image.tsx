import {
  SHARE_CARD_SIZE,
  SHARE_CARD_TYPE,
  shareCardOf,
} from '@/app/_site/share-card';
import { catalog } from '@/app/components/_generated/catalog';

type ComponentShareImageProps = {
  params: Promise<{ category: string; name: string }>;
};

export const alt =
  'An ndekoui component: its family, its name and what it does.';

export const size = SHARE_CARD_SIZE;

export const contentType = SHARE_CARD_TYPE;

function missingCard() {
  return new Response(null, { status: 404 });
}

export default async function ComponentShareImage({
  params,
}: ComponentShareImageProps) {
  const { category: slug, name } = await params;
  const category = catalog.find((item) => item.slug === slug);
  const entry = category?.entries.find((item) => item.name === name);
  if (!category || !entry) {
    return missingCard();
  }
  return shareCardOf({
    eyebrow: `${category.name} \u00b7 ${entry.name}`,
    title: entry.title,
    description: entry.description,
  });
}
