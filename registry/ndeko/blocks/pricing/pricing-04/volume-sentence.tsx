'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useRef, useState } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { rowPresenceOf } from '@/registry/ndeko/lib/motion-presets';

import { SECTION } from './data';
import {
  formatVolume,
  positionOf,
  stopAbove,
  stopBelow,
  volumeAt,
} from './volume-model';

/** How far the pointer travels to reach the next stop when it drags the number. */
const PX_PER_STOP = 8;

/** Under this distance a press on the number is a click, and the click opens it for typing. */
const DRAG_THRESHOLD_PX = 4;

/** Room for "10,000,000" and one key more: a longer entry would push the sentence past the width of a phone. */
const MAX_TYPED_CHARACTERS = 11;

type DragStart = {
  x: number;
  position: number;
};

function describedByOf(isOverLimit: boolean, hintId: string) {
  if (isOverLimit) {
    return hintId;
  }
  return undefined;
}

function scrubbingOf(isScrubbing: boolean) {
  if (isScrubbing) {
    return 'true';
  }
  return undefined;
}

function isPrimaryPress(event: React.PointerEvent<HTMLInputElement>) {
  return event.button === 0;
}

/** A press let go outside the number never reaches its pointerup: the next move finds no button down. */
function isReleased(event: React.PointerEvent<HTMLInputElement>) {
  return event.buttons === 0;
}

function isFocused(element: HTMLElement) {
  return document.activeElement === element;
}

/** A press on the number while it is not being typed in may become a drag: no caret, no focus yet. */
function keepFocusAway(event: React.MouseEvent<HTMLInputElement>) {
  if (isFocused(event.currentTarget)) {
    return;
  }
  event.preventDefault();
}

type VolumeSentenceProps = {
  volume: number;
  /** What is typed in the number, while a person or the demonstration types; null shows the volume. */
  draft: string | null;
  isOverLimit: boolean;
  /** The demonstration drags the number: it wears the look of a hand on it. */
  isDemoScrubbing: boolean;
  hintId: string;
  onType: (text: string) => void;
  onCommit: () => void;
  onScrub: (volume: number) => void;
};

/**
 * "I expect 12,000 requests a month". The number is a field: drag it sideways to scrub through the
 * stops, click it to type, Up and Down step from stop to stop, Escape puts back what was there.
 * The field takes the width of a hidden copy of its text, so it is given no width of its own.
 */
export function VolumeSentence({
  volume,
  draft,
  isOverLimit,
  isDemoScrubbing,
  hintId,
  onType,
  onCommit,
  onScrub,
}: VolumeSentenceProps) {
  const [isScrubbing, setIsScrubbing] = useState(false);
  const dragStart = useRef<DragStart | null>(null);
  const hasDragged = useRef(false);
  const volumeAtFocus = useRef(volume);
  const shouldReduceMotion = usePrefersReducedMotion();
  const presence = rowPresenceOf(shouldReduceMotion);
  const formatted = formatVolume(volume);
  const shownText = draft ?? formatted;
  const isHandOnNumber = isScrubbing || isDemoScrubbing;

  function startDrag(event: React.PointerEvent<HTMLInputElement>) {
    if (!isPrimaryPress(event)) {
      return;
    }
    if (isFocused(event.currentTarget)) {
      return;
    }
    const position = positionOf(volume);
    dragStart.current = { x: event.clientX, position };
    hasDragged.current = false;
  }

  function drag(event: React.PointerEvent<HTMLInputElement>) {
    const start = dragStart.current;
    if (!start) {
      return;
    }
    if (isReleased(event)) {
      cancelDrag();
      return;
    }
    const travelled = event.clientX - start.x;
    const distance = Math.abs(travelled);
    const isStillAClick = !hasDragged.current && distance < DRAG_THRESHOLD_PX;
    if (isStillAClick) {
      return;
    }
    if (!hasDragged.current) {
      hasDragged.current = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      setIsScrubbing(true);
    }
    const stops = travelled / PX_PER_STOP;
    const position = start.position + stops;
    const next = volumeAt(position);
    if (next !== volume) {
      onScrub(next);
    }
  }

  function endDrag(event: React.PointerEvent<HTMLInputElement>) {
    const start = dragStart.current;
    dragStart.current = null;
    if (!start) {
      return;
    }
    if (hasDragged.current) {
      setIsScrubbing(false);
      return;
    }
    const input = event.currentTarget;
    input.focus();
    input.select();
  }

  function cancelDrag() {
    dragStart.current = null;
    setIsScrubbing(false);
  }

  function rememberVolume(event: React.FocusEvent<HTMLInputElement>) {
    volumeAtFocus.current = volume;
    event.currentTarget.select();
  }

  function type(event: React.ChangeEvent<HTMLInputElement>) {
    onType(event.currentTarget.value);
  }

  function pressKey(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      onScrub(stopAbove(volume));
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      onScrub(stopBelow(volume));
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      onCommit();
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      onScrub(volumeAtFocus.current);
      onCommit();
    }
  }

  return (
    <div className='flex flex-col'>
      <p className='text-3xl leading-tight font-semibold text-balance @2xl:text-4xl @4xl:text-5xl'>
        I expect{' '}
        <span className='relative inline-grid align-baseline'>
          <span
            aria-hidden='true'
            className='invisible col-start-1 row-start-1 px-2 whitespace-pre tabular-nums'
          >
            {shownText}
          </span>
          <input
            type='text'
            size={1}
            maxLength={MAX_TYPED_CHARACTERS}
            inputMode='numeric'
            autoComplete='off'
            spellCheck={false}
            aria-label='Requests you expect each month'
            aria-describedby={describedByOf(isOverLimit, hintId)}
            data-scrubbing={scrubbingOf(isHandOnNumber)}
            value={shownText}
            onChange={type}
            onFocus={rememberVolume}
            onBlur={onCommit}
            onKeyDown={pressKey}
            onMouseDown={keepFocusAway}
            onPointerDown={startDrag}
            onPointerMove={drag}
            onPointerUp={endDrag}
            onPointerCancel={cancelDrag}
            className='bg-primary/10 text-primary-ink hover:bg-primary/15 focus-visible:ring-ring/25 data-scrubbing:bg-primary/20 col-start-1 row-start-1 w-full min-w-0 cursor-ew-resize touch-pan-y rounded-xl px-2 tabular-nums transition-[background-color,box-shadow] duration-150 outline-none focus:cursor-text focus-visible:ring-[3px]'
          />
        </span>{' '}
        requests a month
      </p>
      <AnimatePresence initial={false}>
        {isOverLimit && (
          <motion.p
            key='over'
            id={hintId}
            {...presence}
            className='text-warning-foreground overflow-hidden text-[13px] text-pretty'
          >
            <span className='block pt-3'>{SECTION.over}</span>
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
