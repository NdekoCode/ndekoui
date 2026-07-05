'use client';
import { cn } from '@/lib/utils';
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Transition,
} from 'motion/react';
import { useLayoutEffect, useRef, useState } from 'react';

type Trend = 1 | -1;

type DigitSlot = {
  kind: 'digit';
  key: string;
  digit: number;
  glyph: string;
};

type SymbolSlot = {
  kind: 'symbol';
  key: string;
  text: string;
};

type Slot = DigitSlot | SymbolSlot;

const DIGIT_COUNT = 10;

const WHEEL = Array.from({ length: DIGIT_COUNT }, (_, digit) => digit);

/**
 * Each digit is one strip of three wheels that the browser slides with a transition, so a value
 * that changes many times a second costs no script between two changes. The middle wheel is home.
 */
const WHEEL_COPIES = 3;

const CELL_COUNT = DIGIT_COUNT * WHEEL_COPIES;

const LAST_CELL = CELL_COUNT - 1;

const CELLS = Array.from({ length: CELL_COUNT }, (_, cell) => cell);

const STRIPS = new WeakMap<string[], string>();

const CELL_PERCENT = 100 / CELL_COUNT;

const SLIDE: Transition = { type: 'spring', bounce: 0, duration: 0.5 };

const FADE_IN: Transition = { duration: 0.2, ease: [0.23, 1, 0.32, 1] };

const FADE_OUT: Transition = { duration: 0.12, ease: [0.23, 1, 0.32, 1] };

const INSTANT: Transition = { duration: 0 };

function wrapDigit(position: number) {
  const remainder = position % DIGIT_COUNT;
  const positiveRemainder = remainder + DIGIT_COUNT;
  return positiveRemainder % DIGIT_COUNT;
}

function homeCellOf(digit: number) {
  return DIGIT_COUNT + digit;
}

function translateOfCell(cell: number) {
  const percent = cell * CELL_PERCENT;
  return `translateY(-${percent}%)`;
}

function stepsBetween(from: number, to: number, trend: Trend) {
  if (trend === 1) {
    return wrapDigit(to - from);
  }
  const stepsDown = wrapDigit(from - to);
  return -stepsDown;
}

function trendBetween(previous: number, next: number): Trend {
  if (next < previous) {
    return -1;
  }
  return 1;
}

/** Where the strip is drawn right now, in cells, read from the running transition. */
function visualCellOf(strip: HTMLElement) {
  const cellHeight = strip.offsetHeight / CELL_COUNT;
  if (cellHeight === 0) {
    return 0;
  }
  const computed = getComputedStyle(strip);
  const matrix = new DOMMatrixReadOnly(computed.transform);
  return -matrix.m42 / cellHeight;
}

/** The three wheels as lines of one text, so a digit costs two elements whatever its value. */
function stripTextOf(glyphs: string[]) {
  const cached = STRIPS.get(glyphs);
  if (cached) {
    return cached;
  }
  const lines = CELLS.map((cell) => glyphs[cell % DIGIT_COUNT]);
  const text = lines.join('\n');
  STRIPS.set(glyphs, text);
  return text;
}

function wrapIntoStrip(cell: number) {
  let wrapped = cell;
  while (wrapped < 0) {
    wrapped += DIGIT_COUNT;
  }
  while (wrapped > LAST_CELL) {
    wrapped -= DIGIT_COUNT;
  }
  return wrapped;
}

/** Moves the strip without a transition. The three wheels are identical, so a jump of whole wheels is invisible. */
function placeStrip(strip: HTMLElement, cell: number) {
  strip.style.transition = 'none';
  strip.style.transform = translateOfCell(cell);
  strip.getBoundingClientRect();
  strip.style.transition = '';
}

const FORMATTERS = new Map<string, Intl.NumberFormat>();

const GLYPHS = new Map<string, string[]>();

function localeKeyOf(locale: Intl.LocalesArgument) {
  if (Array.isArray(locale)) {
    return locale.map(String).join(',');
  }
  return String(locale);
}

function formatterOf(
  locale: Intl.LocalesArgument,
  format: Intl.NumberFormatOptions | undefined
) {
  const localeKey = localeKeyOf(locale);
  const formatKey = JSON.stringify(format ?? {});
  const key = `${localeKey} ${formatKey}`;
  const cached = FORMATTERS.get(key);
  if (cached) {
    return cached;
  }
  const formatter = new Intl.NumberFormat(locale, format);
  FORMATTERS.set(key, formatter);
  return formatter;
}

function glyphsOf(formatter: Intl.NumberFormat) {
  const { numberingSystem } = formatter.resolvedOptions();
  const cached = GLYPHS.get(numberingSystem);
  if (cached) {
    return cached;
  }
  const digitFormatter = new Intl.NumberFormat('en-US', {
    numberingSystem,
    useGrouping: false,
  });
  const glyphs = WHEEL.map((digit) => digitFormatter.format(digit));
  GLYPHS.set(numberingSystem, glyphs);
  return glyphs;
}

function countIntegerDigits(parts: Intl.NumberFormatPart[]) {
  const integerParts = parts.filter((part) => part.type === 'integer');
  const integerValues = integerParts.map((part) => part.value);
  const integerText = integerValues.join('');
  return Array.from(integerText).length;
}

function slotOfCharacter(key: string, character: string, glyphs: string[]) {
  const digit = glyphs.indexOf(character);
  if (digit === -1) {
    const symbol: SymbolSlot = { kind: 'symbol', key, text: character };
    return symbol;
  }
  const digitSlot: DigitSlot = { kind: 'digit', key, digit, glyph: character };
  return digitSlot;
}

/**
 * Integer digits are keyed by their place from the right and fraction digits by their place from
 * the decimal point, so 99 to 100 keeps the two existing digits and adds one on the left.
 */
function slotsOf(parts: Intl.NumberFormatPart[], glyphs: string[]) {
  const slots: Slot[] = [];
  const occurrences = new Map<string, number>();
  let integerPlace = countIntegerDigits(parts);
  let fractionPlace = 0;

  for (const part of parts) {
    if (part.type === 'integer') {
      for (const character of Array.from(part.value)) {
        integerPlace -= 1;
        const slot = slotOfCharacter(
          `integer-${integerPlace}`,
          character,
          glyphs
        );
        slots.push(slot);
      }
      continue;
    }

    if (part.type === 'fraction') {
      for (const character of Array.from(part.value)) {
        const slot = slotOfCharacter(
          `fraction-${fractionPlace}`,
          character,
          glyphs
        );
        slots.push(slot);
        fractionPlace += 1;
      }
      continue;
    }

    if (part.type === 'group') {
      slots.push({
        kind: 'symbol',
        key: `group-${integerPlace}`,
        text: part.value,
      });
      continue;
    }

    const occurrence = occurrences.get(part.type) ?? 0;
    const nextOccurrence = occurrence + 1;
    occurrences.set(part.type, nextOccurrence);
    slots.push({
      kind: 'symbol',
      key: `${part.type}-${occurrence}`,
      text: part.value,
    });
  }

  return slots;
}

/** The slots only change place when one appears or leaves, so their layout is measured then and not on every value. */
function structureOf(slots: Slot[], prefix?: string, suffix?: string) {
  const keys = slots.map((slot) => slot.key);
  const hasPrefix = Boolean(prefix);
  const hasSuffix = Boolean(suffix);
  return `${hasPrefix} ${keys.join(' ')} ${hasSuffix}`;
}

function slotMotionOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1, transition: INSTANT },
      exit: { opacity: 0, transition: INSTANT },
      transition: INSTANT,
    };
  }
  return {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: FADE_IN },
    exit: { opacity: 0, transition: FADE_OUT },
    transition: { layout: SLIDE },
  };
}

function DigitWheel({
  digit,
  glyph,
  glyphs,
  trend,
  shouldReduceMotion,
}: {
  digit: number;
  glyph: string;
  glyphs: string[];
  trend: Trend;
  shouldReduceMotion: boolean | null;
}) {
  const stripRef = useRef<HTMLSpanElement>(null);
  const targetRef = useRef(homeCellOf(digit));
  const [restingTransform] = useState(() => {
    const home = homeCellOf(digit);
    return translateOfCell(home);
  });

  useLayoutEffect(() => {
    const strip = stripRef.current;
    if (!strip) {
      return;
    }
    const restingDigit = wrapDigit(targetRef.current);
    if (restingDigit === digit) {
      return;
    }
    const home = homeCellOf(digit);
    if (shouldReduceMotion) {
      targetRef.current = home;
      placeStrip(strip, home);
      return;
    }
    const steps = stepsBetween(restingDigit, digit, trend);
    let next = targetRef.current + steps;
    const isPastStrip = next < 0 || next > LAST_CELL;
    if (isPastStrip) {
      const shift = home - next;
      const visual = visualCellOf(strip);
      placeStrip(strip, wrapIntoStrip(visual + shift));
      next = home;
    }
    targetRef.current = next;
    strip.style.transform = translateOfCell(next);
  }, [digit, trend, shouldReduceMotion]);

  function settle(event: React.TransitionEvent<HTMLSpanElement>) {
    const strip = event.currentTarget;
    const isOwnRoll = event.target === strip;
    if (!isOwnRoll) {
      return;
    }
    const restingDigit = wrapDigit(targetRef.current);
    const home = homeCellOf(restingDigit);
    if (home === targetRef.current) {
      return;
    }
    targetRef.current = home;
    placeStrip(strip, home);
  }

  return (
    <>
      <span className='invisible'>{glyph}</span>
      <span
        ref={stripRef}
        onTransitionEnd={settle}
        style={{ transform: restingTransform }}
        className='absolute inset-x-0 top-0 text-center whitespace-pre transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none'
      >
        {stripTextOf(glyphs)}
      </span>
    </>
  );
}

export type MotionNumberProps = {
  value: number;
  locale?: Intl.LocalesArgument;
  format?: Intl.NumberFormatOptions;
  prefix?: string;
  suffix?: string;
  className?: string;
};

export function MotionNumber({
  value,
  locale = 'en-US',
  format,
  prefix,
  suffix,
  className,
}: MotionNumberProps) {
  const shouldReduceMotion = useReducedMotion();
  const [previousValue, setPreviousValue] = useState(value);
  const [trend, setTrend] = useState<Trend>(1);

  const hasChanged = !Object.is(value, previousValue);
  if (hasChanged) {
    setPreviousValue(value);
    setTrend(trendBetween(previousValue, value));
  }

  const formatter = formatterOf(locale, format);
  const glyphs = glyphsOf(formatter);
  const parts = formatter.formatToParts(value);
  const slots = slotsOf(parts, glyphs);
  const structure = structureOf(slots, prefix, suffix);
  const formattedValue = formatter.format(value);
  const spokenValue = [prefix, formattedValue, suffix].join('');
  const slotMotion = slotMotionOf(shouldReduceMotion);

  return (
    <span
      className={cn(
        'inline-flex items-baseline whitespace-nowrap tabular-nums',
        className
      )}
    >
      <span className='sr-only'>{spokenValue}</span>
      <span
        aria-hidden='true'
        className='relative inline-flex items-baseline whitespace-pre'
      >
        {prefix && (
          <motion.span
            layout='position'
            layoutDependency={structure}
            transition={slotMotion.transition}
          >
            {prefix}
          </motion.span>
        )}
        <AnimatePresence initial={false} mode='popLayout'>
          {slots.map((slot) => {
            if (slot.kind === 'symbol') {
              return (
                <motion.span
                  key={slot.key}
                  layout='position'
                  layoutDependency={structure}
                  {...slotMotion}
                >
                  {slot.text}
                </motion.span>
              );
            }
            return (
              <motion.span
                key={slot.key}
                layout='position'
                layoutDependency={structure}
                className='relative inline-flex overflow-y-clip'
                {...slotMotion}
              >
                <DigitWheel
                  digit={slot.digit}
                  glyph={slot.glyph}
                  glyphs={glyphs}
                  trend={trend}
                  shouldReduceMotion={shouldReduceMotion}
                />
              </motion.span>
            );
          })}
        </AnimatePresence>
        {suffix && (
          <motion.span
            layout='position'
            layoutDependency={structure}
            transition={slotMotion.transition}
          >
            {suffix}
          </motion.span>
        )}
      </span>
    </span>
  );
}
