'use client';

import { useLayoutEffect, useRef, useState } from 'react';

import { FileTextIcon } from '@/registry/ndeko/lib/icons';
import { Swap } from '@/registry/ndeko/ui/chat-motion';
import { ClockGate } from '@/registry/ndeko/ui/live-duration';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { MorphButton, type MorphState } from '@/registry/ndeko/ui/morph-button';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';
import { Segments, type Segment } from '@/registry/ndeko/ui/segments';

import {
  DOCUMENT_NAME,
  fieldOf,
  FIELDS,
  type ExtractField,
  type FieldId,
  type PageNumber,
} from './data';
import { DocumentPage } from './document';
import { FieldList, JsonPanel, SchemaPanel } from './fields';
import {
  INITIAL,
  isReadingDone,
  LOOP_AFTER_MS,
  pendingIdsOf,
  reducer,
  RESTING,
  reviewOf,
  SAVE_MS,
  SCRIPT,
  type ExtractState,
  type ExtractTab,
} from './session';
import { useSession } from '@/registry/ndeko/hooks/use-session';
import { useTimeouts } from '@/registry/ndeko/hooks/use-timeouts';

const SESSION = {
  reducer,
  initial: INITIAL,
  resting: RESTING,
  script: SCRIPT,
  loopAfter: LOOP_AFTER_MS,
};

const TAB_SEGMENTS: Segment<ExtractTab>[] = [
  { value: 'fields', label: 'Fields' },
  { value: 'json', label: 'JSON' },
  { value: 'schema', label: 'Schema' },
];

const PAGE_SEGMENTS: Segment<'1' | '2'>[] = [
  { value: '1', label: 'Page 1' },
  { value: '2', label: 'Page 2' },
];

const SAVE_LABELS: Record<MorphState, string> = {
  idle: 'Accept all',
  busy: 'Saving',
  done: 'Saved',
};

function pageOf(value: '1' | '2'): PageNumber {
  if (value === '2') {
    return 2;
  }
  return 1;
}

function statusOf(state: ExtractState) {
  if (state.save === 'done') {
    return 'Saved to your records';
  }
  if (!isReadingDone(state)) {
    return `Reading page ${state.page}`;
  }
  const pending = pendingIdsOf(state).length;
  if (pending === 0) {
    return 'Every value is checked';
  }
  if (pending === 1) {
    return '1 value needs a look';
  }
  return `${pending} values need a look`;
}

function activeOf(
  hovered: FieldId | null,
  pointed: FieldId | null,
  isAutoplaying: boolean
) {
  if (hovered) {
    return hovered;
  }
  if (isAutoplaying) {
    return pointed;
  }
  return null;
}

function spokenUnless(isDemonstrating: boolean, message: string) {
  if (isDemonstrating) {
    return '';
  }
  return message;
}

function pressedSolidOf(isPressed: boolean) {
  if (isPressed) {
    return 'scale-[0.94] bg-primary/85';
  }
  return undefined;
}

function middleOf(box: DOMRect) {
  return box.top + box.height / 2;
}

/**
 * The thread from a value on the page to its row is written to the path directly: pointing at
 * a value re-renders nothing but the two things it lights.
 */
function useThread(
  wrapperRef: React.RefObject<HTMLDivElement | null>,
  pathRef: React.RefObject<SVGPathElement | null>,
  activeId: FieldId | null,
  layoutKey: string
) {
  useLayoutEffect(() => {
    const wrapper = wrapperRef.current;
    const path = pathRef.current;
    if (!wrapper || !path) {
      return;
    }
    const box = wrapper.querySelector(`[data-box='${activeId}']`);
    const row = wrapper.querySelector(`[data-row='${activeId}']`);
    if (!box || !row) {
      path.style.opacity = '0';
      return;
    }
    const frame = wrapper.getBoundingClientRect();
    const from = box.getBoundingClientRect();
    const to = row.getBoundingClientRect();
    const startX = from.right - frame.left;
    const endX = to.left - frame.left;
    const isSideBySide = endX > startX;
    if (!isSideBySide) {
      path.style.opacity = '0';
      return;
    }
    const startY = middleOf(from) - frame.top;
    const endY = middleOf(to) - frame.top;
    const bendX = (startX + endX) / 2;
    const curve = `M ${startX} ${startY} C ${bendX} ${startY}, ${bendX} ${endY}, ${endX} ${endY}`;
    path.setAttribute('d', curve);
    path.style.transition = 'none';
    path.style.strokeDashoffset = '1';
    path.style.opacity = '1';
    path.getBoundingClientRect();
    path.style.transition = '';
    path.style.strokeDashoffset = '0';
  }, [wrapperRef, pathRef, activeId, layoutKey]);
}

export default function AgentReview03() {
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
  const [hovered, setHovered] = useState<FieldId | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const { schedule } = useTimeouts();
  const activeId = activeOf(hovered, state.pointed, isAutoplaying);
  const layoutKey = `${state.page}:${state.tab}:${state.shown}`;
  useThread(wrapperRef, pathRef, activeId, layoutKey);
  const readFields = FIELDS.slice(0, state.shown);
  const readIds = new Set(readFields.map((field) => field.id));
  const pendingCount = pendingIdsOf(state).length;
  const canAccept = isReadingDone(state) && pendingCount === 0;
  const status = statusOf(state);
  const message = spokenUnless(isAutoplaying, status);
  const canReplay = isFinished && !isAutoplaying;

  function valueOf(field: ExtractField) {
    return state.edits[field.id] ?? field.value;
  }

  function pick(id: FieldId) {
    const field = fieldOf(id);
    act({ type: 'page', page: field.page });
    act({ type: 'tab', tab: 'fields' });
  }

  function accept() {
    act({ type: 'saving' });
    schedule(() => act({ type: 'saved' }), SAVE_MS);
  }

  return (
    <ClockGate isActive={isInView}>
      <div
        ref={ref}
        className='bg-background text-foreground @container min-h-dvh w-full p-3 @3xl:p-8'
      >
        <div className='mx-auto flex max-w-5xl flex-col gap-4'>
          <header className='flex flex-wrap items-center gap-x-3 gap-y-2'>
            <span
              aria-hidden='true'
              className='keycap-3d text-muted-foreground inline-flex size-7 shrink-0 items-center justify-center rounded-md'
            >
              <FileTextIcon className='size-3.5' />
            </span>
            <div className='flex min-w-40 flex-1 flex-col leading-tight'>
              <h1 className='truncate font-mono text-[13px] font-medium'>
                {DOCUMENT_NAME}
              </h1>
              <Swap swapKey={status} className='text-muted-foreground text-xs'>
                {status}
              </Swap>
            </div>
            <ReplayButton
              isShown={canReplay}
              onReplay={restart}
              label='Read it again'
            />
          </header>

          <div
            ref={wrapperRef}
            className='relative flex flex-col gap-4 @3xl:flex-row @3xl:items-start @3xl:gap-10'
          >
            <section
              aria-label='Document'
              className='bg-foreground/[0.03] flex min-w-0 flex-1 flex-col gap-3 rounded-xl p-3'
            >
              <div className='flex items-center justify-between gap-2'>
                <Segments
                  label='Page'
                  value={`${state.page}`}
                  segments={PAGE_SEGMENTS}
                  onValueChange={(value) =>
                    act({ type: 'page', page: pageOf(value) })
                  }
                />
                <span className='text-muted-foreground text-xs'>2 pages</span>
              </div>
              <DocumentPage
                page={state.page}
                activeId={activeId}
                readIds={readIds}
                onPoint={setHovered}
                onPick={pick}
              />
            </section>

            <section
              aria-label='Extraction'
              className='bg-card hairline-ring ring-border dark:bg-foreground/[0.03] flex flex-col gap-3 rounded-xl p-3 shadow-[0_1px_2px_rgb(0_0_0/0.04)] @3xl:w-[22rem] @3xl:shrink-0'
            >
              <div className='flex items-center justify-between gap-2'>
                <Segments
                  label='View'
                  value={state.tab}
                  segments={TAB_SEGMENTS}
                  onValueChange={(tab) => act({ type: 'tab', tab })}
                />
                <span className='text-muted-foreground text-xs tabular-nums'>
                  {state.shown} of {FIELDS.length}
                </span>
              </div>

              <div className='min-h-[13rem]'>
                {state.tab === 'fields' && (
                  <FieldList
                    shown={state.shown}
                    activeId={activeId}
                    pressed={pressed}
                    valueOf={valueOf}
                    reviewOf={(id) => reviewOf(state, id)}
                    onPoint={setHovered}
                    onPick={pick}
                    onConfirm={(id) => act({ type: 'confirmed', id })}
                    onEdit={(id, value) => act({ type: 'edited', id, value })}
                  />
                )}
                {state.tab === 'json' && (
                  <JsonPanel shown={state.shown} valueOf={valueOf} />
                )}
                {state.tab === 'schema' && <SchemaPanel />}
              </div>

              <div className='flex items-center justify-between gap-3'>
                <span className='text-muted-foreground text-xs'>
                  Illustrative confidence
                </span>
                <MorphButton
                  type='button'
                  size='sm'
                  state={state.save}
                  labels={SAVE_LABELS}
                  disabled={!canAccept}
                  onClick={accept}
                  className={pressedSolidOf(pressed === 'accept')}
                />
              </div>
            </section>

            <svg
              aria-hidden='true'
              className='pointer-events-none absolute inset-0 hidden size-full overflow-visible @3xl:block'
            >
              <path
                ref={pathRef}
                pathLength={1}
                strokeDasharray='1'
                fill='none'
                strokeWidth='1.5'
                strokeLinecap='round'
                className='stroke-primary opacity-0 transition-[stroke-dashoffset] duration-300 ease-(--ease-out-strong) motion-reduce:transition-none'
              />
            </svg>
          </div>
        </div>
        <LiveRegion message={message} />
      </div>
    </ClockGate>
  );
}
