import {
  SHARE_CARD_SIZE,
  SHARE_CARD_TYPE,
  shareCardOf,
} from '@/app/_site/share-card';
import { CATALOG_STATS } from '@/lib/catalog-stats';
import { countLabel } from '@/lib/site';

export const alt = 'The ndekoui themes: how many there are and what they set.';

export const size = SHARE_CARD_SIZE;

export const contentType = SHARE_CARD_TYPE;

export default function ThemesShareImage() {
  return shareCardOf({
    eyebrow: countLabel(CATALOG_STATS.themes, 'theme', 'themes'),
    title: 'Recolour every ndekoui piece at once',
    description:
      'Each theme sets the primary colour, brand text, focus ring and chart colours for light and dark, measured against WCAG AA.',
  });
}
