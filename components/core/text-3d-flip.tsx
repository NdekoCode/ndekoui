'use client';
import { cn } from '@/lib/utils';
import { useReducedMotion } from 'motion/react';
import {
  Fragment,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
  type RefObject,
} from 'react';

export type Text3DFlipDirection = 'up' | 'down' | 'left' | 'right';

export type Text3DFlipStaggerFrom =
  'first' | 'last' | 'center' | 'random' | number;

type Turn = {
  front: string;
  back: string;
  origin: string;
};

type Letter = {
  character: string;
  index: number;
};

type Word = {
  letters: Letter[];
};

type FaceStyles = {
  front: CSSProperties;
  back: CSSProperties;
};

type Timing = {
  duration: number;
  delay: number;
};

/**
 * Each letter is the front of a small cube: the axis sits half a line (or half a letter) behind
 * the text, so the face that leaves and the face that arrives turn together like one block.
 */
const VERTICAL_ORIGIN = '50% 50% -0.5lh';

const HORIZONTAL_ORIGIN = '50% 50% -0.3em';

const TURNS: Record<Text3DFlipDirection, Turn> = {
  up: {
    front: 'rotateX(90deg)',
    back: 'rotateX(-90deg)',
    origin: VERTICAL_ORIGIN,
  },
  down: {
    front: 'rotateX(-90deg)',
    back: 'rotateX(90deg)',
    origin: VERTICAL_ORIGIN,
  },
  left: {
    front: 'rotateY(-90deg)',
    back: 'rotateY(90deg)',
    origin: HORIZONTAL_ORIGIN,
  },
  right: {
    front: 'rotateY(90deg)',
    back: 'rotateY(-90deg)',
    origin: HORIZONTAL_ORIGIN,
  },
};

const RESTING = 'none';

const EASE_OUT_STRONG = 'cubic-bezier(0.23, 1, 0.32, 1)';

const RETURN_SPEED = 0.7;

const RETURN_STAGGER = 0.6;

const FADE_MS = 150;

const INTERACTIVE_ANCESTOR = [
  'a[href]',
  'button',
  'summary',
  'label',
  '[role="button"]',
  '[role="link"]',
  '[role="tab"]',
  '[role="menuitem"]',
  '[role="option"]',
].join(', ');

function wordsOf(text: string): Word[] {
  const words: Word[] = [];
  let index = 0;
  for (const part of text.split(' ')) {
    const letters: Letter[] = [];
    for (const character of Array.from(part)) {
      letters.push({ character, index });
      index += 1;
    }
    words.push({ letters });
  }
  return words;
}

function letterCountOf(words: readonly Word[]) {
  let count = 0;
  for (const word of words) {
    count += word.letters.length;
  }
  return count;
}

/** A fixed shuffle, so the server and the browser agree on the order. */
function shuffledRankOf(index: number, count: number) {
  const position = index + 1;
  const angle = position * 12.9898;
  const sine = Math.sin(angle);
  const wave = sine * 43758.5453;
  const whole = Math.floor(wave);
  const fraction = wave - whole;
  const lastIndex = count - 1;
  const spread = Math.max(lastIndex, 0);
  return fraction * spread;
}

function rankOf(index: number, count: number, from: Text3DFlipStaggerFrom) {
  const lastIndex = count - 1;
  if (typeof from === 'number') {
    return Math.abs(index - from);
  }
  if (from === 'last') {
    return lastIndex - index;
  }
  if (from === 'center') {
    const middle = lastIndex / 2;
    return Math.abs(index - middle);
  }
  if (from === 'random') {
    return shuffledRankOf(index, count);
  }
  return index;
}

function timingOf(
  rank: number,
  isFlipped: boolean,
  duration: number,
  stagger: number
): Timing {
  if (isFlipped) {
    const delay = rank * stagger;
    return { duration, delay };
  }
  const returnDuration = duration * RETURN_SPEED;
  const returnStagger = stagger * RETURN_STAGGER;
  const returnDelay = rank * returnStagger;
  return { duration: returnDuration, delay: returnDelay };
}

function millisecondsOf(seconds: number) {
  const milliseconds = seconds * 1000;
  return Math.round(milliseconds);
}

function transitionOf(property: string, timing: Timing) {
  const durationMs = millisecondsOf(timing.duration);
  const delayMs = millisecondsOf(timing.delay);
  return `${property} ${durationMs}ms ${EASE_OUT_STRONG} ${delayMs}ms`;
}

function frontTransformOf(turn: Turn, isFlipped: boolean) {
  if (isFlipped) {
    return turn.front;
  }
  return RESTING;
}

function backTransformOf(turn: Turn, isFlipped: boolean) {
  if (isFlipped) {
    return RESTING;
  }
  return turn.back;
}

function turningStylesOf(
  turn: Turn,
  isFlipped: boolean,
  timing: Timing
): FaceStyles {
  const transition = transitionOf('transform', timing);
  return {
    front: {
      transform: frontTransformOf(turn, isFlipped),
      transformOrigin: turn.origin,
      transition,
    },
    back: {
      transform: backTransformOf(turn, isFlipped),
      transformOrigin: turn.origin,
      transition,
    },
  };
}

function frontOpacityOf(isFlipped: boolean) {
  if (isFlipped) {
    return 0;
  }
  return 1;
}

function backOpacityOf(isFlipped: boolean) {
  if (isFlipped) {
    return 1;
  }
  return 0;
}

function fadingStylesOf(isFlipped: boolean): FaceStyles {
  const transition = `opacity ${FADE_MS}ms ${EASE_OUT_STRONG}`;
  return {
    front: { opacity: frontOpacityOf(isFlipped), transition },
    back: { opacity: backOpacityOf(isFlipped), transition },
  };
}

function isTouchPointer(event: PointerEvent) {
  return event.pointerType === 'touch';
}

function isKeyboardFocus(event: FocusEvent) {
  const target = event.target;
  if (!(target instanceof Element)) {
    return false;
  }
  return target.matches(':focus-visible');
}

/**
 * Hover and keyboard focus of the link or button the text sits in. Text outside a link or a
 * button never reacts to the pointer: plain text that moves on hover reads as something to click.
 */
function useAncestorActivity(
  rootRef: RefObject<HTMLElement | null>,
  isListening: boolean
) {
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    if (!isListening) {
      return;
    }
    if (!root) {
      return;
    }
    const trigger = root.closest<HTMLElement>(INTERACTIVE_ANCESTOR);
    if (!trigger) {
      return;
    }
    const handlePointerEnter = (event: PointerEvent) => {
      if (isTouchPointer(event)) {
        return;
      }
      setIsHovered(true);
    };
    const handlePointerLeave = () => {
      setIsHovered(false);
    };
    const handleFocusIn = (event: FocusEvent) => {
      const isFromKeyboard = isKeyboardFocus(event);
      setIsFocused(isFromKeyboard);
    };
    const handleFocusOut = () => {
      setIsFocused(false);
    };
    trigger.addEventListener('pointerenter', handlePointerEnter);
    trigger.addEventListener('pointerleave', handlePointerLeave);
    trigger.addEventListener('focusin', handleFocusIn);
    trigger.addEventListener('focusout', handleFocusOut);
    return () => {
      trigger.removeEventListener('pointerenter', handlePointerEnter);
      trigger.removeEventListener('pointerleave', handlePointerLeave);
      trigger.removeEventListener('focusin', handleFocusIn);
      trigger.removeEventListener('focusout', handleFocusOut);
    };
  }, [rootRef, isListening]);

  return isHovered || isFocused;
}

type FlipLetterProps = {
  character: string;
  styles: FaceStyles;
  textClassName?: string;
  backClassName?: string;
};

function FlipLetter({
  character,
  styles,
  textClassName,
  backClassName,
}: FlipLetterProps) {
  return (
    <span className='inline-grid [perspective:4em]'>
      <span
        className={cn('col-start-1 row-start-1 backface-hidden', textClassName)}
        style={styles.front}
      >
        {character}
      </span>
      <span
        className={cn('col-start-1 row-start-1 backface-hidden', backClassName)}
        style={styles.back}
      >
        {character}
      </span>
    </span>
  );
}

export type Text3DFlipProps = {
  children: string;
  as?: ElementType;
  className?: string;
  textClassName?: string;
  backClassName?: string;
  direction?: Text3DFlipDirection;
  staggerFrom?: Text3DFlipStaggerFrom;
  stagger?: number;
  duration?: number;
  flipped?: boolean;
};

export function Text3DFlip({
  children,
  as: Component = 'span',
  className,
  textClassName,
  backClassName,
  direction = 'up',
  staggerFrom = 'first',
  stagger = 0.03,
  duration = 0.5,
  flipped,
}: Text3DFlipProps) {
  const rootRef = useRef<HTMLElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const isControlled = flipped !== undefined;
  const isActive = useAncestorActivity(rootRef, !isControlled);
  const isFlipped = flipped ?? isActive;
  const words = wordsOf(children);
  const count = letterCountOf(words);
  const turn = TURNS[direction];

  const stylesOf = (letter: Letter) => {
    if (shouldReduceMotion) {
      return fadingStylesOf(isFlipped);
    }
    const rank = rankOf(letter.index, count, staggerFrom);
    const timing = timingOf(rank, isFlipped, duration, stagger);
    return turningStylesOf(turn, isFlipped, timing);
  };

  return (
    <Component ref={rootRef} className={className}>
      <span className='sr-only'>{children}</span>
      <span aria-hidden='true'>
        {words.map((word, wordIndex) => (
          <Fragment key={wordIndex}>
            {wordIndex > 0 && ' '}
            <span className='whitespace-nowrap'>
              {word.letters.map((letter) => (
                <FlipLetter
                  key={letter.index}
                  character={letter.character}
                  styles={stylesOf(letter)}
                  textClassName={textClassName}
                  backClassName={backClassName}
                />
              ))}
            </span>
          </Fragment>
        ))}
      </span>
    </Component>
  );
}
