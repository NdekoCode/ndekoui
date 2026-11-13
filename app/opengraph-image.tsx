import {
  SHARE_CARD_SIZE,
  SHARE_CARD_TYPE,
  shareCardOf,
} from './_site/share-card';

export const alt =
  'ndekoui: React components that animate every change of state.';

export const size = SHARE_CARD_SIZE;

export const contentType = SHARE_CARD_TYPE;

export default function OpenGraphImage() {
  return shareCardOf({
    title: 'React components that animate every change of state',
    description:
      'Open-source primitives, components, blocks and templates, installed with the shadcn CLI.',
  });
}
