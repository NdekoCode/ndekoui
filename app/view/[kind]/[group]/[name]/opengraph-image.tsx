import {
  SHARE_CARD_SIZE,
  SHARE_CARD_TYPE,
  shareCardOf,
} from '@/app/_site/share-card';
import {
  bundleEntryOf,
  isBundleKind,
  viewParamsOf,
} from '@/app/blocks/_shared/bundles';

type BundleShareImageProps = {
  params: Promise<{ kind: string; group: string; name: string }>;
};

export const alt =
  'An ndekoui block or template: its group, its name and what it shows.';

export const size = SHARE_CARD_SIZE;

export const contentType = SHARE_CARD_TYPE;

export const dynamicParams = false;

export function generateStaticParams() {
  return viewParamsOf();
}

function missingCard() {
  return new Response(null, { status: 404 });
}

export default async function BundleShareImage({
  params,
}: BundleShareImageProps) {
  const { kind, group, name } = await params;
  if (!isBundleKind(kind)) {
    return missingCard();
  }
  const found = bundleEntryOf(kind, group, name);
  if (!found) {
    return missingCard();
  }
  return shareCardOf({
    eyebrow: `${found.group.name} \u00b7 ${found.entry.name}`,
    title: found.entry.title,
    description: found.entry.description,
  });
}
