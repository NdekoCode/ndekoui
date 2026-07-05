'use client';
import { Fragment, useEffect, useEffectEvent, useRef, useState } from 'react';
import { motion, MotionProps, useInView } from 'motion/react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';

import { motionElementOf } from './motion-elements';

export type TextScrambleProps = {
  children: string;
  duration?: number;
  speed?: number;
  characterSet?: string;
  as?: React.ElementType;
  className?: string;
  trigger?: boolean;
  startOnView?: boolean;
  replayOnHover?: boolean;
  delay?: number;
  stableWidth?: boolean;
  onScrambleComplete?: () => void;
} & MotionProps;

type Cell = {
  index: number;
  final: string;
  shown: string;
};

const defaultChars =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

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

function randomCharacterOf(characterSet: string) {
  const sample = Math.random();
  const position = sample * characterSet.length;
  const index = Math.floor(position);
  return characterSet[index];
}

function scrambledTextOf(text: string, progress: number, characterSet: string) {
  const settledCount = progress * text.length;
  let scrambled = '';
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const isSpace = character === ' ';
    const isSettled = settledCount > index;
    if (isSpace) {
      scrambled += ' ';
      continue;
    }
    if (isSettled) {
      scrambled += character;
      continue;
    }
    scrambled += randomCharacterOf(characterSet);
  }
  return scrambled;
}

function wordsOf(text: string, shown: string) {
  const words: Cell[][] = [[]];
  for (let index = 0; index < text.length; index += 1) {
    const final = text[index];
    if (final === ' ') {
      words.push([]);
      continue;
    }
    const lastWordIndex = words.length - 1;
    const currentWord = words[lastWordIndex];
    const shownCharacter = shown[index] ?? final;
    currentWord.push({ index, final, shown: shownCharacter });
  }
  return words;
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

type StableLettersProps = {
  text: string;
  shown: string;
};

/** Each character keeps the width of its final letter, so the line never shifts while it scrambles. */
function StableLetters({ text, shown }: StableLettersProps) {
  const words = wordsOf(text, shown);

  return words.map((word, wordIndex) => (
    <Fragment key={wordIndex}>
      {wordIndex > 0 && ' '}
      <span className='whitespace-nowrap'>
        {word.map((cell) => (
          <span key={cell.index} className='inline-grid'>
            <span className='invisible col-start-1 row-start-1'>
              {cell.final}
            </span>
            <span className='col-start-1 row-start-1 text-center'>
              {cell.shown}
            </span>
          </span>
        ))}
      </span>
    </Fragment>
  ));
}

type ScrambleFaceProps = {
  text: string;
  shown: string;
  stableWidth: boolean;
};

function ScrambleFace({ text, shown, stableWidth }: ScrambleFaceProps) {
  if (stableWidth) {
    return <StableLetters text={text} shown={shown} />;
  }
  return shown;
}

export function TextScramble({
  children,
  duration = 0.8,
  speed = 0.04,
  characterSet = defaultChars,
  className,
  as: Component = 'p',
  trigger = true,
  startOnView = false,
  replayOnHover = false,
  delay = 0,
  stableWidth = false,
  onScrambleComplete,
  ...props
}: TextScrambleProps) {
  const MotionComponent = motionElementOf(Component) as typeof motion.p;
  const rootRef = useRef<HTMLParagraphElement>(null);
  const [displayText, setDisplayText] = useState(children);
  const [settledText, setSettledText] = useState(children);
  const isAnimatingRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const isInView = useInView(rootRef, { once: true });
  const isWaitingForView = startOnView && !isInView;
  const shouldStart = trigger && !isWaitingForView;

  const hasNewText = children !== settledText;
  if (hasNewText) {
    setSettledText(children);
    setDisplayText(children);
  }

  const showFrame = useEffectEvent((progress: number) => {
    const frame = scrambledTextOf(children, progress, characterSet);
    setDisplayText(frame);
  });

  const finish = useEffectEvent(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = null;
    setDisplayText(children);
    isAnimatingRef.current = false;
    onScrambleComplete?.();
  });

  const scramble = useEffectEvent(() => {
    if (isAnimatingRef.current) return;

    if (prefersReducedMotion) {
      onScrambleComplete?.();
      return;
    }

    isAnimatingRef.current = true;

    const steps = duration / speed;
    let step = 0;

    const interval = setInterval(() => {
      const progress = step / steps;
      showFrame(progress);
      step++;

      if (step > steps) {
        finish();
      }
    }, speed * 1000);

    intervalRef.current = interval;
  });

  useEffect(() => {
    if (!shouldStart) return;

    if (delay <= 0) {
      scramble();
      return;
    }

    const delayMs = delay * 1000;
    const timer = setTimeout(() => {
      scramble();
    }, delayMs);
    return () => clearTimeout(timer);
  }, [shouldStart, delay]);

  useEffect(() => {
    const root = rootRef.current;
    if (!replayOnHover) {
      return;
    }
    if (!root) {
      return;
    }
    const activator = root.closest<HTMLElement>(INTERACTIVE_ANCESTOR);
    if (!activator) {
      return;
    }
    const handlePointerEnter = (event: PointerEvent) => {
      if (isTouchPointer(event)) {
        return;
      }
      scramble();
    };
    const handleFocusIn = (event: FocusEvent) => {
      if (!isKeyboardFocus(event)) {
        return;
      }
      scramble();
    };
    activator.addEventListener('pointerenter', handlePointerEnter);
    activator.addEventListener('focusin', handleFocusIn);
    return () => {
      activator.removeEventListener('pointerenter', handlePointerEnter);
      activator.removeEventListener('focusin', handleFocusIn);
    };
  }, [replayOnHover]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <MotionComponent ref={rootRef} className={className} {...props}>
      <span className='sr-only'>{children}</span>
      <span aria-hidden='true'>
        <ScrambleFace
          text={children}
          shown={displayText}
          stableWidth={stableWidth}
        />
      </span>
    </MotionComponent>
  );
}
