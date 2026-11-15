import {
  SHARE_CARD_SIZE,
  SHARE_CARD_TYPE,
  shareCardOf,
} from '@/app/_site/share-card';
import { registrySummaryOf } from '@/lib/registry-summary';

type PrimitiveShareImageProps = {
  params: Promise<{ name: string }>;
};

export const alt = 'An ndekoui primitive: its name and what it does.';

export const size = SHARE_CARD_SIZE;

export const contentType = SHARE_CARD_TYPE;

function missingCard() {
  return new Response(null, { status: 404 });
}

export default async function PrimitiveShareImage({
  params,
}: PrimitiveShareImageProps) {
  const { name } = await params;
  const summary = registrySummaryOf(name);
  if (!summary?.title) {
    return missingCard();
  }
  const description = summary.description ?? '';
  return shareCardOf({
    eyebrow: `Primitive \u00b7 ${name}`,
    title: summary.title,
    description,
  });
}
