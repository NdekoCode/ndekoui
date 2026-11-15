import { bundleIndexCardOf } from '@/app/blocks/_shared/bundle-share';
import {
  SHARE_CARD_SIZE,
  SHARE_CARD_TYPE,
  shareCardOf,
} from '@/app/_site/share-card';

export const alt =
  'The ndekoui blocks: how many there are and what they are for.';

export const size = SHARE_CARD_SIZE;

export const contentType = SHARE_CARD_TYPE;

export default function BlocksShareImage() {
  const card = bundleIndexCardOf('blocks');
  return shareCardOf(card);
}
