'use client';

import {
  AnimatePresence,
  motion,
  useInView,
  useReducedMotion,
} from 'motion/react';
import { useEffect, useRef, useState, type CSSProperties } from 'react';

import {
  ClaudeCodeMark,
  WindsurfMark,
} from '@/app/mcp/_components/client-marks';
import { CursorMark, V0Mark } from '@/app/_site/open-in/tool-marks';
import {
  CheckIcon,
  CopyIcon,
  LoaderCircleIcon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import { Switch } from '@/registry/ndeko/ui/switch';

type SaveState = 'idle' | 'saving' | 'saved';

const SAVE_STEPS: SaveState[] = ['idle', 'saving', 'saved'];
const SAVE_STEP_MS = 1400;
const TYPE_STEP_MS = 55;
const TYPE_PAUSE_MS = 2200;
const SWATCH_STEP_MS = 2400;
const COMMAND = 'npx shadcn add @ndeko/dialog';

const SWAP = {
  initial: { opacity: 0, y: 6, filter: 'blur(2px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  exit: { opacity: 0, y: -6, filter: 'blur(2px)' },
};

const SWAP_TIMING = { duration: 0.2, ease: [0.23, 1, 0.32, 1] } as const;

const SWATCHES = [
  { name: 'Indigo', value: 'hsl(239 84% 67%)' },
  { name: 'Emerald', value: 'hsl(160 84% 39%)' },
  { name: 'Amber', value: 'hsl(32 95% 50%)' },
  { name: 'Rose', value: 'hsl(347 77% 55%)' },
];

const STAGE =
  'relative flex h-44 items-center justify-center overflow-hidden rounded-xl bg-[radial-gradient(70%_90%_at_50%_0%,color-mix(in_oklab,var(--primary)_10%,transparent),transparent)] bg-foreground/[0.025]';

function nextIndexOf(current: number, length: number) {
  const next = current + 1;
  return next % length;
}

function useLoop(stepMs: number, length: number, isRunning: boolean) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!isRunning) {
      return;
    }
    function advance() {
      setStep((current) => nextIndexOf(current, length));
    }
    const interval = window.setInterval(advance, stepMs);
    return () => window.clearInterval(interval);
  }, [stepMs, length, isRunning]);

  return step;
}

function SaveLabel({ state }: { state: SaveState }) {
  if (state === 'saving') {
    return (
      <span className='flex items-center gap-2'>
        <LoaderCircleIcon className='animate-spin' />
        Saving
      </span>
    );
  }
  if (state === 'saved') {
    return (
      <span className='flex items-center gap-2'>
        <CheckIcon />
        Saved
      </span>
    );
  }
  return <span>Save changes</span>;
}

function SavingButton({ isRunning }: { isRunning: boolean }) {
  const step = useLoop(SAVE_STEP_MS, SAVE_STEPS.length, isRunning);
  const state = SAVE_STEPS[step];

  return (
    <Button className='min-w-36 overflow-hidden rounded-full'>
      <AnimatePresence mode='popLayout' initial={false}>
        <motion.span
          key={state}
          initial={SWAP.initial}
          animate={SWAP.animate}
          exit={SWAP.exit}
          transition={SWAP_TIMING}
          className='flex'
        >
          <SaveLabel state={state} />
        </motion.span>
      </AnimatePresence>
    </Button>
  );
}

function useTypedText(text: string, isRunning: boolean) {
  const [length, setLength] = useState(text.length);

  useEffect(() => {
    if (!isRunning) {
      return;
    }
    let current = 0;
    let timeout = 0;
    function typeNext() {
      current += 1;
      const isDone = current > text.length;
      if (isDone) {
        current = 0;
        timeout = window.setTimeout(typeNext, TYPE_PAUSE_MS);
        return;
      }
      setLength(current);
      timeout = window.setTimeout(typeNext, TYPE_STEP_MS);
    }
    timeout = window.setTimeout(typeNext, TYPE_STEP_MS);
    return () => window.clearTimeout(timeout);
  }, [text, isRunning]);

  return text.slice(0, length);
}

function CopyState({ isComplete }: { isComplete: boolean }) {
  if (isComplete) {
    return <CheckIcon className='text-success-foreground size-4' />;
  }
  return <CopyIcon className='size-4' />;
}

function CommandCard({ isRunning }: { isRunning: boolean }) {
  const typed = useTypedText(COMMAND, isRunning);
  const isComplete = typed.length === COMMAND.length;

  return (
    <div className='flex w-[min(19rem,100%)] flex-col gap-3'>
      <div className='bg-card hairline-ring ring-border flex items-center gap-2 rounded-xl px-3 py-2.5 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
        <code className='min-w-0 flex-1 truncate font-mono text-[12px]'>
          <span className='text-muted-foreground'>$ </span>
          {typed}
          <span className='bg-primary ml-px inline-block h-3.5 w-px translate-y-[2px] motion-safe:animate-pulse' />
        </code>
        <span className='text-muted-foreground flex size-6 items-center justify-center'>
          <AnimatePresence mode='popLayout' initial={false}>
            <motion.span
              key={String(isComplete)}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={SWAP_TIMING}
              className='flex'
            >
              <CopyState isComplete={isComplete} />
            </motion.span>
          </AnimatePresence>
        </span>
      </div>
      <div className='text-foreground/60 flex items-center justify-center gap-4'>
        <CursorMark className='size-4' />
        <ClaudeCodeMark className='size-4' />
        <V0Mark className='size-4' />
        <WindsurfMark className='size-4' />
      </div>
    </div>
  );
}

function swatchStyleOf(value: string): CSSProperties {
  return { backgroundColor: value };
}

function previewStyleOf(value: string) {
  return { '--primary': value, '--ring': value } as CSSProperties;
}

function ThemePreview({ isRunning }: { isRunning: boolean }) {
  const autoStep = useLoop(SWATCH_STEP_MS, SWATCHES.length, isRunning);
  const [pickedIndex, setPickedIndex] = useState<number | null>(null);
  const hasPicked = pickedIndex !== null;
  let activeIndex = autoStep;
  if (hasPicked) {
    activeIndex = pickedIndex;
  }
  const active = SWATCHES[activeIndex];

  return (
    <div className='flex flex-col items-center gap-4'>
      <div
        style={previewStyleOf(active.value)}
        className='bg-card hairline-ring ring-border flex items-center gap-3 rounded-xl px-3 py-2.5 shadow-[0_1px_2px_rgb(0_0_0/0.04)] transition-colors'
      >
        <Switch defaultChecked aria-label='Preview switch' />
        <span className='bg-primary text-primary-foreground rounded-full px-3 py-1 text-xs font-medium transition-colors duration-300'>
          Publish
        </span>
      </div>
      <div
        role='radiogroup'
        aria-label='Primary colour'
        className='flex items-center gap-2'
      >
        {SWATCHES.map((swatch, index) => {
          const isActive = index === activeIndex;

          function pick() {
            setPickedIndex(index);
          }

          return (
            <button
              key={swatch.name}
              type='button'
              role='radio'
              aria-checked={isActive}
              aria-label={swatch.name}
              onClick={pick}
              style={swatchStyleOf(swatch.value)}
              className={cn(
                'focus-visible:ring-ring/40 ring-offset-card size-6 rounded-full ring-offset-2 transition-[box-shadow,transform] duration-200 outline-none focus-visible:ring-[3px] active:scale-95',
                isActive && 'ring-foreground/30 ring-2'
              )}
            />
          );
        })}
      </div>
    </div>
  );
}

type PillarProps = {
  title: string;
  description: string;
  isDecorative?: boolean;
  children: React.ReactNode;
};

function Pillar({
  title,
  description,
  isDecorative = false,
  children,
}: PillarProps) {
  return (
    <li className='bg-card hairline-ring ring-border flex flex-col gap-5 rounded-2xl p-2 pb-6 shadow-[0_1px_2px_rgb(0_0_0/0.04),0_12px_32px_-20px_rgb(30_27_75/0.18)]'>
      <div aria-hidden={isDecorative} inert={isDecorative} className={STAGE}>
        {children}
      </div>
      <div className='flex flex-col gap-2 px-4 text-center'>
        <h3 className='text-lg font-semibold tracking-tight'>{title}</h3>
        <p className='text-muted-foreground text-sm text-pretty'>
          {description}
        </p>
      </div>
    </li>
  );
}

/** Three reasons, each shown by a piece that moves rather than an icon. */
export function Pillars() {
  const listRef = useRef<HTMLUListElement>(null);
  const isInView = useInView(listRef, { margin: '-15% 0px' });
  const prefersReducedMotion = useReducedMotion();
  const isRunning = isInView && !prefersReducedMotion;

  return (
    <ul ref={listRef} className='grid gap-5 md:grid-cols-3'>
      <Pillar
        title='Motion on every change of state'
        description='A button that saves says so, a dialog grows to its next step, a tab slides to the new choice. The motion ships with the component.'
        isDecorative
      >
        <SavingButton isRunning={isRunning} />
      </Pillar>
      <Pillar
        title='Copy it, or ask your editor'
        description='Every item installs with the shadcn CLI and brings what it uses. Through MCP, your editor can search and fetch it for you.'
        isDecorative
      >
        <CommandCard isRunning={isRunning} />
      </Pillar>
      <Pillar
        title='One design language, your colours'
        description='Tokens for light and dark, hairline surfaces, soft materials. Change the primary colour and every component follows.'
      >
        <ThemePreview isRunning={isRunning} />
      </Pillar>
    </ul>
  );
}
