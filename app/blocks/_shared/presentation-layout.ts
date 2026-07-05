import type { BundleKind } from './types';

/**
 * How the full-page view frames an entry: application blocks sit centred on their own surface,
 * marketing sections keep the full width with room above and below, templates fill the window.
 */
export type PresentationLayout = 'contained' | 'wide' | 'bleed';

const MARKETING_GROUPS = new Set([
  'changelog',
  'contact',
  'ctas',
  'faqs',
  'features',
  'footers',
  'headers',
  'heroes',
  'legal',
  'logo-clouds',
  'pricing',
  'stats',
  'team-sections',
  'testimonials',
]);

export function presentationLayoutOf(
  kind: BundleKind,
  groupSlug: string
): PresentationLayout {
  if (kind === 'templates') {
    return 'bleed';
  }
  if (MARKETING_GROUPS.has(groupSlug)) {
    return 'wide';
  }
  return 'contained';
}
