'use client';

import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type Ref,
} from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { cn } from '@/registry/ndeko/lib/utils';

import {
  hexSpiralOf,
  neighborIndexOf,
  reachOf,
  type Cell,
  type EmojiItem,
} from './emoji-data';

export const FIELD_DIAMETER_PX = 272;

const RADIUS_PX = FIELD_DIAMETER_PX / 2;
const SPACING_PX = 46;
const ITEM_PX = 36;
const DRAG_THRESHOLD_PX = 5;
const REPACK_MS = 340;
const RESTING_SPEED = 0.02;
const COMFORT_SHARE = 0.55;
const KEY_LANDING_SHARE = 0.3;

const ARROW_DIRECTIONS: Record<string, Cell> = {
  ArrowRight: { x: 1, y: 0 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowDown: { x: 0, y: 1 },
  ArrowUp: { x: 0, y: -1 },
};

type Motion = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  target: Cell | null;
  frame: number;
  lastTime: number;
};

type Drag = {
  startX: number;
  startY: number;
  lastX: number;
  lastY: number;
  lastTime: number;
  hasMoved: boolean;
};

export type EmojiFieldHandle = {
  glideTo: (char: string) => void;
  pick: (char: string) => void;
  focusFirst: () => void;
};

function swellOf(distance: number) {
  const share = Math.min(1, distance / RADIUS_PX);
  return 1.35 - 0.9 * share;
}

function fadeOf(distance: number) {
  const past = (distance - RADIUS_PX * 0.7) / (RADIUS_PX * 0.4);
  const share = Math.min(1, Math.max(0, past));
  return 1 - share * 0.65;
}

function withinReach(x: number, y: number, reach: number) {
  const distance = Math.hypot(x, y);
  if (distance <= reach) {
    return { x, y, isOut: false };
  }
  const shrink = reach / distance;
  return { x: x * shrink, y: y * shrink, isOut: true };
}

function tabIndexOf(isActive: boolean) {
  if (isActive) {
    return 0;
  }
  return -1;
}

type EmojiFieldProps = {
  items: EmojiItem[];
  query: string;
  onPick: (item: EmojiItem, from: DOMRect) => void;
  handleRef?: Ref<EmojiFieldHandle>;
  className?: string;
};

export function EmojiField({
  items,
  query,
  onPick,
  handleRef,
  className,
}: EmojiFieldProps) {
  const fieldRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const cellsRef = useRef<Cell[]>([]);
  const motion = useRef<Motion>({
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    target: null,
    frame: 0,
    lastTime: 0,
  });
  const drag = useRef<Drag | null>(null);
  const cells = useMemo(
    () => hexSpiralOf(items.length, SPACING_PX),
    [items.length]
  );
  const [activeChar, setActiveChar] = useState('');
  const focusableChar = focusableCharOf(items, activeChar);
  const prefersReducedMotion = usePrefersReducedMotion();

  const paint = useCallback(() => {
    const placed = cellsRef.current;
    const { x: offsetX, y: offsetY } = motion.current;
    placed.forEach((cell, index) => {
      const element = itemRefs.current[index];
      if (!element) {
        return;
      }
      const x = cell.x + offsetX;
      const y = cell.y + offsetY;
      const distance = Math.hypot(x, y);
      const scale = swellOf(distance);
      element.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
      element.style.opacity = String(fadeOf(distance));
    });
  }, []);

  const advance = useCallback(
    (now: number) => {
      const state = motion.current;
      const elapsed = Math.min(now - state.lastTime, 32);
      state.lastTime = now;
      const reach = reachOf(cellsRef.current);
      let isMoving = false;
      if (state.target) {
        const follow = 1 - Math.exp(-elapsed / 110);
        state.x += (state.target.x - state.x) * follow;
        state.y += (state.target.y - state.y) * follow;
        const gap = Math.hypot(
          state.target.x - state.x,
          state.target.y - state.y
        );
        isMoving = gap > 0.4;
        if (!isMoving) {
          state.x = state.target.x;
          state.y = state.target.y;
          state.target = null;
        }
      } else {
        state.x += state.vx * elapsed;
        state.y += state.vy * elapsed;
        const decay = Math.exp(-elapsed / 360);
        state.vx *= decay;
        state.vy *= decay;
        const speed = Math.hypot(state.vx, state.vy);
        isMoving = speed > RESTING_SPEED;
      }
      const kept = withinReach(state.x, state.y, reach);
      state.x = kept.x;
      state.y = kept.y;
      if (kept.isOut) {
        state.vx = 0;
        state.vy = 0;
      }
      paint();
      return isMoving;
    },
    [paint]
  );

  const startLoop = useCallback(() => {
    const state = motion.current;
    if (state.frame !== 0) {
      return;
    }
    state.lastTime = performance.now();

    function frame(now: number) {
      const isMoving = advance(now);
      if (isMoving) {
        state.frame = requestAnimationFrame(frame);
        return;
      }
      state.frame = 0;
    }

    state.frame = requestAnimationFrame(frame);
  }, [advance]);

  useLayoutEffect(() => {
    cellsRef.current = cells;
    const state = motion.current;
    const field = fieldRef.current;
    state.x = 0;
    state.y = 0;
    state.vx = 0;
    state.vy = 0;
    state.target = null;
    if (field) {
      field.dataset.repack = 'true';
    }
    paint();
    const timer = window.setTimeout(() => {
      if (field) {
        delete field.dataset.repack;
      }
    }, REPACK_MS);
    return () => window.clearTimeout(timer);
  }, [items, cells, paint]);

  useEffect(() => {
    const state = motion.current;
    return () => cancelAnimationFrame(state.frame);
  }, []);

  function offsetToLand(index: number) {
    const cell = cellsRef.current[index];
    const state = motion.current;
    const x = cell.x + state.x;
    const y = cell.y + state.y;
    const distance = Math.hypot(x, y);
    if (distance <= RADIUS_PX * COMFORT_SHARE) {
      return null;
    }
    const landing = (RADIUS_PX * KEY_LANDING_SHARE) / distance;
    return { x: state.x + x * landing - x, y: state.y + y * landing - y };
  }

  /** With reduced motion the field lands where it was going at once, instead of gliding there. */
  function landAt(target: Cell) {
    const state = motion.current;
    const reach = reachOf(cellsRef.current);
    const kept = withinReach(target.x, target.y, reach);
    state.x = kept.x;
    state.y = kept.y;
    state.vx = 0;
    state.vy = 0;
    state.target = null;
    paint();
  }

  function travelTo(target: Cell) {
    if (prefersReducedMotion) {
      landAt(target);
      return;
    }
    motion.current.target = target;
    startLoop();
  }

  function glideTo(index: number) {
    const target = offsetToLand(index);
    if (target === null) {
      return;
    }
    travelTo(target);
  }

  function pickAt(index: number) {
    const element = itemRefs.current[index];
    const item = items[index];
    if (!element || !item) {
      return;
    }
    onPick(item, element.getBoundingClientRect());
  }

  useImperativeHandle(handleRef, () => ({
    glideTo(char: string) {
      const index = items.findIndex((item) => item.char === char);
      if (index === -1) {
        return;
      }
      const cell = cellsRef.current[index];
      travelTo({ x: -cell.x * 0.7, y: -cell.y * 0.7 });
    },
    pick(char: string) {
      const index = items.findIndex((item) => item.char === char);
      pickAt(index);
    },
    focusFirst() {
      itemRefs.current[0]?.focus({ preventScroll: true });
    },
  }));

  function startDrag(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) {
      return;
    }
    drag.current = {
      startX: event.clientX,
      startY: event.clientY,
      lastX: event.clientX,
      lastY: event.clientY,
      lastTime: event.timeStamp,
      hasMoved: false,
    };
  }

  function moveDrag(event: PointerEvent<HTMLDivElement>) {
    const current = drag.current;
    if (!current) {
      return;
    }
    const travel = Math.hypot(
      event.clientX - current.startX,
      event.clientY - current.startY
    );
    if (!current.hasMoved && travel < DRAG_THRESHOLD_PX) {
      return;
    }
    const state = motion.current;
    if (!current.hasMoved) {
      current.hasMoved = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      state.target = null;
      state.vx = 0;
      state.vy = 0;
    }
    const elapsed = Math.max(1, event.timeStamp - current.lastTime);
    const dx = event.clientX - current.lastX;
    const dy = event.clientY - current.lastY;
    state.vx = state.vx * 0.5 + (dx / elapsed) * 0.5;
    state.vy = state.vy * 0.5 + (dy / elapsed) * 0.5;
    const reach = reachOf(cellsRef.current);
    const kept = withinReach(state.x + dx, state.y + dy, reach);
    state.x = kept.x;
    state.y = kept.y;
    current.lastX = event.clientX;
    current.lastY = event.clientY;
    current.lastTime = event.timeStamp;
    paint();
  }

  function endDrag(event: PointerEvent<HTMLDivElement>) {
    const current = drag.current;
    drag.current = null;
    if (!current || !current.hasMoved) {
      return;
    }
    const idleMs = event.timeStamp - current.lastTime;
    const isResting = idleMs > 90;
    if (isResting || prefersReducedMotion) {
      motion.current.vx = 0;
      motion.current.vy = 0;
    }
    if (prefersReducedMotion) {
      return;
    }
    startLoop();
  }

  function moveFocus(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const lastIndex = items.length - 1;
    let next = -1;
    const direction = ARROW_DIRECTIONS[event.key];
    if (direction) {
      next = neighborIndexOf(cellsRef.current, index, direction.x, direction.y);
    }
    if (event.key === 'Home') {
      next = 0;
    }
    if (event.key === 'End') {
      next = lastIndex;
    }
    if (next === -1) {
      return;
    }
    event.preventDefault();
    setActiveChar(items[next].char);
    itemRefs.current[next]?.focus({ preventScroll: true });
    glideTo(next);
  }

  const isEmpty = items.length === 0;

  return (
    <div
      ref={fieldRef}
      role='group'
      aria-label='Emoji'
      onPointerDown={startDrag}
      onPointerMove={moveDrag}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      className={cn(
        'group/field bg-foreground/[0.04] relative shrink-0 touch-none overflow-hidden rounded-full select-none',
        className
      )}
      style={{ width: FIELD_DIAMETER_PX, height: FIELD_DIAMETER_PX }}
    >
      {items.map((item, index) => (
        <button
          key={item.char}
          ref={(element) => {
            itemRefs.current[index] = element;
          }}
          type='button'
          aria-label={item.name}
          tabIndex={tabIndexOf(item.char === focusableChar)}
          onClick={() => pickAt(index)}
          onKeyDown={(event) => moveFocus(event, index)}
          onFocus={() => setActiveChar(item.char)}
          className={cn(
            'focus-visible:ring-ring absolute top-1/2 left-1/2 flex cursor-pointer items-center justify-center rounded-full text-xl outline-none focus-visible:ring-2',
            'group-data-[repack=true]/field:transition-[transform,opacity] group-data-[repack=true]/field:duration-300 group-data-[repack=true]/field:ease-(--ease-out-strong)'
          )}
          style={{
            width: ITEM_PX,
            height: ITEM_PX,
            marginLeft: -ITEM_PX / 2,
            marginTop: -ITEM_PX / 2,
          }}
        >
          {item.char}
        </button>
      ))}
      {isEmpty && (
        <p className='text-muted-foreground absolute inset-0 flex items-center justify-center px-12 text-center text-[13px]'>
          No emoji for {'“'}
          {query.trim()}
          {'”'}
        </p>
      )}
    </div>
  );
}

function focusableCharOf(items: EmojiItem[], activeChar: string) {
  const isShown = items.some((item) => item.char === activeChar);
  if (isShown) {
    return activeChar;
  }
  return items[0]?.char ?? '';
}
