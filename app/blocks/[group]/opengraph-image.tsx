import {
  bundleGroupCardOf,
  bundleGroupParamsOf,
} from '@/app/blocks/_shared/bundle-share';
import {
  SHARE_CARD_SIZE,
  SHARE_CARD_TYPE,
  shareCardOf,
} from '@/app/_site/share-card';

type GroupShareImageProps = {
  params: Promise<{ group: string }>;
};

export const alt =
  'A group of ndekoui blocks: its name, its count and what it holds.';

export const size = SHARE_CARD_SIZE;

export const contentType = SHARE_CARD_TYPE;

export const dynamicParams = false;

export function generateStaticParams() {
  return bundleGroupParamsOf('blocks');
}

export default async function GroupShareImage({
  params,
}: GroupShareImageProps) {
  const { group } = await params;
  const card = bundleGroupCardOf('blocks', group);
  return shareCardOf(card);
}
