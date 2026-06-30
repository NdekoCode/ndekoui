'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
  useReducedMotion,
} from 'motion/react';
import { useState } from 'react';

import { EyeIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';

type CountGlyph = {
  key: string;
  character: string;
  isDigit: boolean;
  place: number;
};

const BASE_WATCHERS = 1099;
const DIGIT_SHIFT_PX = 8;
const CARRY_DELAY_S = 0.035;

const DIGIT_TRANSITION: Transition = { duration: 0.18, ease: [0.2, 0, 0, 1] };

const DIGIT_VARIANTS: Variants = {
  enter: (direction: number) => {
    const offset = direction * DIGIT_SHIFT_PX;
    return { opacity: 0, y: offset };
  },
  visible: { opacity: 1, y: 0 },
  exit: (direction: number) => {
    const offset = direction * DIGIT_SHIFT_PX;
    return { opacity: 0, y: -offset };
  },
};

const FADE_VARIANTS: Variants = {
  enter: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

function digitVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return DIGIT_VARIANTS;
}

function directionOf(isWatching: boolean) {
  if (isWatching) {
    return 1;
  }
  return -1;
}

function isDigitCharacter(character: string) {
  return /\d/.test(character);
}

function glyphsOf(count: number) {
  const characters = Array.from(count.toLocaleString('en-US'));
  const glyphs: CountGlyph[] = [];
  let place = 0;
  for (let index = characters.length - 1; index >= 0; index -= 1) {
    const character = characters[index];
    const isDigit = isDigitCharacter(character);
    if (!isDigit) {
      glyphs.unshift({ key: `separator-${place}`, character, isDigit, place });
      continue;
    }
    glyphs.unshift({ key: `digit-${place}`, character, isDigit, place });
    place += 1;
  }
  return glyphs;
}

function digitTransitionOf(place: number): Transition {
  const delay = place * CARRY_DELAY_S;
  return { ...DIGIT_TRANSITION, delay };
}

function watchersLabelOf(count: number) {
  const formatted = count.toLocaleString('en-US');
  if (count === 1) {
    return '1 person watching';
  }
  return `${formatted} people watching`;
}

export default function Button62() {
  const [isWatching, setIsWatching] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const digitVariants = digitVariantsOf(shouldReduceMotion);
  const direction = directionOf(isWatching);
  const ownWatch = Number(isWatching);
  const watcherCount = BASE_WATCHERS + ownWatch;
  const glyphs = glyphsOf(watcherCount);

  function toggleWatch() {
    setIsWatching((current) => !current);
  }

  return (
    <Button
      variant='outline'
      className='py-0 pe-0'
      aria-pressed={isWatching}
      onClick={toggleWatch}
    >
      <EyeIcon className='group-aria-pressed/button:text-primary-ink opacity-60 transition-[opacity,color] duration-150 group-aria-pressed/button:opacity-100' />
      Watch
      <span className='hairline-l border-foreground/12 text-muted-foreground dark:border-foreground/15 ms-1 inline-flex h-full items-center px-3 text-xs font-medium tabular-nums'>
        <span className='flex' aria-hidden='true'>
          {glyphs.map((glyph) => {
            if (!glyph.isDigit) {
              return <span key={glyph.key}>{glyph.character}</span>;
            }
            return (
              <span key={glyph.key} className='relative flex'>
                <AnimatePresence
                  mode='popLayout'
                  initial={false}
                  custom={direction}
                >
                  <motion.span
                    key={glyph.character}
                    className='flex'
                    custom={direction}
                    variants={digitVariants}
                    initial='enter'
                    animate='visible'
                    exit='exit'
                    transition={digitTransitionOf(glyph.place)}
                  >
                    {glyph.character}
                  </motion.span>
                </AnimatePresence>
              </span>
            );
          })}
        </span>
        <span className='sr-only'>{watchersLabelOf(watcherCount)}</span>
      </span>
    </Button>
  );
}
