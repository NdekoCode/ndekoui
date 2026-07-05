'use client';

import { useDroppable } from '@dnd-kit/core';
import type { Transition } from 'motion/react';

import { cn } from '@/registry/ndeko/lib/utils';
import { Swap } from '@/registry/ndeko/ui/chat-motion';

import { fieldOf, FIELDS, type Field, type FieldId } from './data';
import { CHIP_SHAPE, FieldChip } from './field-chip';
import {
  canAccept,
  filterLabelOf,
  valueLabelOf,
  WELL_IDS,
  WELL_LABEL,
  wellOf,
  type WellId,
  type Wells,
} from './pivot';
import type { PivotAction, Preview } from './session';

const WELL_HINT: Record<WellId, string> = {
  filters: 'Keep only some runs',
  columns: 'One field across the top',
  rows: 'Up to two fields down the side',
  values: 'The figures in the cells',
};

const REFUSAL: Record<WellId, string> = {
  filters: 'Takes a field to group by, not a figure',
  columns: 'Takes a field to group by, not a figure',
  rows: 'Takes a field to group by, not a figure',
  values: 'Takes a figure: runs, cost, tokens or duration',
};

type ChipEntry = {
  field: Field;
  label: string;
};

function entriesOf(wells: Wells, well: WellId): ChipEntry[] {
  if (well === 'filters') {
    return wells.filters.map((filter) => ({
      field: fieldOf(filter.field),
      label: filterLabelOf(filter),
    }));
  }
  if (well === 'values') {
    return wells.values.map((value) => ({
      field: fieldOf(value.measure),
      label: valueLabelOf(value),
    }));
  }
  return wells[well].map((dimension) => {
    const field = fieldOf(dimension);
    return { field, label: field.label };
  });
}

type WellTone = 'rest' | 'taking' | 'refusing';

const TONE_CLASS: Record<WellTone, string> = {
  rest: 'bg-foreground/[0.03] ring-transparent dark:bg-foreground/[0.05]',
  taking: 'bg-primary/[0.07] ring-primary/30',
  refusing: 'bg-destructive/[0.06] ring-destructive/25',
};

function toneOf(isTaking: boolean, isRefusing: boolean): WellTone {
  if (isTaking) {
    return 'taking';
  }
  if (isRefusing) {
    return 'refusing';
  }
  return 'rest';
}

function hintOf(well: WellId, isRefusing: boolean) {
  if (isRefusing) {
    return REFUSAL[well];
  }
  return WELL_HINT[well];
}

export type ChipSharedProps = {
  /** The committed wells: chips sit where they were dropped, whatever is being previewed. */
  wells: Wells;
  placement: string;
  travel: Transition;
  drops: Partial<Record<FieldId, number>>;
  pressed: string | null;
  onAction: (action: PivotAction) => void;
};

/** A well refuses the held field when it is a figure over a grouping well, or the reverse. */
function refusesField(
  well: WellId,
  isOver: boolean,
  draggedField: FieldId | null
) {
  if (!isOver || draggedField === null) {
    return false;
  }
  return !canAccept(well, draggedField);
}

/** The field held over this well, unless it already sits there. */
function previewFieldOf(preview: Preview | null, well: WellId, wells: Wells) {
  if (preview?.well !== well) {
    return null;
  }
  const isAlreadyThere = wellOf(wells, preview.field) === well;
  if (isAlreadyThere) {
    return null;
  }
  return fieldOf(preview.field);
}

function layoutIdOf(field: FieldId, drops: Partial<Record<FieldId, number>>) {
  const dropCount = drops[field] ?? 0;
  return `${field}:${dropCount}`;
}

type WellProps = ChipSharedProps & {
  well: WellId;
  preview: Preview | null;
  draggedField: FieldId | null;
};

function Well({
  well,
  preview,
  draggedField,
  wells,
  placement,
  travel,
  drops,
  onAction,
}: WellProps) {
  const { setNodeRef, isOver } = useDroppable({ id: well });
  const entries = entriesOf(wells, well);
  const isTaking = preview?.well === well;
  const isRefusing = refusesField(well, isOver, draggedField);
  const tone = toneOf(isTaking, isRefusing);
  const hint = hintOf(well, isRefusing);
  const previewField = previewFieldOf(preview, well, wells);
  const hasChips = entries.length > 0 || previewField !== null;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'hairline-ring flex min-h-11 flex-col gap-1.5 rounded-lg p-2 transition-[background-color,box-shadow] duration-150',
        TONE_CLASS[tone]
      )}
    >
      <h3 className='text-muted-foreground flex items-baseline gap-2 text-xs'>
        <span className='text-foreground font-medium'>{WELL_LABEL[well]}</span>
        <span className='min-w-0 truncate'>
          <Swap swapKey={hint}>{hint}</Swap>
        </span>
      </h3>
      {hasChips && (
        <ul className='flex flex-wrap items-center gap-1.5'>
          {entries.map((entry) => (
            <li key={entry.field.id} className='max-w-full'>
              <FieldChip
                field={entry.field}
                origin='well'
                label={entry.label}
                wells={wells}
                layoutId={layoutIdOf(entry.field.id, drops)}
                placement={placement}
                travel={travel}
                onAction={onAction}
              />
            </li>
          ))}
          {previewField && (
            <li
              aria-hidden='true'
              className={cn(
                CHIP_SHAPE,
                'hairline-border border-primary/50 text-primary-ink border-dashed pe-2 transition-opacity duration-150 starting:opacity-0'
              )}
            >
              {previewField.label}
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

type WellGridProps = ChipSharedProps & {
  preview: Preview | null;
  draggedField: FieldId | null;
};

export function WellGrid({ preview, draggedField, ...shared }: WellGridProps) {
  return (
    <section
      aria-label='Layout of the table'
      className='grid grid-cols-1 gap-2 @lg:grid-cols-2'
    >
      {WELL_IDS.map((well) => (
        <Well
          key={well}
          well={well}
          preview={preview}
          draggedField={draggedField}
          {...shared}
        />
      ))}
    </section>
  );
}

export function FieldList({
  wells,
  placement,
  travel,
  drops,
  pressed,
  onAction,
}: ChipSharedProps) {
  return (
    <section aria-label='Fields' className='flex flex-col gap-2'>
      <h2 className='text-muted-foreground text-xs'>Fields</h2>
      <ul className='flex flex-wrap gap-1.5 @4xl:flex-col @4xl:items-start'>
        {FIELDS.map((field) => {
          const well = wellOf(wells, field.id);
          return (
            <li key={field.id} className='flex min-h-7 max-w-full'>
              {well === null && (
                <FieldChip
                  field={field}
                  origin='list'
                  label={field.label}
                  wells={wells}
                  layoutId={layoutIdOf(field.id, drops)}
                  placement={placement}
                  travel={travel}
                  isPressed={pressed === `field-${field.id}`}
                  onAction={onAction}
                />
              )}
              {well !== null && (
                <span
                  className={cn(
                    CHIP_SHAPE,
                    'hairline-border border-foreground/20 text-muted-foreground gap-1.5 border-dashed pe-2 font-normal'
                  )}
                >
                  {field.label}
                  <span className='text-muted-foreground/70'>
                    in {WELL_LABEL[well]}
                  </span>
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
