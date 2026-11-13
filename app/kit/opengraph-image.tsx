import {
  SHARE_CARD_SIZE,
  SHARE_CARD_TYPE,
  shareCardOf,
} from '@/app/_site/share-card';
import { CATALOG_STATS } from '@/lib/catalog-stats';
import { countLabel } from '@/lib/site';

export const alt =
  'The ndekoui primitives: how many there are and what they do.';

export const size = SHARE_CARD_SIZE;

export const contentType = SHARE_CARD_TYPE;

export default function KitShareImage() {
  return shareCardOf({
    eyebrow: countLabel(CATALOG_STATS.primitives, 'primitive', 'primitives'),
    title: 'Primitives on Base UI',
    description:
      'Every ndekoui primitive on one page, in light and dark, each with its code and the command that installs it.',
  });
}
