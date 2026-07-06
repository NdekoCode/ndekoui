'use client';

import { useRef, type CSSProperties } from 'react';

import { WordRoll } from '@/components/core/word-roll';
import { pressedQuietOf } from '@/registry/ndeko/lib/demonstration';
import { cn } from '@/registry/ndeko/lib/utils';

import { EFFORT_WORD, EFFORT_WORDS, EFFORTS, type Effort } from './data';

const CELL_PX = 16;

const PAD_PX = 4;

const RING_PX = 20;

const DOT_SIZE: Record<Effort, string> = {
  1: 'size-1',
  2: 'size-1.5',
  3: 'size-2',
  4: 'size-2.5',
  5: 'size-3',
};

type RampStyle = CSSProperties & { '--ring-x': string };

function effortOf(position: number): Effort {
  const rounded = Math.round(position);
  const bounded = Math.min(EFFORTS.length, Math.max(1, rounded));
  return EFFORTS[bounded - 1];
}

function isRtl(element: HTMLElement) {
  return getComputedStyle(element).direction === 'rtl';
}

function effortAtPointer(element: HTMLElement, clientX: number) {
  const rect = element.getBoundingClientRect();
  let offset = clientX - rect.left;
  if (isRtl(element)) {
    offset = rect.right - clientX;
  }
  const position = (offset - PAD_PX) / CELL_PX + 0.5;
  return effortOf(position);
}

function forwardKeyOf(isFlipped: boolean) {
  if (isFlipped) {
    return 'ArrowLeft';
  }
  return 'ArrowRight';
}

function backKeyOf(isFlipped: boolean) {
  if (isFlipped) {
    return 'ArrowRight';
  }
  return 'ArrowLeft';
}

function effortAfterKey(
  event: React.KeyboardEvent<HTMLElement>,
  current: Effort
): Effort | null {
  const isFlipped = isRtl(event.currentTarget);
  const forwardKey = forwardKeyOf(isFlipped);
  const backKey = backKeyOf(isFlipped);
  if (event.key === forwardKey || event.key === 'ArrowUp') {
    return effortOf(current + 1);
  }
  if (event.key === backKey || event.key === 'ArrowDown') {
    return effortOf(current - 1);
  }
  if (event.key === 'Home') {
    return effortOf(1);
  }
  if (event.key === 'End') {
    return effortOf(EFFORTS.length);
  }
  return null;
}

function dotToneOf(isFilled: boolean) {
  if (isFilled) {
    return 'bg-primary';
  }
  return 'bg-foreground/20';
}

function dotScaleOf(isCurrent: boolean) {
  if (isCurrent) {
    return 'scale-125';
  }
  return undefined;
}

function ringStyleOf(effort: Effort) {
  const cellStart = PAD_PX + (effort - 1) * CELL_PX;
  const centring = (CELL_PX - RING_PX) / 2;
  const x = cellStart + centring;
  const style: RampStyle = { '--ring-x': `${x}px` };
  return style;
}

type EffortRampProps = {
  value: Effort;
  isPressed: boolean;
  onValueChange: (effort: Effort) => void;
};

export function EffortRamp({
  value,
  isPressed,
  onValueChange,
}: EffortRampProps) {
  const isDragging = useRef(false);
  const word = EFFORT_WORD[value];

  function change(next: Effort) {
    if (next !== value) {
      onValueChange(next);
    }
  }

  function startDrag(event: React.PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    isDragging.current = true;
    change(effortAtPointer(event.currentTarget, event.clientX));
  }

  function drag(event: React.PointerEvent<HTMLDivElement>) {
    if (!isDragging.current) {
      return;
    }
    change(effortAtPointer(event.currentTarget, event.clientX));
  }

  function endDrag() {
    isDragging.current = false;
  }

  function changeFromKeys(event: React.KeyboardEvent<HTMLDivElement>) {
    const next = effortAfterKey(event, value);
    if (next === null) {
      return;
    }
    event.preventDefault();
    change(next);
  }

  return (
    <div className='flex items-center gap-1'>
      <div
        role='slider'
        tabIndex={0}
        aria-label='Effort'
        aria-valuemin={1}
        aria-valuemax={EFFORTS.length}
        aria-valuenow={value}
        aria-valuetext={word}
        data-effort
        onPointerDown={startDrag}
        onPointerMove={drag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={changeFromKeys}
        style={ringStyleOf(value)}
        className={cn(
          'focus-visible:ring-ring/25 relative flex h-7 cursor-pointer touch-none items-center rounded-full px-1 transition-[scale,background-color] duration-150 outline-none select-none focus-visible:ring-[3px]',
          pressedQuietOf(isPressed)
        )}
      >
        <span
          aria-hidden='true'
          className='ring-primary/35 pointer-events-none absolute start-0 top-1/2 -mt-2.5 size-5 translate-x-(--ring-x) rounded-full ring-2 transition-[translate] duration-200 ease-(--ease-out-strong) rtl:-translate-x-(--ring-x)'
        />
        {EFFORTS.map((level) => (
          <span
            key={level}
            aria-hidden='true'
            className='relative flex h-7 w-4 items-center justify-center'
          >
            <span
              className={cn(
                'rounded-full transition-[background-color,scale] duration-150 ease-(--ease-out-strong)',
                DOT_SIZE[level],
                dotToneOf(level <= value),
                dotScaleOf(level === value)
              )}
            />
          </span>
        ))}
      </div>
      <span
        aria-hidden='true'
        className='text-muted-foreground hidden text-xs @md:inline'
      >
        <WordRoll text={word} labels={EFFORT_WORDS} />
      </span>
    </div>
  );
}
