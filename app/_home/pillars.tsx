'use client';

import { AnimatePresence, motion, useInView } from 'motion/react';
import { useEffect, useRef, useState, type CSSProperties } from 'react';

import { CopyButton } from '@/app/_site/copy-button';
import { CursorMark, V0Mark } from '@/app/_site/open-in/tool-marks';
import {
  ClaudeCodeMark,
  WindsurfMark,
} from '@/app/mcp/_components/client-marks';
import { WordRoll } from '@/components/core/word-roll';
import { installCommandOf, REGISTRY_URL } from '@/lib/site';
import { CheckIcon, LoaderCircleIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import { Switch } from '@/registry/ndeko/ui/switch';

import { Reveal } from './reveal';
import { CARD_TEXT, CARD_TITLE, STAGGER_MS } from './section-heading';
import { MOTION_PIECES } from './showcase-pieces';
import { usePrefersReducedMotion } from './use-prefers-reduced-motion';

type SaveState = 'idle' | 'saving' | 'saved';

const SAVE_STEPS: SaveState[] = ['idle', 'saving', 'saved'];
const SAVE_STEP_MS = 1400;
const ITEM_STEP_MS = 2400;
const SWATCH_STEP_MS = 2400;

/** Real items of the registry, so the command shown is one that works as typed. */
const ITEMS = ['dialog-01', 'tabs-01', 'button-01'];
const ITEM_FILES = ITEMS.map((item) => `${item}.json`);

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
  'relative flex h-44 items-center justify-center overflow-hidden rounded-xl bg-foreground/[0.03] px-3';

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
    <Button size='lg' className='min-w-36 overflow-hidden'>
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

function CommandCard({ isRunning }: { isRunning: boolean }) {
  const step = useLoop(ITEM_STEP_MS, ITEMS.length, isRunning);
  const item = ITEMS[step];
  const command = installCommandOf(item);

  return (
    <div className='flex w-full max-w-80 flex-col gap-3'>
      <div className='bg-card hairline-ring ring-border flex items-center gap-1 rounded-xl py-2 ps-3 pe-1.5 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
        <code className='min-w-0 flex-1 font-mono text-xs leading-5'>
          <span className='text-muted-foreground block'>
            npx shadcn@latest add
          </span>
          <span className='flex whitespace-nowrap'>
            <span className='text-muted-foreground min-w-0 truncate'>
              {`${REGISTRY_URL}/`}
            </span>
            <WordRoll text={`${item}.json`} labels={ITEM_FILES} />
          </span>
        </code>
        <CopyButton value={command} label='Copy the install command' />
      </div>
      <div
        aria-hidden='true'
        className='text-foreground/60 flex items-center justify-center gap-4'
      >
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
        className='bg-card hairline-ring ring-border flex items-center gap-3 rounded-xl px-3 py-2.5 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'
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
                'focus-visible:ring-ring/40 ring-offset-card size-6 rounded-full ring-offset-2 transition-[box-shadow,scale] duration-200 outline-none focus-visible:ring-[3px] active:scale-95',
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
  order: number;
  isDecorative?: boolean;
  /** The first reason gets the tall card on wide screens, with a stage that fills it. */
  isLead?: boolean;
  children: React.ReactNode;
};

function pillarLayoutOf(isLead: boolean) {
  if (isLead) {
    return 'md:col-span-2';
  }
  return '';
}

function stageSizeOf(isLead: boolean) {
  if (isLead) {
    return 'h-auto min-h-56 py-10';
  }
  return 'h-44';
}

function Pillar({
  title,
  description,
  order,
  isDecorative = false,
  isLead = false,
  children,
}: PillarProps) {
  return (
    <Reveal
      as='li'
      delay={order * STAGGER_MS}
      className={cn(
        'bg-card hairline-ring ring-border flex min-w-0 flex-col gap-5 rounded-2xl p-2 pb-6 shadow-[0_1px_2px_rgb(0_0_0/0.04)]',
        pillarLayoutOf(isLead)
      )}
    >
      <div
        aria-hidden={isDecorative}
        inert={isDecorative}
        className={cn(STAGE, stageSizeOf(isLead))}
      >
        {children}
      </div>
      <div className='flex flex-col gap-2 px-4'>
        <h3 className={CARD_TITLE}>{title}</h3>
        <p className={CARD_TEXT}>{description}</p>
      </div>
    </Reveal>
  );
}

/** The saving button and three catalogue pieces, each named by the micro-interaction it carries. */
function MotionStage({ isRunning }: { isRunning: boolean }) {
  return (
    <div className='grid w-full max-w-3xl grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4'>
      <figure className='flex flex-col items-center gap-3'>
        <SavingButton isRunning={isRunning} />
        <figcaption className='text-muted-foreground font-mono text-xs'>
          Morph
        </figcaption>
      </figure>
      {MOTION_PIECES.map(({ motion: motionName, piece }) => (
        <figure key={piece.name} className='flex flex-col items-center gap-3'>
          <piece.Piece />
          <figcaption className='text-muted-foreground font-mono text-xs'>
            {motionName}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

/** Three reasons, each shown by pieces that move rather than an icon. */
export function Pillars() {
  const listRef = useRef<HTMLUListElement>(null);
  const isInView = useInView(listRef, { margin: '-15% 0px' });
  const prefersReducedMotion = usePrefersReducedMotion();
  const isRunning = isInView && !prefersReducedMotion;

  return (
    <ul
      ref={listRef}
      className='grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-2'
    >
      <Pillar
        order={0}
        isLead
        title='Motion on every change of state'
        description='A button that saves says so, a tab slides to the new choice, a task strikes through when it is done. The motion ships with the component, and you can try each one here.'
      >
        <MotionStage isRunning={isRunning} />
      </Pillar>
      <Pillar
        order={1}
        title='Copy it, or ask your editor'
        description='Every item installs with the shadcn CLI and brings what it uses. Through MCP, your editor can search and fetch it for you.'
      >
        <CommandCard isRunning={isRunning} />
      </Pillar>
      <Pillar
        order={2}
        title='One design language, your colours'
        description='Tokens for light and dark, hairline surfaces, soft materials. Change the primary colour and every component follows.'
      >
        <ThemePreview isRunning={isRunning} />
      </Pillar>
    </ul>
  );
}
