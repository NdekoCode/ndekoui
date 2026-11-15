import {
  SHARE_CARD_SIZE,
  SHARE_CARD_TYPE,
  shareCardOf,
} from '@/app/_site/share-card';
import { docsExampleOf } from '@/app/docs/docs-catalog';
import { registrySummaryOf } from '@/lib/registry-summary';
import { motionItemNameOf } from '@/lib/site';

type DocsExampleShareImageProps = {
  params: Promise<{ slug: string; example: string }>;
};

export const alt =
  'An example of an ndekoui motion component: its name and what it does.';

export const size = SHARE_CARD_SIZE;

export const contentType = SHARE_CARD_TYPE;

function missingCard() {
  return new Response(null, { status: 404 });
}

export default async function DocsExampleShareImage({
  params,
}: DocsExampleShareImageProps) {
  const { slug, example } = await params;
  const entry = docsExampleOf(slug, example);
  if (!entry) {
    return missingCard();
  }
  const itemName = motionItemNameOf(entry.slug);
  const summary = registrySummaryOf(itemName);
  const fallback = `An example of ${entry.pageTitle} from ndekoui.`;
  const description = summary?.description ?? fallback;
  return shareCardOf({
    eyebrow: `${entry.pageTitle} \u00b7 ${itemName}`,
    title: entry.title,
    description,
  });
}
