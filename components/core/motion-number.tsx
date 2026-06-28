'use client';
import { cn } from '@/lib/utils';
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
  type SpringOptions,
  type Transition,
} from 'motion/react';
import { useEffect, useRef, useState } from 'react';

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

const HALF_WHEEL = DIGIT_COUNT / 2;

const WHEEL = Array.from({ length: DIGIT_COUNT }, (_, digit) => digit);

const ROLL_SPRING: SpringOptions = { stiffness: 170, damping: 28, mass: 1 };

const SLIDE: Transition = { type: 'spring', bounce: 0, duration: 0.5 };

const FADE_IN: Transition = { duration: 0.2, ease: [0.23, 1, 0.32, 1] };

const FADE_OUT: Transition = { duration: 0.12, ease: [0.23, 1, 0.32, 1] };

const INSTANT: Transition = { duration: 0 };

function wrapDigit(position: number) {
  const remainder = position % DIGIT_COUNT;
  const positiveRemainder = remainder + DIGIT_COUNT;
  return positiveRemainder % DIGIT_COUNT;
}

/** Distance of a glyph from the visible window, in slot heights: positive sits below, negative above. */
function offsetOf(digit: number, position: number) {
  const distance = wrapDigit(digit - position);
  if (distance > HALF_WHEEL) {
    return distance - DIGIT_COUNT;
  }
  return distance;
}

function translateOf(offset: number) {
  const percent = offset * 100;
  return `translateY(${percent}%)`;
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

function glyphsOf(formatter: Intl.NumberFormat) {
  const { numberingSystem } = formatter.resolvedOptions();
  const digitFormatter = new Intl.NumberFormat('en-US', {
    numberingSystem,
    useGrouping: false,
  });
  return WHEEL.map((digit) => digitFormatter.format(digit));
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

function WheelGlyph({
  position,
  digit,
  glyph,
}: {
  position: MotionValue<number>;
  digit: number;
  glyph: string;
}) {
  const transform = useTransform(position, (latest) => {
    const offset = offsetOf(digit, latest);
    return translateOf(offset);
  });

  return (
    <motion.span
      className='absolute inset-0 flex justify-center'
      style={{ transform }}
    >
      {glyph}
    </motion.span>
  );
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
  const position = useSpring(digit, ROLL_SPRING);
  const targetRef = useRef(digit);

  useEffect(() => {
    const restingDigit = wrapDigit(targetRef.current);
    if (restingDigit === digit) {
      return;
    }
    const steps = stepsBetween(restingDigit, digit, trend);
    targetRef.current += steps;
    if (shouldReduceMotion) {
      position.jump(targetRef.current);
      return;
    }
    position.set(targetRef.current);
  }, [digit, trend, shouldReduceMotion, position]);

  return (
    <>
      <span className='invisible'>{glyph}</span>
      {WHEEL.map((wheelDigit) => (
        <WheelGlyph
          key={wheelDigit}
          position={position}
          digit={wheelDigit}
          glyph={glyphs[wheelDigit]}
        />
      ))}
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

  const formatter = new Intl.NumberFormat(locale, format);
  const glyphs = glyphsOf(formatter);
  const parts = formatter.formatToParts(value);
  const slots = slotsOf(parts, glyphs);
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
          <motion.span layout='position' transition={slotMotion.transition}>
            {prefix}
          </motion.span>
        )}
        <AnimatePresence initial={false} mode='popLayout'>
          {slots.map((slot) => {
            if (slot.kind === 'symbol') {
              return (
                <motion.span key={slot.key} layout='position' {...slotMotion}>
                  {slot.text}
                </motion.span>
              );
            }
            return (
              <motion.span
                key={slot.key}
                layout='position'
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
          <motion.span layout='position' transition={slotMotion.transition}>
            {suffix}
          </motion.span>
        )}
      </span>
    </span>
  );
}
