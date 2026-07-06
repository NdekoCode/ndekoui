'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
} from 'motion/react';
import { useState, type ChangeEvent } from 'react';

import {
  typingSteps,
  useAutoplay,
  type AutoplayStep,
} from '@/registry/ndeko/hooks/use-autoplay';
import { useKeptHeight } from '@/registry/ndeko/hooks/use-kept-height';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { useTimeouts } from '@/registry/ndeko/hooks/use-timeouts';
import {
  PRESS_LEAD_MS,
  pressedQuietOf,
  spokenUnless,
  usePress,
} from '@/registry/ndeko/lib/demonstration';
import {
  CheckIcon,
  CircleIcon,
  CopyIcon,
  EyeIcon,
  EyeOffIcon,
  KeyIcon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import { Swap } from '@/registry/ndeko/ui/chat-motion';
import { Field, FieldLabel } from '@/registry/ndeko/ui/field';
import { Input } from '@/registry/ndeko/ui/input';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';

const SEGMENTS = [0, 1, 2, 3];
const MAX_LEVEL = SEGMENTS.length;
const MIN_LENGTH = 12;
const GENERATED_LENGTH = 16;
const SCRAMBLE_FRAME_MS = 45;
const SCRAMBLE_MS = (GENERATED_LENGTH + 1) * SCRAMBLE_FRAME_MS;
const SEGMENT_STAGGER_MS = 40;
const LABEL_SHIFT_PX = 8;
const COPIED_FOR_MS = 1600;
const SAMPLE_PASSWORD = 'T7#mQ2!xLw9@Rk4v';

const LOWER = 'abcdefghijkmnopqrstuvwxyz';
const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const DIGITS = '23456789';
const SYMBOLS = '!@#$%&*?';
const POOL = `${LOWER}${UPPER}${DIGITS}${SYMBOLS}`;

type Rule = { label: string; isMetBy: (password: string) => boolean };

function hasMixedCase(password: string) {
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  return hasLower && hasUpper;
}

const RULES: Rule[] = [
  {
    label: `${MIN_LENGTH}+ characters`,
    isMetBy: (password) => password.length >= MIN_LENGTH,
  },
  { label: 'Upper and lower case', isMetBy: hasMixedCase },
  { label: 'A number', isMetBy: (password) => /\d/.test(password) },
  { label: 'A symbol', isMetBy: (password) => /[^A-Za-z0-9]/.test(password) },
];

const LEVELS = [
  { label: 'Not set', tone: 'bg-transparent', ink: 'text-muted-foreground' },
  { label: 'Weak', tone: 'bg-destructive', ink: 'text-destructive-ink' },
  { label: 'Fair', tone: 'bg-warning', ink: 'text-warning-foreground' },
  { label: 'Good', tone: 'bg-success', ink: 'text-success-foreground' },
  { label: 'Strong', tone: 'bg-success', ink: 'text-success-foreground' },
];

const SEGMENT_FILL =
  'h-full w-full origin-left rounded-full transition-[scale,background-color] duration-200 ease-(--ease-out-strong) rtl:origin-right';

const LABEL_TRANSITION: Transition = { duration: 0.18, ease: [0.2, 0, 0, 1] };

const LABEL_VARIANTS: Variants = {
  enter: (direction: number) => {
    const offset = direction * LABEL_SHIFT_PX;
    return { opacity: 0, y: offset };
  },
  visible: { opacity: 1, y: 0 },
  exit: (direction: number) => {
    const offset = direction * LABEL_SHIFT_PX;
    return { opacity: 0, y: -offset };
  },
};

const FADE_VARIANTS: Variants = {
  enter: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

function labelVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return LABEL_VARIANTS;
}

function levelOf(password: string) {
  if (password.length === 0) {
    return 0;
  }
  const passed = RULES.filter((rule) => rule.isMetBy(password)).length;
  return Math.max(1, passed);
}

function directionBetween(previousLevel: number, nextLevel: number) {
  if (nextLevel < previousLevel) {
    return -1;
  }
  return 1;
}

function segmentDelayOf(index: number, direction: number) {
  if (direction > 0) {
    const delay = index * SEGMENT_STAGGER_MS;
    return { transitionDelay: `${delay}ms` };
  }
  const reversedIndex = MAX_LEVEL - 1 - index;
  const delay = reversedIndex * SEGMENT_STAGGER_MS;
  return { transitionDelay: `${delay}ms` };
}

function segmentFillOf(index: number, level: number) {
  const isFilled = index < level;
  if (isFilled) {
    return 'scale-x-100';
  }
  return 'scale-x-0';
}

function randomIndexOf(size: number) {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return values[0] % size;
}

function randomCharOf(source: string) {
  return source[randomIndexOf(source.length)];
}

function shuffled(characters: string[]) {
  const result = [...characters];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = randomIndexOf(index + 1);
    const held = result[index];
    result[index] = result[swapIndex];
    result[swapIndex] = held;
  }
  return result;
}

/** One character of each kind first, so the result always meets every rule. */
function strongPasswordOf(length: number) {
  const required = [
    randomCharOf(LOWER),
    randomCharOf(UPPER),
    randomCharOf(DIGITS),
    randomCharOf(SYMBOLS),
  ];
  const characters = [...required];
  while (characters.length < length) {
    characters.push(randomCharOf(POOL));
  }
  return shuffled(characters).join('');
}

function scrambleFrameOf(target: string, settledCount: number) {
  const settled = target.slice(0, settledCount);
  const restCount = target.length - settledCount;
  let rest = '';
  for (let index = 0; index < restCount; index += 1) {
    rest += randomCharOf(POOL);
  }
  return `${settled}${rest}`;
}

function strengthMessageOf(level: number) {
  return `Password strength: ${LEVELS[level].label}`;
}

const GENERATED_MESSAGE = `Strong password generated. ${strengthMessageOf(MAX_LEVEL)}`;

function ruleStatusOf(isMet: boolean) {
  if (isMet) {
    return 'met';
  }
  return 'not met yet';
}

function inputTypeOf(isShown: boolean) {
  if (isShown) {
    return 'text';
  }
  return 'password';
}

function revealLabelOf(isRevealed: boolean) {
  if (isRevealed) {
    return 'Hide password';
  }
  return 'Show password';
}

function RuleRow({ label, isMet }: { label: string; isMet: boolean }) {
  const glyphKey = String(isMet);

  return (
    <li
      className={cn(
        'flex items-center gap-1.5 text-xs transition-colors duration-150',
        isMet && 'text-foreground',
        !isMet && 'text-muted-foreground'
      )}
    >
      <Swap swapKey={glyphKey}>
        {isMet && <CheckIcon className='text-success-foreground size-3.5' />}
        {!isMet && <CircleIcon className='size-3.5 opacity-60' />}
      </Swap>
      {label}
      <span className='sr-only'>, {ruleStatusOf(isMet)}</span>
    </li>
  );
}

export default function Input65() {
  const [password, setPassword] = useState(SAMPLE_PASSWORD);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isScrambling, setIsScrambling] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [direction, setDirection] = useState(1);
  const [announcement, setAnnouncement] = useState('');
  const { pressed, press } = usePress<'generate' | 'copy'>();
  const { schedule, clearAll } = useTimeouts();
  const shouldReduceMotion = usePrefersReducedMotion();
  const labelVariants = labelVariantsOf(shouldReduceMotion);
  const level = levelOf(password);
  const current = LEVELS[level];
  const showsText = isRevealed || isScrambling;

  function writePassword(next: string) {
    const nextLevel = levelOf(next);
    setDirection(directionBetween(level, nextLevel));
    setPassword(next);
  }

  function changePassword(event: ChangeEvent<HTMLInputElement>) {
    const next = event.currentTarget.value;
    const nextLevel = levelOf(next);
    clearAll();
    setIsScrambling(false);
    writePassword(next);
    if (nextLevel !== level) {
      setAnnouncement(strengthMessageOf(nextLevel));
    }
  }

  function generate() {
    const target = strongPasswordOf(GENERATED_LENGTH);
    clearAll();
    setIsCopied(false);
    if (shouldReduceMotion) {
      writePassword(target);
      return 0;
    }
    setIsScrambling(true);
    for (let settled = 0; settled <= GENERATED_LENGTH; settled += 1) {
      const frame = scrambleFrameOf(target, settled);
      schedule(() => writePassword(frame), settled * SCRAMBLE_FRAME_MS);
    }
    schedule(() => setIsScrambling(false), SCRAMBLE_MS);
    return SCRAMBLE_MS;
  }

  function generateFromPerson() {
    const durationMs = generate();
    schedule(() => setAnnouncement(GENERATED_MESSAGE), durationMs);
  }

  function showCopied() {
    setIsCopied(true);
    schedule(() => setIsCopied(false), COPIED_FOR_MS);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(password);
    } catch {
      setAnnouncement('The password could not be copied');
      return;
    }
    showCopied();
    setAnnouncement('Password copied');
  }

  function beginTyping() {
    clearAll();
    setIsScrambling(false);
    setIsCopied(false);
    setIsRevealed(true);
    writePassword('');
  }

  function startOver() {
    clearAll();
    setIsScrambling(false);
    setIsCopied(false);
    setIsRevealed(false);
    setDirection(1);
    setPassword(SAMPLE_PASSWORD);
  }

  const steps: AutoplayStep[] = [
    { after: 2600, run: beginTyping },
    ...typingSteps('Sunrise2026', writePassword, {
      startAfter: 600,
      characterMs: 85,
    }),
    { after: 1500, run: () => press('generate') },
    { after: PRESS_LEAD_MS, run: () => generate() },
    { after: 2400, run: () => press('copy') },
    { after: PRESS_LEAD_MS, run: showCopied },
  ];
  const { ref, isAutoplaying } = useAutoplay(steps, {
    loopAfter: 2600,
    onReset: startOver,
  });

  useKeptHeight(ref);

  const spokenMessage = spokenUnless(isAutoplaying, announcement);
  const copyLabel = 'Copy the password';

  return (
    <div
      ref={ref}
      className='@container flex min-h-[17rem] w-full max-w-xs flex-col gap-3'
    >
      <Field>
        <FieldLabel>Password</FieldLabel>
        <div className='relative'>
          <Input
            type={inputTypeOf(showsText)}
            autoComplete='new-password'
            placeholder='Choose a password'
            value={password}
            onChange={changePassword}
            className='pe-9'
          />
          <Button
            variant='ghost'
            size='icon-sm'
            aria-label={revealLabelOf(isRevealed)}
            aria-pressed={isRevealed}
            onClick={() => setIsRevealed(!isRevealed)}
            className='text-muted-foreground hover:text-foreground absolute end-0.5 top-0.5 size-7'
          >
            <Swap swapKey={String(isRevealed)}>
              {isRevealed && <EyeOffIcon className='size-4' />}
              {!isRevealed && <EyeIcon className='size-4' />}
            </Swap>
          </Button>
        </div>
      </Field>
      <div className='flex gap-2'>
        <Button
          variant='outline'
          size='sm'
          onClick={generateFromPerson}
          className={pressedQuietOf(pressed === 'generate')}
        >
          <KeyIcon className='size-3.5 opacity-60' />
          Generate
        </Button>
        <Button
          variant='outline'
          size='sm'
          disabled={password.length === 0}
          onClick={copy}
          aria-label={copyLabel}
          className={pressedQuietOf(pressed === 'copy')}
        >
          <Swap swapKey={String(isCopied)}>
            {isCopied && (
              <CheckIcon className='text-success-foreground size-3.5' />
            )}
            {!isCopied && <CopyIcon className='size-3.5 opacity-60' />}
          </Swap>
          Copy
        </Button>
      </div>
      <div className='flex flex-col gap-2'>
        <div
          className='flex gap-1.5'
          role='meter'
          aria-label='Password strength'
          aria-valuemin={0}
          aria-valuemax={MAX_LEVEL}
          aria-valuenow={level}
          aria-valuetext={current.label}
        >
          {SEGMENTS.map((index) => (
            <span
              key={index}
              className='bg-foreground/[0.08] h-1 flex-1 overflow-hidden rounded-full'
            >
              <span
                className={cn(
                  SEGMENT_FILL,
                  segmentFillOf(index, level),
                  current.tone
                )}
                style={segmentDelayOf(index, direction)}
              />
            </span>
          ))}
        </div>
        <div className='flex items-center justify-between text-xs'>
          <span className='text-muted-foreground'>Password strength</span>
          <span className='relative flex font-medium' aria-hidden='true'>
            <AnimatePresence
              mode='popLayout'
              initial={false}
              custom={direction}
            >
              <motion.span
                key={current.label}
                className={cn('flex', current.ink)}
                custom={direction}
                variants={labelVariants}
                initial='enter'
                animate='visible'
                exit='exit'
                transition={LABEL_TRANSITION}
              >
                {current.label}
              </motion.span>
            </AnimatePresence>
          </span>
        </div>
      </div>
      <ul
        aria-label='Password rules'
        className='grid gap-1.5 @[17rem]:grid-cols-2'
      >
        {RULES.map((rule) => (
          <RuleRow
            key={rule.label}
            label={rule.label}
            isMet={rule.isMetBy(password)}
          />
        ))}
      </ul>
      <LiveRegion message={spokenMessage} />
    </div>
  );
}
