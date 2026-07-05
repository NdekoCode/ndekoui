'use client';
import { cn } from '@/lib/utils';
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useReducedMotion,
  type Transition,
  type Variants,
} from 'motion/react';
import { useState, type ReactNode } from 'react';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';

export type WordRollDirection = 'up' | 'down';

/**
 * A word is a string, or a node with a stable key: the node keeps its place while its own content
 * changes (a `MotionNumber` inside a phrase), and rolls only when its key changes.
 */
export type WordRollWord =
  | string
  | {
      key: string;
      text: string;
      node: ReactNode;
    };

type RollItem = {
  key: string;
  text: string;
  node: ReactNode;
};

type SlotChange = {
  index: number;
  item: RollItem | null;
  exits: boolean;
  enters: boolean;
};

type SlotPlan = {
  index: number;
  item: RollItem | null;
  enterDelay: number;
  exitDelay: number;
};

type WordMotion = {
  direction: WordRollDirection;
  delay: number;
};

const ENTER_DURATION = 0.28;

const EXIT_DURATION = 0.2;

const ENTER_STAGGER = 0.07;

const EXIT_STAGGER = 0.05;

const ENTER_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const BLURRED = 'blur(4px)';

const SHARP = 'blur(0px)';

const RESTING = 'translateY(0%)';

const BELOW = 'translateY(110%)';

const ABOVE = 'translateY(-110%)';

/** Same spring as `AnimatedSize`, so the last word and the clipping edge move together. */
const SLIDE: Transition = { type: 'spring', bounce: 0, duration: 0.3 };

const INSTANT: Transition = { duration: 0 };

const FADE_IN: Transition = { duration: 0.15, ease: [0.23, 1, 0.32, 1] };

const FADE_OUT: Transition = { duration: 0.1, ease: [0.23, 1, 0.32, 1] };

function enteringOffsetOf(direction: WordRollDirection) {
  if (direction === 'down') {
    return ABOVE;
  }
  return BELOW;
}

function leavingOffsetOf(direction: WordRollDirection) {
  if (direction === 'down') {
    return BELOW;
  }
  return ABOVE;
}

const ROLL_VARIANTS: Variants = {
  hidden: (wordMotion: WordMotion) => ({
    transform: enteringOffsetOf(wordMotion.direction),
    filter: BLURRED,
  }),
  shown: (wordMotion: WordMotion) => ({
    transform: RESTING,
    filter: SHARP,
    transition: {
      duration: ENTER_DURATION,
      ease: ENTER_EASE,
      delay: wordMotion.delay,
    },
  }),
  gone: (wordMotion: WordMotion) => ({
    transform: leavingOffsetOf(wordMotion.direction),
    filter: BLURRED,
    transition: {
      duration: EXIT_DURATION,
      ease: 'easeIn',
      delay: wordMotion.delay,
    },
  }),
};

const FADE_VARIANTS: Variants = {
  hidden: { opacity: 0 },
  shown: { opacity: 1, transition: FADE_IN },
  gone: { opacity: 0, transition: FADE_OUT },
};

function variantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return ROLL_VARIANTS;
}

function slideOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return INSTANT;
  }
  return SLIDE;
}

function itemOf(word: WordRollWord): RollItem {
  if (typeof word === 'string') {
    return { key: `word:${word}`, text: word, node: word };
  }
  return { key: `node:${word.key}`, text: word.text, node: word.node };
}

function wordsOfText(text: string) {
  const trimmed = text.trim();
  if (trimmed === '') {
    return [];
  }
  return trimmed.split(/\s+/);
}

function itemsOf(
  text: string | undefined,
  words: readonly WordRollWord[] | undefined
) {
  if (words) {
    return words.map(itemOf);
  }
  const textWords = wordsOfText(text ?? '');
  return textWords.map(itemOf);
}

function haveSameKeys(first: readonly string[], second: readonly string[]) {
  if (first.length !== second.length) {
    return false;
  }
  return first.every((key, index) => key === second[index]);
}

function trendOf(
  previous: number | undefined,
  next: number | undefined,
  current: WordRollDirection
): WordRollDirection {
  if (previous === undefined) {
    return current;
  }
  if (next === undefined) {
    return current;
  }
  if (next < previous) {
    return 'down';
  }
  return 'up';
}

function keyOf(item: RollItem | null) {
  if (!item) {
    return null;
  }
  return item.key;
}

function changeAt(
  index: number,
  previousKeys: readonly string[],
  items: readonly RollItem[]
): SlotChange {
  const previousKey = previousKeys[index] ?? null;
  const item = items[index] ?? null;
  const key = keyOf(item);
  const isChanged = previousKey !== key;
  const hadWord = previousKey !== null;
  const hasWord = key !== null;
  const exits = isChanged && hadWord;
  const enters = isChanged && hasWord;
  return { index, item, exits, enters };
}

/** How long the leaving words take as a line, so the new words rise once they are all gone. */
function exitPhaseOf(exitCount: number) {
  if (exitCount === 0) {
    return 0;
  }
  const staggered = (exitCount - 1) * EXIT_STAGGER;
  return EXIT_DURATION + staggered;
}

/**
 * Only the words that changed roll, staggered among themselves. A slot whose word leaves mounts
 * its new word when the old one is gone, so its enter delay is counted from that moment.
 */
function planSlots(
  previousKeys: readonly string[],
  items: readonly RollItem[],
  slotCount: number
) {
  const indexes = Array.from({ length: slotCount }, (_, index) => index);
  const changes = indexes.map((index) => changeAt(index, previousKeys, items));
  const exiting = changes.filter((change) => change.exits);
  const exitPhase = exitPhaseOf(exiting.length);
  const plans: SlotPlan[] = [];
  let exitRank = 0;
  let enterRank = 0;

  for (const change of changes) {
    let exitDelay = 0;
    let exitEnd = 0;
    let enterDelay = 0;
    if (change.exits) {
      exitDelay = exitRank * EXIT_STAGGER;
      exitEnd = exitDelay + EXIT_DURATION;
      exitRank += 1;
    }
    if (change.enters) {
      const enterOffset = enterRank * ENTER_STAGGER;
      const enterStart = exitPhase + enterOffset;
      enterDelay = enterStart - exitEnd;
      enterRank += 1;
    }
    plans.push({
      index: change.index,
      item: change.item,
      enterDelay,
      exitDelay,
    });
  }

  return plans;
}

function leadingSpaceOf(index: number) {
  if (index === 0) {
    return null;
  }
  return ' ';
}

type WordSlotProps = {
  plan: SlotPlan;
  direction: WordRollDirection;
  variants: Variants;
  slide: Transition;
  initialSlotCount: number;
  /** The words in order: the slots are only measured again when it changes, not on every render. */
  layoutKey: string;
};

function WordSlot({
  plan,
  direction,
  variants,
  slide,
  initialSlotCount,
  layoutKey,
}: WordSlotProps) {
  const isAddedLater = plan.index >= initialSlotCount;
  const leadingSpace = leadingSpaceOf(plan.index);
  const enterMotion: WordMotion = { direction, delay: plan.enterDelay };
  const exitMotion: WordMotion = { direction, delay: plan.exitDelay };

  return (
    <motion.span
      layout='position'
      layoutDependency={layoutKey}
      transition={slide}
      className='flex overflow-y-clip'
    >
      <AnimatePresence mode='wait' initial={isAddedLater} custom={exitMotion}>
        {plan.item && (
          <motion.span
            key={plan.item.key}
            custom={enterMotion}
            variants={variants}
            initial='hidden'
            animate='shown'
            exit='gone'
            className='block whitespace-pre'
          >
            {leadingSpace}
            {plan.item.node}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.span>
  );
}

type RollFrameProps = {
  labels: readonly string[] | undefined;
  children: ReactNode;
};

function RollFrame({ labels, children }: RollFrameProps) {
  const hasLabels = labels !== undefined && labels.length > 0;

  if (hasLabels) {
    return (
      <span aria-hidden='true' className='inline-grid'>
        {labels.map((label, index) => (
          <span
            key={`${index}-${label}`}
            className='invisible col-start-1 row-start-1 whitespace-pre'
          >
            {label}
          </span>
        ))}
        <span className='col-start-1 row-start-1 flex items-baseline'>
          {children}
        </span>
      </span>
    );
  }

  return (
    <AnimatedSize
      as='span'
      axis='width'
      contentClassName='flex items-baseline'
      aria-hidden='true'
    >
      {children}
    </AnimatedSize>
  );
}

type WordRollContent =
  | {
      text: string;
      words?: never;
    }
  | {
      words: readonly WordRollWord[];
      text?: never;
    };

export type WordRollProps = WordRollContent & {
  labels?: readonly string[];
  direction?: WordRollDirection;
  value?: number;
  accessibleText?: string;
  className?: string;
};

export function WordRoll({
  text,
  words,
  labels,
  direction,
  value,
  accessibleText,
  className,
}: WordRollProps) {
  const shouldReduceMotion = useReducedMotion();
  const items = itemsOf(text, words);
  const keys = items.map((item) => item.key);
  const [initialSlotCount] = useState(keys.length);
  const [slotCount, setSlotCount] = useState(keys.length);
  const [currentKeys, setCurrentKeys] = useState<readonly string[]>(keys);
  const [previousKeys, setPreviousKeys] = useState<readonly string[]>(keys);
  const [previousValue, setPreviousValue] = useState(value);
  const [trend, setTrend] = useState<WordRollDirection>('up');

  const hasNewWords = !haveSameKeys(keys, currentKeys);
  if (hasNewWords) {
    setPreviousKeys(currentKeys);
    setCurrentKeys(keys);
  }

  const needsMoreSlots = keys.length > slotCount;
  if (needsMoreSlots) {
    setSlotCount(keys.length);
  }

  const hasNewValue = !Object.is(value, previousValue);
  if (hasNewValue) {
    const nextTrend = trendOf(previousValue, value, trend);
    setPreviousValue(value);
    setTrend(nextTrend);
  }

  const rollDirection = direction ?? trend;
  const renderedSlotCount = Math.max(slotCount, keys.length);
  const plans = planSlots(previousKeys, items, renderedSlotCount);
  const variants = variantsOf(shouldReduceMotion);
  const slide = slideOf(shouldReduceMotion);
  const spokenWords = items.map((item) => item.text);
  const spokenText = accessibleText ?? spokenWords.join(' ');
  const layoutKey = keys.join('\n');

  return (
    <span
      className={cn('inline-flex items-baseline whitespace-nowrap', className)}
    >
      <span className='sr-only'>{spokenText}</span>
      <RollFrame labels={labels}>
        <LayoutGroup inherit={false}>
          {plans.map((plan) => (
            <WordSlot
              key={plan.index}
              plan={plan}
              direction={rollDirection}
              variants={variants}
              slide={slide}
              initialSlotCount={initialSlotCount}
              layoutKey={layoutKey}
            />
          ))}
        </LayoutGroup>
      </RollFrame>
    </span>
  );
}
