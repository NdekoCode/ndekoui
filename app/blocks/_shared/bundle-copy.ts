import type { BundleKind } from './types';

type BundleCopy = {
  title: string;
  lead: string;
  singular: string;
  plural: string;
};

/** The words of the blocks and templates pages, shared with their share cards. */
export const BUNDLE_COPY: Record<BundleKind, BundleCopy> = {
  blocks: {
    title: 'Blocks for whole sections of a product',
    lead: 'App shells, lists, boards, settings and marketing sections, built from the components with fictional data. Resize each one to check it on a phone.',
    singular: 'block',
    plural: 'blocks',
  },
  templates: {
    title: 'Templates to start a product from',
    lead: 'Complete pages assembled from the blocks. Open one, install it and replace the fictional data with yours.',
    singular: 'template',
    plural: 'templates',
  },
};
