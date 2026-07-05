'use client';

import { useDraggable } from '@dnd-kit/core';
import { motion, type Transition } from 'motion/react';

import { ChevronDownIcon, HashIcon, XIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/registry/ndeko/ui/dropdown-menu';

import { DIMENSION_VALUES, isMeasure, type Field } from './data';
import {
  AGGREGATION_WORD,
  AGGREGATIONS,
  canAccept,
  WELL_IDS,
  WELL_LABEL,
  wellOf,
  type Wells,
} from './pivot';
import type { PivotAction } from './session';

export type ChipOrigin = 'list' | 'well';

/** Unplaced fields are plain pills; a field placed in a well wears the brand chip of an assigned value. */
const SURFACE: Record<ChipOrigin, string> = {
  list: 'bg-card hairline-ring ring-foreground/12 text-foreground shadow-[0_1px_2px_rgb(0_0_0/0.05)] dark:bg-foreground/[0.04] dark:ring-foreground/15',
  well: 'chip-3d [--chip:var(--primary)]',
};

export const CHIP_SHAPE =
  'inline-flex h-7 max-w-full items-center gap-1 rounded-md ps-2 text-xs font-medium whitespace-nowrap';

const CHIP_BUTTON =
  'focus-visible:ring-ring/25 flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-sm opacity-70 transition-[opacity,background-color] duration-150 outline-none hover:bg-foreground/[0.08] hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-[3px]';

function pressedOf(isPressed: boolean) {
  if (isPressed) {
    return 'scale-[0.94] bg-foreground/[0.07]';
  }
  return undefined;
}

function moveWordOf(isPlaced: boolean) {
  if (isPlaced) {
    return 'Move to';
  }
  return 'Add to';
}

type ChipMenuProps = {
  field: Field;
  wells: Wells;
  onAction: (action: PivotAction) => void;
};

/** The keyboard path of a chip: every well it can go to, then what its own well lets it change. */
function ChipMenu({ field, wells, onAction }: ChipMenuProps) {
  const current = wellOf(wells, field.id);
  const isPlaced = current !== null;
  const moveWord = moveWordOf(isPlaced);
  const targets = WELL_IDS.filter((well) => {
    const isOpen = canAccept(well, field.id);
    const isElsewhere = well !== current;
    return isOpen && isElsewhere;
  });
  const valueSpec = wells.values.find((value) => value.measure === field.id);
  const filter = wells.filters.find((entry) => entry.field === field.id);

  function changeAggregation(next: unknown) {
    const aggregation = AGGREGATIONS.find((candidate) => candidate === next);
    if (aggregation && isMeasure(field.id)) {
      onAction({ type: 'aggregation', measure: field.id, aggregation });
    }
  }

  return (
    <DropdownMenuContent align='start' className='min-w-44'>
      {targets.map((well) => (
        <DropdownMenuItem
          key={well}
          onClick={() => onAction({ type: 'placed', field: field.id, well })}
        >
          {moveWord} {WELL_LABEL[well]}
        </DropdownMenuItem>
      ))}
      {valueSpec && (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Summarise by</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={valueSpec.aggregation}
            onValueChange={changeAggregation}
          >
            {AGGREGATIONS.map((aggregation) => (
              <DropdownMenuRadioItem key={aggregation} value={aggregation}>
                {AGGREGATION_WORD[aggregation]}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </>
      )}
      {filter && (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Keep</DropdownMenuLabel>
          {DIMENSION_VALUES[filter.field].map((value) => (
            <DropdownMenuCheckboxItem
              key={value}
              checked={filter.values.includes(value)}
              onCheckedChange={() =>
                onAction({ type: 'filterValue', field: filter.field, value })
              }
            >
              {value}
            </DropdownMenuCheckboxItem>
          ))}
        </>
      )}
      {current !== null && (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => onAction({ type: 'removed', field: field.id })}
          >
            Remove from {WELL_LABEL[current]}
          </DropdownMenuItem>
        </>
      )}
    </DropdownMenuContent>
  );
}

export type FieldChipProps = {
  field: Field;
  origin: ChipOrigin;
  /** What the chip says: the field in the list, the field with its setting in a well. */
  label: string;
  wells: Wells;
  layoutId: string;
  /** Where every field sits: the chip measures itself again when it changes. */
  placement: string;
  travel: Transition;
  isPressed?: boolean;
  onAction: (action: PivotAction) => void;
};

export function FieldChip({
  field,
  origin,
  label,
  wells,
  layoutId,
  placement,
  travel,
  isPressed = false,
  onAction,
}: FieldChipProps) {
  const { setNodeRef, listeners, isDragging } = useDraggable({
    id: `${origin}:${field.id}`,
  });
  const isInWell = origin === 'well';
  const isMeasureField = field.kind === 'measure';

  return (
    <motion.div
      layout='position'
      layoutId={layoutId}
      layoutDependency={placement}
      transition={{ layout: travel }}
      className='inline-flex max-w-full'
    >
      <div
        ref={setNodeRef}
        {...listeners}
        className={cn(
          CHIP_SHAPE,
          SURFACE[origin],
          'cursor-grab touch-manipulation transition-[scale,opacity,background-color] duration-150 select-none active:cursor-grabbing',
          isDragging && 'opacity-40',
          pressedOf(isPressed)
        )}
      >
        {isMeasureField && (
          <HashIcon aria-hidden='true' className='size-3 shrink-0 opacity-60' />
        )}
        <span className='min-w-0 truncate'>{label}</span>
        <DropdownMenu>
          <DropdownMenuTrigger
            data-chip-menu={field.id}
            aria-label={`${label}: where it goes`}
            className={CHIP_BUTTON}
          >
            <ChevronDownIcon className='size-3.5' />
          </DropdownMenuTrigger>
          <ChipMenu field={field} wells={wells} onAction={onAction} />
        </DropdownMenu>
        {isInWell && (
          <button
            type='button'
            aria-label={`Remove ${label}`}
            onClick={() => onAction({ type: 'removed', field: field.id })}
            className={cn(CHIP_BUTTON, '-ms-1')}
          >
            <XIcon className='size-3.5' />
          </button>
        )}
        {!isInWell && <span aria-hidden='true' className='w-0.5' />}
      </div>
    </motion.div>
  );
}
