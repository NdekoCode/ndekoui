import { CheckIcon, MinusIcon } from '@/registry/ndeko/lib/icons';

import type { Cell } from './data';

/** A check for included, a dash for not included, or the value itself; a screen reader hears the words. */
export function CellMark({ cell }: { cell: Cell }) {
  if (cell.kind === 'check') {
    return (
      <span className='inline-flex'>
        <CheckIcon className='size-4' />
        <span className='sr-only'>Included</span>
      </span>
    );
  }
  if (cell.kind === 'dash') {
    return (
      <span className='text-muted-foreground inline-flex'>
        <MinusIcon className='size-4' />
        <span className='sr-only'>Not included</span>
      </span>
    );
  }
  return <span className='tabular-nums'>{cell.text}</span>;
}
