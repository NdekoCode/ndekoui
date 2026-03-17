'use client';

import { cn } from '@/registry/ndeko/lib/utils';
import { Checkbox } from '@/registry/ndeko/ui/checkbox';

import {
  DUE_CELL,
  GUTTER_CELL,
  ID_CELL,
  LABELS_CELL,
  PRIORITY_CELL,
  TASK_GRID,
} from './task-grid';

const LABEL_CELL = 'text-xs font-medium text-muted-foreground';

export type SelectionState = 'none' | 'some' | 'all';

type ColumnLabelsProps = {
  selection: SelectionState;
  onToggleAll: (isSelected: boolean) => void;
};

export function ColumnLabels({ selection, onToggleAll }: ColumnLabelsProps) {
  const isAllSelected = selection === 'all';
  const isPartlySelected = selection === 'some';

  return (
    <div
      role='row'
      className={cn(
        TASK_GRID,
        'bg-background hairline-b border-border sticky top-0 z-20 h-9'
      )}
    >
      <div role='columnheader' className={GUTTER_CELL}>
        <Checkbox
          checked={isAllSelected}
          indeterminate={isPartlySelected}
          onCheckedChange={onToggleAll}
          aria-label='Select every task shown'
        />
      </div>
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
