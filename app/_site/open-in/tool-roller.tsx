'use client';

import { AnimatePresence, motion } from 'motion/react';
import {
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type RefObject,
} from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';

import {
  ChatGptMark,
  ClaudeMark,
  CursorMark,
  LovableMark,
  V0Mark,
} from './tool-marks';

type Tool = {
  id: string;
  /** Left out when the mark already spells the name, as v0's does. */
  name?: string;
  Mark: ComponentType<{ className?: string }>;
};

const TOOLS: Tool[] = [
  { id: 'v0', Mark: V0Mark },
  { id: 'lovable', name: 'Lovable', Mark: LovableMark },
  { id: 'cursor', name: 'Cursor', Mark: CursorMark },
  { id: 'claude', name: 'Claude', Mark: ClaudeMark },
  { id: 'chatgpt', name: 'ChatGPT', Mark: ChatGptMark },
];

/** The first turn comes soon after the pointer arrives, so a short visit already shows a second builder. */
const FIRST_TURN_MS = 350;

const TURN_MS = 1600;

const ENTER = { y: '110%', opacity: 0, filter: 'blur(4px)' };
const SHOWN = { y: '0%', opacity: 1, filter: 'blur(0px)' };
const LEAVE = { y: '-110%', opacity: 0, filter: 'blur(4px)' };
const ENTER_TIMING = { duration: 0.28, ease: [0.22, 1, 0.36, 1] } as const;
const LEAVE_TIMING = { duration: 0.2, ease: [0.4, 0, 1, 1] } as const;

function nextIndexOf(index: number) {
  return (index + 1) % TOOLS.length;
}

/** The card a roller belongs to: its tile, or its own button where it stands alone in a bar. */
function cardOf(roller: HTMLElement) {
  const tile = roller.closest<HTMLElement>('article');
  if (tile) {
    return tile;
  }
  const button = roller.closest<HTMLElement>('button');
  return button ?? roller;
}

/** A finger has no hover: a tap would leave the label turning until the next tap elsewhere. */
function isHoveringPointer(event: PointerEvent) {
  return event.pointerType !== 'touch';
}

function useCardHover(rollerRef: RefObject<HTMLElement | null>) {
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const roller = rollerRef.current;
    if (!roller) {
      return;
    }
    const card = cardOf(roller);

    function enter(event: PointerEvent) {
      if (isHoveringPointer(event)) {
        setIsHovered(true);
      }
    }

    function leave() {
      setIsHovered(false);
    }

    card.addEventListener('pointerenter', enter);
    card.addEventListener('pointerleave', leave);
    return () => {
      card.removeEventListener('pointerenter', enter);
      card.removeEventListener('pointerleave', leave);
    };
  }, [rollerRef]);

  return isHovered;
}

/** Turns to the next builder for as long as it is asked to, and stays on the last one shown. */
function useTurningIndex(isTurning: boolean) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!isTurning) {
      return;
    }
    let timer = window.setTimeout(turn, FIRST_TURN_MS);

    function turn() {
      setIndex(nextIndexOf);
      timer = window.setTimeout(turn, TURN_MS);
    }

    return () => window.clearTimeout(timer);
  }, [isTurning]);

  return index;
}

const NAME_CLASS = 'hidden @sm/tile-header:inline';

function ToolLabel({ tool }: { tool: Tool }) {
  const { Mark, name } = tool;
  return (
    <>
      <Mark className='size-4' />
      {name && <span className={NAME_CLASS}>{name}</span>}
    </>
  );
}

/**
 * The builders the Open in menu reaches, one at a time, while the pointer is on the card: each
 * leaves upwards with a blur while the next rises in, and the button eases to the new width. A card
 * nobody points at keeps still. The name shows when the header has room; a narrow tile keeps the
 * mark alone.
 */
export function ToolRoller() {
  const rollerRef = useRef<HTMLSpanElement>(null);
  const isCardHovered = useCardHover(rollerRef);
  const prefersReducedMotion = usePrefersReducedMotion();
  const isTurning = isCardHovered && !prefersReducedMotion;
  const index = useTurningIndex(isTurning);
  const tool = TOOLS[index];

  return (
    <span ref={rollerRef} className='inline-flex'>
      <AnimatedSize axis='width' as='span' aria-hidden='true'>
        <span className='inline-grid overflow-hidden'>
          <AnimatePresence initial={false}>
            <motion.span
              key={tool.id}
              className='col-start-1 row-start-1 flex items-center gap-1.5'
              initial={ENTER}
              animate={{ ...SHOWN, transition: ENTER_TIMING }}
              exit={{ ...LEAVE, transition: LEAVE_TIMING }}
            >
              <ToolLabel tool={tool} />
            </motion.span>
          </AnimatePresence>
        </span>
      </AnimatedSize>
    </span>
  );
}
