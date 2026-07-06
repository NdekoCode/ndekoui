import { cn } from '@/registry/ndeko/lib/utils';

import {
  DUE_CELL,
  ID_CELL,
  LABELS_CELL,
  PRIORITY_CELL,
  TASK_GRID,
} from './task-grid';

const LABEL_CELL = 'text-xs font-medium text-muted-foreground';

export function ColumnLabels() {
  return (
    <div
      role='row'
      className={cn(
        TASK_GRID,
        'bg-background hairline-b border-border sticky top-0 z-20 h-9'
      )}
    >
      <div role='columnheader' className={PRIORITY_CELL}>
        <span className='sr-only'>Priority</span>
      </div>
      <div role='columnheader' className={cn(ID_CELL, LABEL_CELL)}>
        ID
      </div>
      <div role='columnheader'>
        <span className='sr-only'>Status</span>
      </div>
      <div role='columnheader' className={LABEL_CELL}>
        Title
      </div>
      <div role='columnheader' className={cn(LABELS_CELL, LABEL_CELL)}>
        Labels
      </div>
      <div
        role='columnheader'
        className={cn(LABEL_CELL, 'text-right @2xl:text-left')}
      >
        People
      </div>
      <div role='columnheader' className={cn(DUE_CELL, LABEL_CELL)}>
        Due
      </div>
    </div>
  );
}
