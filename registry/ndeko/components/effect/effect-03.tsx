'use client';

import {
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';

import {
  useAutoplay,
  type AutoplayStep,
} from '@/registry/ndeko/hooks/use-autoplay';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { seriesColorOf } from '@/registry/ndeko/lib/agent-run';
import { FileTextIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Avatar } from '@/registry/ndeko/ui/avatar';
import { Swap } from '@/registry/ndeko/ui/chat-motion';
import { Input } from '@/registry/ndeko/ui/input';
import { Segments, type Segment } from '@/registry/ndeko/ui/segments';

import { createFollower, type Follower } from './_parts/follower';
import { hundredthsOf } from './_parts/rounded';
import { useHover } from './_parts/use-hover';

export type CursorMode = 'name' | 'label' | 'crosshair';

type Presence = {
  /** The cursor is inside the area. */
  isInside: boolean;
  /** The word a target under the cursor gives with `data-cursor-label`. */
  label: string | null;
  /** The cursor is over a field, or over an element that asks for the cursor of the system. */
  isNative: boolean;
};

type CursorParts = {
  point: HTMLElement;
  column: HTMLElement;
  row: HTMLElement;
  across: HTMLElement;
  down: HTMLElement;
};

type AreaSize = {
  width: number;
  height: number;
};

type DotState = 'hidden' | 'shown' | 'grown';

type InkStyle = React.CSSProperties & { '--cursor-ink': string };

const AWAY: Presence = { isInside: false, label: null, isNative: false };

const FINE_POINTER_QUERY = '(pointer: fine)';

const NATIVE_CURSOR_TARGETS =
  'input, textarea, select, [contenteditable=""], [contenteditable="true"], [data-cursor="native"]';

const LABELLED_TARGET = '[data-cursor-label]';

/** A pointer is trailed by a light spring, a demonstration glides from place to place. */
const POINTER_STIFFNESS = 650;

const DEMO_STIFFNESS = 70;

const PRECISION_PX = 0.2;

/** A gliding cursor is close enough to its place this long after it set off to tell what it is over. */
const ARRIVAL_MS = 420;

/** Near the right or the bottom edge, the name and the figures move to the other side of the cursor so the edge does not cut them. */
const FLIP_ACROSS_PX = 128;

const FLIP_DOWN_PX = 44;

/** The tip of the arrow sits on the point of the cursor. */
const ARROW_PATH = 'M0 0v15.2l4-3.9 2.6 5.9 2.7-1.2-2.6-5.8h5.6Z';

function subscribeToPointerKind(onChange: () => void) {
  const media = window.matchMedia(FINE_POINTER_QUERY);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}

function readFinePointer() {
  return window.matchMedia(FINE_POINTER_QUERY).matches;
}

function fineOnServer() {
  return false;
}

/** Whether the main pointer of the device aims finely, as a mouse or a trackpad does. Read the same way as reduced motion, so the first render matches the server. */
function useFinePointer() {
  return useSyncExternalStore(
    subscribeToPointerKind,
    readFinePointer,
    fineOnServer
  );
}

function labelOf(target: Element, area: HTMLElement) {
  const labelled = target.closest(LABELLED_TARGET);
  if (!labelled) {
    return null;
  }
  if (!area.contains(labelled)) {
    return null;
  }
  return labelled.getAttribute('data-cursor-label');
}

function isOverNativeTarget(target: Element, area: HTMLElement) {
  const native = target.closest(NATIVE_CURSOR_TARGETS);
  if (!native) {
    return false;
  }
  return area.contains(native);
}

function presenceOf(target: EventTarget | null, area: HTMLElement): Presence {
  if (!(target instanceof Element)) {
    return { isInside: true, label: null, isNative: false };
  }
  if (!area.contains(target)) {
    return AWAY;
  }
  const label = labelOf(target, area);
  const isNative = isOverNativeTarget(target, area);
  return { isInside: true, label, isNative };
}

/** What lies under a point of the area. The drawn cursor lets every pointer through, so it is never the answer. */
function presenceAt(area: HTMLElement, x: number, y: number) {
  const box = area.getBoundingClientRect();
  const target = document.elementFromPoint(box.left + x, box.top + y);
  return presenceOf(target, area);
}

function isSamePresence(first: Presence, second: Presence) {
  const isSameSide = first.isInside === second.isInside;
  const isSameLabel = first.label === second.label;
  const isSameKind = first.isNative === second.isNative;
  return isSameSide && isSameLabel && isSameKind;
}

function keptOrNext(current: Presence, next: Presence) {
  if (isSamePresence(current, next)) {
    return current;
  }
  return next;
}

function writeFigure(element: HTMLElement, value: number) {
  const text = String(Math.round(value));
  if (element.textContent !== text) {
    element.textContent = text;
  }
}

function writeFlag(element: HTMLElement, name: string, isOn: boolean) {
  const value = String(isOn);
  if (element.dataset[name] !== value) {
    element.dataset[name] = value;
  }
}

function drawCursor(
  parts: CursorParts,
  values: readonly number[],
  size: AreaSize
) {
  const [x, y] = values;
  const left = hundredthsOf(x);
  const top = hundredthsOf(y);
  parts.point.style.transform = `translate3d(${left}px, ${top}px, 0)`;
  parts.column.style.transform = `translate3d(${left}px, 0, 0)`;
  parts.row.style.transform = `translate3d(0, ${top}px, 0)`;
  writeFigure(parts.across, x);
  writeFigure(parts.down, y);
  const isNearRight = x > size.width - FLIP_ACROSS_PX;
  const isNearBottom = y > size.height - FLIP_DOWN_PX;
  writeFlag(parts.point, 'flipAcross', isNearRight);
  writeFlag(parts.point, 'flipDown', isNearBottom);
}

function cursorKindOf(followsPointer: boolean, presence: Presence) {
  const isDrawn = presence.isInside && !presence.isNative;
  if (followsPointer && isDrawn) {
    return 'drawn';
  }
  return 'system';
}

function dotStateOf(isShown: boolean, hasLabel: boolean): DotState {
  if (!isShown) {
    return 'hidden';
  }
  if (hasLabel) {
    return 'grown';
  }
  return 'shown';
}

export type CursorAreaHandle = {
  /** Glides the drawn cursor to a place of the area, in shares of its width and height, for a demonstration. */
  glideTo: (across: number, down: number) => void;
  /** Hides the drawn cursor, as a pointer that left the area. */
  leave: () => void;
};

export type CursorAreaProps = {
  mode: CursorMode;
  /** Whose arrow it is, in the name mode. Their picture is drawn from the name. */
  name: string;
  /** The colour of the arrow, such as the series colour of the person. */
  color?: string;
  children: ReactNode;
  /** Moves the drawn cursor from outside, for a demonstration. */
  handleRef?: React.Ref<CursorAreaHandle>;
  className?: string;
};

/**
 * An area where the pointer is drawn: an arrow with a name, a dot that grows into the word of a
 * `data-cursor-label` target, or a crosshair with its coordinates. It trails the pointer on a light
 * spring. The system cursor stays over fields and `data-cursor='native'`, and everywhere on touch
 * screens, coarse pointers and under reduced motion.
 */
export function CursorArea({
  mode,
  name,
  color = 'var(--primary)',
  children,
  handleRef,
  className,
}: CursorAreaProps) {
  const areaRef = useRef<HTMLDivElement>(null);
  const pointRef = useRef<HTMLSpanElement>(null);
  const columnRef = useRef<HTMLSpanElement>(null);
  const rowRef = useRef<HTMLSpanElement>(null);
  const acrossRef = useRef<HTMLSpanElement>(null);
  const downRef = useRef<HTMLSpanElement>(null);
  const follower = useRef<Follower | null>(null);
  const arrival = useRef<number | undefined>(undefined);
  const [presence, setPresence] = useState<Presence>(AWAY);
  const [lastLabel, setLastLabel] = useState('');
  const isStill = usePrefersReducedMotion();
  const isFinePointer = useFinePointer();
  const followsPointer = isFinePointer && !isStill;

  useEffect(() => {
    const area = areaRef.current;
    const point = pointRef.current;
    const column = columnRef.current;
    const row = rowRef.current;
    const across = acrossRef.current;
    const down = downRef.current;
    const hasArea = area !== null;
    const hasPoint = point !== null;
    const hasLines = column !== null && row !== null;
    const hasFigures = across !== null && down !== null;
    const hasParts = hasArea && hasPoint && hasLines && hasFigures;
    if (!hasParts) {
      return;
    }
    const parts: CursorParts = { point, column, row, across, down };
    const size: AreaSize = {
      width: area.clientWidth,
      height: area.clientHeight,
    };
    const observer = new ResizeObserver(() => {
      size.width = area.clientWidth;
      size.height = area.clientHeight;
    });
    observer.observe(area);
    const created = createFollower(
      2,
      (values) => drawCursor(parts, values, size),
      { stiffness: POINTER_STIFFNESS, precision: PRECISION_PX }
    );
    follower.current = created;
    return () => {
      created.stop();
      observer.disconnect();
      window.clearTimeout(arrival.current);
      follower.current = null;
    };
  }, []);

  function show(next: Presence) {
    if (next.label !== null) {
      setLastLabel(next.label);
    }
    setPresence((current) => keptOrNext(current, next));
  }

  function moveTo(x: number, y: number, stiffness: number) {
    const current = follower.current;
    if (!current) {
      return;
    }
    if (!presence.isInside) {
      current.place([x, y]);
      return;
    }
    current.setStiffness(stiffness);
    current.follow([x, y]);
  }

  function leave() {
    window.clearTimeout(arrival.current);
    show(AWAY);
  }

  function followPointer(event: React.PointerEvent<HTMLDivElement>) {
    if (!followsPointer) {
      return;
    }
    if (event.pointerType === 'touch') {
      leave();
      return;
    }
    window.clearTimeout(arrival.current);
    const box = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - box.left;
    const y = event.clientY - box.top;
    moveTo(x, y, POINTER_STIFFNESS);
    show(presenceOf(event.target, event.currentTarget));
  }

  function leaveWithPointer() {
    if (followsPointer) {
      leave();
    }
  }

  function hideUnderFinger(event: React.PointerEvent<HTMLDivElement>) {
    const isFinger = event.pointerType === 'touch';
    if (followsPointer && isFinger) {
      leave();
    }
  }

  useImperativeHandle(handleRef, () => ({
    glideTo(acrossShare: number, downShare: number) {
      const area = areaRef.current;
      if (!area) {
        return;
      }
      window.clearTimeout(arrival.current);
      const x = acrossShare * area.clientWidth;
      const y = downShare * area.clientHeight;
      if (isStill) {
        follower.current?.place([x, y]);
        show(presenceAt(area, x, y));
        return;
      }
      moveTo(x, y, DEMO_STIFFNESS);
      show({ isInside: true, label: null, isNative: false });
      arrival.current = window.setTimeout(() => {
        show(presenceAt(area, x, y));
      }, ARRIVAL_MS);
    },
    leave,
  }));

  const isShown = presence.isInside && !presence.isNative;
  const hasLabel = presence.label !== null;
  const showsArrow = isShown && mode === 'name';
  const showsDot = isShown && mode === 'label';
  const showsLabel = showsDot && hasLabel;
  const showsCrosshair = isShown && mode === 'crosshair';
  const inkStyle: InkStyle = { '--cursor-ink': color };

  return (
    <div
      ref={areaRef}
      data-cursor={cursorKindOf(followsPointer, presence)}
      onPointerMove={followPointer}
      onPointerLeave={leaveWithPointer}
      onPointerDown={hideUnderFinger}
      className={cn(
        'relative isolate data-[cursor=drawn]:cursor-none data-[cursor=drawn]:**:cursor-none',
        className
      )}
    >
      {children}
      <div
        aria-hidden='true'
        style={inkStyle}
        className='pointer-events-none absolute inset-0 z-10 overflow-hidden rounded-[inherit]'
      >
        <span
          ref={columnRef}
          data-visible={showsCrosshair}
          className='bg-primary/45 absolute inset-y-0 left-0 w-px opacity-0 transition-opacity duration-150 data-[visible=true]:opacity-100'
        />
        <span
          ref={rowRef}
          data-visible={showsCrosshair}
          className='bg-primary/45 absolute inset-x-0 top-0 h-px opacity-0 transition-opacity duration-150 data-[visible=true]:opacity-100'
        />
        <span ref={pointRef} className='group/point absolute top-0 left-0'>
          <span
            data-visible={showsArrow}
            className='absolute top-0 left-0 opacity-0 transition-opacity duration-150 data-[visible=true]:opacity-100'
          >
            <svg
              width='16'
              height='21'
              viewBox='-1 -1 16 21'
              className='absolute -top-px -left-px'
            >
              <path
                d={ARROW_PATH}
                fill='var(--cursor-ink)'
                stroke='white'
                strokeWidth='1.25'
                strokeLinejoin='round'
              />
            </svg>
            <span className='surface-raised absolute top-[18px] left-3 flex h-6 items-center gap-1.5 rounded-full ps-0.5 pe-2 text-xs font-medium whitespace-nowrap group-data-[flip-across=true]/point:-translate-x-[calc(100%+1.25rem)] group-data-[flip-down=true]/point:-translate-y-[calc(100%+1.375rem)]'>
              <Avatar seed={name} className='size-5' />
              {name}
            </span>
          </span>
          <span
            data-dot={dotStateOf(showsDot, hasLabel)}
            className='bg-foreground absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0 transition-[opacity,scale] duration-150 ease-(--ease-out-strong) data-[dot=grown]:scale-[2.6] data-[dot=shown]:opacity-100'
          />
          <span
            data-visible={showsLabel}
            className='bg-foreground text-background absolute flex h-7 -translate-x-1/2 -translate-y-1/2 scale-75 items-center rounded-full px-3 text-xs font-medium whitespace-nowrap opacity-0 transition-[opacity,scale] duration-150 ease-(--ease-out-strong) data-[visible=true]:scale-100 data-[visible=true]:opacity-100'
          >
            <Swap swapKey={lastLabel}>{lastLabel}</Swap>
          </span>
          <span
            data-visible={showsCrosshair}
            className='bg-primary absolute size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0 transition-opacity duration-150 data-[visible=true]:opacity-100'
          />
          <span
            data-visible={showsCrosshair}
            className='surface-raised absolute top-2.5 left-2.5 flex h-5 items-center gap-1 rounded-md px-1.5 text-[11px] whitespace-nowrap tabular-nums opacity-0 transition-opacity duration-150 group-data-[flip-across=true]/point:-translate-x-[calc(100%+1.25rem)] group-data-[flip-down=true]/point:-translate-y-[calc(100%+1.25rem)] data-[visible=true]:opacity-100'
          >
            <span className='text-muted-foreground'>x</span>
            <span ref={acrossRef} className='min-w-[3ch] text-end' />
            <span className='text-muted-foreground ms-1'>y</span>
            <span ref={downRef} className='min-w-[3ch] text-end' />
          </span>
        </span>
      </div>
    </div>
  );
}

type BoardTile = {
  id: string;
  name: string;
  /** The word the cursor grows into over the tile: what a click does. */
  action: string;
  picture?: string;
};

type Waypoint = {
  across: number;
  down: number;
};

/** One beat of the demonstration: a change of mode, a glide to a place, or the cursor leaving the area. */
type DemoBeat =
  | { after: number; kind: 'mode'; mode: CursorMode }
  | { after: number; kind: 'glide'; place: Waypoint }
  | { after: number; kind: 'leave' };

const TILES: BoardTile[] = [
  {
    id: 'moodboard',
    name: 'Moodboard',
    action: 'View',
    picture: '/images/scenes/scene-06.svg',
  },
  { id: 'brief', name: 'Launch brief', action: 'Open' },
];

const MODES: Segment<CursorMode>[] = [
  { value: 'name', label: 'Name' },
  { value: 'label', label: 'Label' },
  { value: 'crosshair', label: 'Crosshair' },
];

const ROUND_MODES: CursorMode[] = ['name', 'label', 'crosshair'];

const ENTRY: Waypoint = { across: 0.12, down: 0.18 };

const OVER_PICTURE: Waypoint = { across: 0.28, down: 0.38 };

const OVER_BRIEF: Waypoint = { across: 0.73, down: 0.3 };

const OVER_FIELD: Waypoint = { across: 0.42, down: 0.87 };

const ON_THE_WAY_OUT: Waypoint = { across: 0.62, down: 0.62 };

/** Where the arrow rests under reduced motion: over the brief, as a colleague looking at it. */
const STILL_AT: Waypoint = { across: 0.66, down: 0.34 };

function roundOf(mode: CursorMode): DemoBeat[] {
  return [
    { after: 700, kind: 'mode', mode },
    { after: 300, kind: 'glide', place: ENTRY },
    { after: 900, kind: 'glide', place: OVER_PICTURE },
    { after: 1300, kind: 'glide', place: OVER_BRIEF },
    { after: 1300, kind: 'glide', place: OVER_FIELD },
    { after: 1300, kind: 'glide', place: ON_THE_WAY_OUT },
    { after: 1100, kind: 'leave' },
  ];
}

/** The same path in each mode: in from the corner, over the picture, over the brief, over the field, and out. */
const DEMO_BEATS: DemoBeat[] = ROUND_MODES.flatMap(roundOf);

function TileFace({ tile }: { tile: BoardTile }) {
  if (tile.picture) {
    return (
      <span
        aria-hidden='true'
        style={{ backgroundImage: `url(${tile.picture})` }}
        className='block aspect-[4/3] rounded-md bg-cover bg-center'
      />
    );
  }
  return (
    <span
      aria-hidden='true'
      className='bg-muted text-muted-foreground flex aspect-[4/3] items-center justify-center rounded-md'
    >
      <FileTextIcon className='size-5' />
    </span>
  );
}

type BoardTileButtonProps = {
  tile: BoardTile;
  isSelected: boolean;
  onToggle: () => void;
};

function BoardTileButton({ tile, isSelected, onToggle }: BoardTileButtonProps) {
  return (
    <button
      type='button'
      aria-pressed={isSelected}
      data-cursor-label={tile.action}
      onClick={onToggle}
      className='bg-card hairline-ring ring-border aria-pressed:ring-primary focus-visible:ring-ring focus-visible:ring-offset-background flex min-w-0 cursor-pointer flex-col gap-1.5 rounded-lg p-1.5 text-start shadow-[0_1px_2px_rgb(0_0_0/0.04)] transition-[scale,box-shadow] duration-150 ease-(--ease-out-strong) outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.97] aria-pressed:ring-[1.5px]'
    >
      <TileFace tile={tile} />
      <span className='truncate px-0.5 text-xs font-medium'>{tile.name}</span>
    </button>
  );
}

function toggledSelection(current: string | null, id: string) {
  if (current === id) {
    return null;
  }
  return id;
}

export default function Effect03() {
  const [mode, setMode] = useState<CursorMode>('name');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const area = useRef<CursorAreaHandle>(null);
  const isStill = usePrefersReducedMotion();
  const { isHovered, hoverHandlers } = useHover();
  const steps: AutoplayStep[] = DEMO_BEATS.map((beat) => ({
    after: beat.after,
    run: () => playBeat(beat),
  }));
  const { ref, isAutoplaying } = useAutoplay(steps, {
    loopAfter: 900,
    onReset: () => area.current?.leave(),
    isEnabled: !isHovered,
  });
  const isDemoStopped = !isAutoplaying && !isHovered;
  const leavesDemoCursor = isDemoStopped && !isStill;

  /** Once a person took over, the cursor the demonstration drew goes: their own pointer draws it from now on. */
  useEffect(() => {
    if (leavesDemoCursor) {
      area.current?.leave();
    }
  }, [leavesDemoCursor]);

  useEffect(() => {
    if (isStill) {
      area.current?.glideTo(STILL_AT.across, STILL_AT.down);
    }
  }, [isStill]);

  function playBeat(beat: DemoBeat) {
    if (beat.kind === 'mode') {
      setMode(beat.mode);
      return;
    }
    if (beat.kind === 'glide') {
      area.current?.glideTo(beat.place.across, beat.place.down);
      return;
    }
    area.current?.leave();
  }

  function toggleTile(id: string) {
    setSelectedId((current) => toggledSelection(current, id));
  }

  return (
    <div
      ref={ref}
      className='flex w-full max-w-[22rem] flex-col items-center gap-3'
    >
      <div className='w-full' {...hoverHandlers}>
        <CursorArea
          handleRef={area}
          mode={mode}
          name='Ines Duarte'
          color={seriesColorOf(2)}
          className='bg-foreground/[0.04] rounded-xl'
        >
          <div className='grid grid-cols-2 gap-2 p-2.5'>
            {TILES.map((tile) => (
              <BoardTileButton
                key={tile.id}
                tile={tile}
                isSelected={selectedId === tile.id}
                onToggle={() => toggleTile(tile.id)}
              />
            ))}
            <Input
              aria-label='Comment on the board'
              placeholder='Leave a comment'
              className='col-span-2'
            />
          </div>
        </CursorArea>
      </div>
      <Segments
        value={mode}
        segments={MODES}
        onValueChange={setMode}
        label='Cursor'
      />
    </div>
  );
}
