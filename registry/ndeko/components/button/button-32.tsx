'use client';

import { useState } from 'react';

import {
  AlignCenterIcon,
  AlignJustifyIcon,
  AlignLeftIcon,
  AlignRightIcon,
} from '@/registry/ndeko/lib/icons';
import { ToggleGroup, ToggleGroupItem } from '@/registry/ndeko/ui/toggle-group';

const ITEM = [
  'rounded-none first:rounded-s-md last:rounded-e-md focus-visible:z-10',
  'bg-primary/80 text-primary-foreground hover:bg-primary hover:text-primary-foreground',
  'data-pressed:bg-primary data-pressed:text-primary-foreground',
].join(' ');

export default function Button32() {
  const [alignment, setAlignment] = useState(['center']);

  function selectAlignment(nextAlignment: string[]) {
    const hasSelection = nextAlignment.length > 0;
    if (hasSelection) {
      setAlignment(nextAlignment);
    }
  }

  return (
    <ToggleGroup
      value={alignment}
      onValueChange={selectAlignment}
      aria-label='Text alignment'
      className='hairline-divide-x divide-background gap-0'
    >
      <ToggleGroupItem value='left' aria-label='Align left' className={ITEM}>
        <AlignLeftIcon />
      </ToggleGroupItem>
      <ToggleGroupItem
        value='center'
        aria-label='Align center'
        className={ITEM}
      >
        <AlignCenterIcon />
      </ToggleGroupItem>
      <ToggleGroupItem value='right' aria-label='Align right' className={ITEM}>
        <AlignRightIcon />
      </ToggleGroupItem>
      <ToggleGroupItem
        value='justify'
        aria-label='Align justify'
        className={ITEM}
      >
        <AlignJustifyIcon />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
