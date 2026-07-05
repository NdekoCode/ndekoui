'use client';

import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  pointerWithin,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { LayoutGroup, useReducedMotion } from 'motion/react';
import { useId, useState } from 'react';

import { useSession } from '@/registry/ndeko/hooks/use-session';
import { useTimeouts } from '@/registry/ndeko/hooks/use-timeouts';
import {
  CheckIcon,
  DownloadIcon,
  RepeatIcon,
  XIcon,
} from '@/registry/ndeko/lib/icons';
import { springOf } from '@/registry/ndeko/lib/motion-presets';
import { cn } from '@/registry/ndeko/lib/utils';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Button } from '@/registry/ndeko/ui/button';
import { Fold, Swap } from '@/registry/ndeko/ui/chat-motion';
import { Input } from '@/registry/ndeko/ui/input';
import { ClockGate } from '@/registry/ndeko/ui/live-duration';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';

import { ASK_EXAMPLE } from './ask';
import { csvRowsOf, downloadCsv } from './csv';
import { fieldOf, FIELDS, RECORDS, type FieldId } from './data';
import { CHIP_SHAPE } from './field-chip';
import {
  canAccept,
  pivotOf,
  valueLabelOf,
  WELL_IDS,
  wellOf,
  type PivotTable,
  type WellId,
  type Wells,
} from './pivot';
import { formatValue, PivotTableView } from './pivot-table';
import {
  INITIAL,
  LOOP_AFTER_MS,
  reducer,
  RESTING,
  SCRIPT,
  shownWellsOf,
  type PivotAction,
  type Preview,
} from './session';
import { FieldList, WellGrid } from './wells';

const SESSION = {
  reducer,
  initial: INITIAL,
  resting: RESTING,
  script: SCRIPT,
  loopAfter: LOOP_AFTER_MS,
};

const MOUSE = { activationConstraint: { distance: 4 } };

const TOUCH = { activationConstraint: { delay: 180, tolerance: 6 } };

const EXPORTED_FOR_MS = 1600;

const FILE_NAME = 'agent-runs-pivot.csv';

function fieldOfDragId(id: unknown): FieldId | null {
  const [, fieldId] = String(id).split(':');
  const field = FIELDS.find((candidate) => candidate.id === fieldId);
  return field?.id ?? null;
}

function wellOfDropId(id: unknown): WellId | null {
  const well = WELL_IDS.find((candidate) => candidate === id);
  return well ?? null;
}

/** The preview a held field gives over a well that can take it. */
function previewFor(
  field: FieldId | null,
  well: WellId | null
): Preview | null {
  if (field === null || well === null) {
    return null;
  }
  if (!canAccept(well, field)) {
    return null;
  }
  return { field, well };
}

/** A preview only lives while something holds the field: the demonstration, or a person's pointer. */
function livePreviewOf(isHeld: boolean, preview: Preview | null) {
  if (isHeld) {
    return preview;
  }
  return null;
}

/** Where every field sits. Chips only measure themselves again when it changes. */
function placementOf(wells: Wells) {
  const places = FIELDS.map((field) => {
    const well = wellOf(wells, field.id) ?? 'list';
    return `${field.id}:${well}`;
  });
  return places.join(' ');
}

function runsWordOf(count: number) {
  if (count === 1) {
    return '1 run';
  }
  return `${count} runs`;
}

function headlineOf(table: PivotTable) {
  const [firstValue] = table.values;
  const [firstTotal] = table.grandTotals;
  if (!firstValue || !firstTotal) {
    return { figure: runsWordOf(table.recordCount), label: 'in last week' };
  }
  return {
    figure: formatValue(firstValue, firstTotal.value),
    label: `${valueLabelOf(firstValue)}, ${runsWordOf(table.recordCount)}`,
  };
}

function lowerLabelOf(id: FieldId) {
  return fieldOf(id).label.toLowerCase();
}

/** Sum of cost by agent and model per day: the table said in one line. */
function titleOf(table: PivotTable, wells: Wells) {
  const valueLabels = table.values.map(valueLabelOf);
  const rows = wells.rows.map(lowerLabelOf);
  const columns = wells.columns.map(lowerLabelOf);
  let title = valueLabels.join(' and ');
  if (rows.length > 0) {
    title = `${title} by ${rows.join(' and ')}`;
  }
  if (columns.length > 0) {
    title = `${title} per ${columns.join(' and ')}`;
  }
  return title;
}

function exportWordOf(isExported: boolean) {
  if (isExported) {
    return 'Downloaded';
  }
  return 'Export CSV';
}

function pressedQuietOf(isPressed: boolean) {
  if (isPressed) {
    return 'scale-[0.94] bg-foreground/[0.07]';
  }
  return undefined;
}

function pressedSolidOf(isPressed: boolean) {
  if (isPressed) {
    return 'scale-[0.94] bg-primary/85';
  }
  return undefined;
}

function spokenUnless(isDemonstrating: boolean, message: string) {
  if (isDemonstrating) {
    return '';
  }
  return message;
}

const ASK_FAILED_LINE =
  'No field in that question. Name a figure and a field, like cost by model per day.';

function spokenLineOf(hasAskFailed: boolean, title: string) {
  if (hasAskFailed) {
    return ASK_FAILED_LINE;
  }
  return `Table: ${title}`;
}

function describedByOf(hasAskFailed: boolean, hintId: string) {
  if (hasAskFailed) {
    return hintId;
  }
  return undefined;
}

export default function AgentOps09() {
  const {
    ref,
    isInView,
    isAutoplaying,
    state,
    act,
    pressed,
    isFinished,
    restart,
  } = useSession(SESSION);
  const { schedule } = useTimeouts();
  const shouldReduceMotion = useReducedMotion();
  const travel = springOf(shouldReduceMotion);
  const groupId = useId();
  const dndId = useId();
  const askId = useId();
  const askHintId = useId();
  const [draggedField, setDraggedField] = useState<FieldId | null>(null);
  const [isExported, setIsExported] = useState(false);
  const sensors = useSensors(
    useSensor(MouseSensor, MOUSE),
    useSensor(TouchSensor, TOUCH)
  );
  const isHeld = isAutoplaying || draggedField !== null;
  const preview = livePreviewOf(isHeld, state.preview);
  const shownWells = shownWellsOf(state.wells, preview);
  const table = pivotOf(RECORDS, shownWells, state.collapsed);
  const placement = placementOf(state.wells);
  const headline = headlineOf(table);
  const title = titleOf(table, shownWells);
  const hasValues = table.values.length > 0;
  const canExport = hasValues && table.recordCount > 0;
  const exportWord = exportWordOf(isExported);
  const spokenLine = spokenLineOf(state.hasAskFailed, title);
  const message = spokenUnless(isAutoplaying, spokenLine);
  const askDescribedBy = describedByOf(state.hasAskFailed, askHintId);
  const canReplay = isFinished && !isAutoplaying;
  let draggedLabel: string | null = null;
  if (draggedField) {
    draggedLabel = fieldOf(draggedField).label;
  }

  function focusLater(selector: string) {
    requestAnimationFrame(() => {
      const target = ref.current?.querySelector<HTMLElement>(selector);
      target?.focus();
    });
  }

  /** A chip that changes place is a new element: the focus follows it to its menu button. */
  function actOnChip(action: PivotAction) {
    act(action);
    const movesChip = action.type === 'placed' || action.type === 'removed';
    if (movesChip) {
      focusLater(`[data-chip-menu="${action.field}"]`);
    }
  }

  function startDrag({ active }: DragStartEvent) {
    setDraggedField(fieldOfDragId(active.id));
  }

  function dragOver({ active, over }: DragOverEvent) {
    const field = fieldOfDragId(active.id);
    const well = wellOfDropId(over?.id);
    act({ type: 'previewed', preview: previewFor(field, well) });
  }

  function endDrag({ active, over }: DragEndEvent) {
    const field = fieldOfDragId(active.id);
    const well = wellOfDropId(over?.id);
    const drop = previewFor(field, well);
    setDraggedField(null);
    if (drop) {
      act({ type: 'placed', field: drop.field, well: drop.well, isDrop: true });
      return;
    }
    act({ type: 'previewed', preview: null });
  }

  function cancelDrag() {
    setDraggedField(null);
    act({ type: 'previewed', preview: null });
  }

  function ask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    act({ type: 'asked' });
  }

  function exportCsv() {
    downloadCsv(FILE_NAME, csvRowsOf(table));
    setIsExported(true);
    schedule(() => setIsExported(false), EXPORTED_FOR_MS);
  }

  return (
    <ClockGate isActive={isInView}>
      <div
        ref={ref}
        className='bg-background text-foreground @container min-h-dvh w-full'
      >
        <div className='mx-auto flex max-w-6xl flex-col gap-4 p-4 @3xl:gap-5 @3xl:p-8'>
          <header className='flex flex-wrap items-center gap-x-3 gap-y-2'>
            <div className='flex min-w-0 flex-1 flex-col gap-0.5'>
              <h1 className='text-lg font-semibold text-balance'>Run pivot</h1>
              <p className='text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 text-xs'>
                {runsWordOf(RECORDS.length)} last week
                <Badge variant='secondary'>Illustrative</Badge>
              </p>
            </div>
            <ReplayButton
              isShown={canReplay}
              onReplay={restart}
              label='Replay the pivot'
            />
          </header>

          <form onSubmit={ask} className='flex flex-col gap-1.5'>
            <div className='flex items-center gap-2'>
              <label htmlFor={askId} className='sr-only'>
                Ask to pivot
              </label>
              <Input
                id={askId}
                autoComplete='off'
                placeholder={`Ask to pivot: ${ASK_EXAMPLE}`}
                value={state.question}
                aria-invalid={state.hasAskFailed}
                aria-describedby={askDescribedBy}
                onChange={(event) =>
                  act({ type: 'questionTyped', text: event.target.value })
                }
              />
              <Button
                type='submit'
                className={cn('shrink-0', pressedSolidOf(pressed === 'ask'))}
              >
                Ask
              </Button>
            </div>
            <Fold open={state.hasAskFailed}>
              <p id={askHintId} className='text-destructive-ink text-xs'>
                {ASK_FAILED_LINE}
              </p>
            </Fold>
          </form>

          <DndContext
            id={dndId}
            sensors={sensors}
            collisionDetection={pointerWithin}
            onDragStart={startDrag}
            onDragOver={dragOver}
            onDragEnd={endDrag}
            onDragCancel={cancelDrag}
          >
            <LayoutGroup id={groupId}>
              <div className='flex flex-col gap-4 @4xl:flex-row @4xl:items-start @4xl:gap-6'>
                <div className='@4xl:w-44 @4xl:shrink-0'>
                  <FieldList
                    wells={state.wells}
                    placement={placement}
                    travel={travel}
                    drops={state.drops}
                    pressed={pressed}
                    onAction={actOnChip}
                  />
                </div>
                <div className='flex min-w-0 flex-1 flex-col gap-4'>
                  <WellGrid
                    wells={state.wells}
                    preview={preview}
                    draggedField={draggedField}
                    placement={placement}
                    travel={travel}
                    drops={state.drops}
                    pressed={pressed}
                    onAction={actOnChip}
                  />

                  <div className='flex flex-wrap items-end justify-between gap-x-4 gap-y-2'>
                    <div className='flex min-w-0 flex-col'>
                      <p className='text-2xl leading-8 font-semibold tabular-nums'>
                        <Swap swapKey={headline.figure}>{headline.figure}</Swap>
                      </p>
                      <p className='text-muted-foreground text-xs'>
                        <Swap swapKey={headline.label}>{headline.label}</Swap>
                      </p>
                    </div>
                    <div className='flex flex-wrap items-center gap-2'>
                      <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        onClick={() => act({ type: 'swapped' })}
                        className={pressedQuietOf(pressed === 'swap')}
                      >
                        <RepeatIcon />
                        Swap
                      </Button>
                      <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        onClick={() => act({ type: 'cleared' })}
                      >
                        <XIcon />
                        Clear
                      </Button>
                      <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        disabled={!canExport}
                        onClick={exportCsv}
                      >
                        <Swap swapKey={String(isExported)}>
                          {isExported && <CheckIcon />}
                          {!isExported && <DownloadIcon />}
                        </Swap>
                        <Swap swapKey={exportWord}>{exportWord}</Swap>
                      </Button>
                    </div>
                  </div>

                  <PivotTableView
                    table={table}
                    title={title}
                    collapsed={state.collapsed}
                    pressed={pressed}
                    onAction={act}
                  />
                </div>
              </div>
            </LayoutGroup>
            <DragOverlay dropAnimation={null}>
              {draggedLabel && (
                <span
                  className={cn(
                    CHIP_SHAPE,
                    'surface-raised cursor-grabbing pe-2'
                  )}
                >
                  {draggedLabel}
                </span>
              )}
            </DragOverlay>
          </DndContext>
        </div>
        <LiveRegion message={message} />
      </div>
    </ClockGate>
  );
}
