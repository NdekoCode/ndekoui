import {
  SHARE_CARD_SIZE,
  SHARE_CARD_TYPE,
  shareCardOf,
} from '@/app/_site/share-card';
import { CATALOG_STATS, componentCountPhraseOf } from '@/lib/catalog-stats';

export const alt =
  'The ndekoui components: how many there are and what they cover.';

export const size = SHARE_CARD_SIZE;

export const contentType = SHARE_CARD_TYPE;

export default function ComponentsShareImage() {
  return shareCardOf({
    eyebrow: componentCountPhraseOf(CATALOG_STATS),
    title: 'Components for the screens you build every week',
    description:
      'Compositions built on the ndekoui primitives and grouped by what they do, each installable with the shadcn CLI.',
  });
}
