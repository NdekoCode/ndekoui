import { aiItems } from '@/registry/ai-items';
import { chatItems } from '@/registry/chat-items';
import { primitiveItems } from '@/registry/items';

import { KIT_GROUPS } from './kit-groups';
import type { KitUnit } from './kit-types';

export const KIT_ITEMS = [...primitiveItems, ...chatItems, ...aiItems];

export function kitItemOf(name: string) {
  return KIT_ITEMS.find((item) => item.name === name);
}

export function kitUnitOf(name: string): KitUnit | undefined {
  for (const group of KIT_GROUPS) {
    const unit = group.units.find((candidate) => candidate.name === name);
    if (unit) {
      return unit;
    }
  }
  return undefined;
}
