import {
  BlocksIcon,
  BoxIcon,
  ComponentIcon,
  LayoutGridIcon,
  PanelsTopLeftIcon,
  MotionIcon,
  type Icon,
} from '@/registry/ndeko/lib/icons';

import { SEARCH_KINDS, type SearchKind } from './search-types';

export type SearchTab = 'all' | SearchKind;

type KindCopy = {
  label: string;
  singular: string;
  plural: string;
  Icon: Icon;
};

export const KIND_COPY: Record<SearchKind, KindCopy> = {
  primitive: {
    label: 'Primitives',
    singular: 'primitive',
    plural: 'primitives',
    Icon: BoxIcon,
  },
  component: {
    label: 'Components',
    singular: 'component',
    plural: 'components',
    Icon: ComponentIcon,
  },
  block: {
    label: 'Blocks',
    singular: 'block',
    plural: 'blocks',
    Icon: BlocksIcon,
  },
  template: {
    label: 'Templates',
    singular: 'template',
    plural: 'templates',
    Icon: PanelsTopLeftIcon,
  },
  motion: {
    label: 'Motion',
    singular: 'motion page',
    plural: 'motion pages',
    Icon: MotionIcon,
  },
};

export const SEARCH_TABS: SearchTab[] = ['all', ...SEARCH_KINDS];

export const TAB_LABELS: Record<SearchTab, string> = {
  all: 'All',
  primitive: KIND_COPY.primitive.label,
  component: KIND_COPY.component.label,
  block: KIND_COPY.block.label,
  template: KIND_COPY.template.label,
  motion: KIND_COPY.motion.label,
};

export const TAB_ICONS: Record<SearchTab, Icon> = {
  all: LayoutGridIcon,
  primitive: KIND_COPY.primitive.Icon,
  component: KIND_COPY.component.Icon,
  block: KIND_COPY.block.Icon,
  template: KIND_COPY.template.Icon,
  motion: KIND_COPY.motion.Icon,
};

export function isSearchTab(value: unknown): value is SearchTab {
  return SEARCH_TABS.some((tab) => tab === value);
}
