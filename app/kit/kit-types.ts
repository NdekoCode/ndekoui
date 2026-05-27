import type { ComponentType } from 'react';

import type { PreviewWidth } from '@/app/components/_catalog/preview-widths';

export type KitUnit = {
  name: string;
  width: PreviewWidth;
  Demo: ComponentType;
};

export type KitGroup = {
  id: string;
  title: string;
  description: string;
  units: KitUnit[];
};
