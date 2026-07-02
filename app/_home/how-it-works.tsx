'use client';

import { Tabs as TabsPrimitive } from '@base-ui/react/tabs';
import { AnimatePresence, motion, useInView } from 'motion/react';
import Link from 'next/link';
import { useEffect, useRef, useState, type ReactNode } from 'react';

import { InstallCommand } from '@/app/blocks/_shared/install-command';
import { Terminal, type TerminalLine } from '@/components/core/terminal';
import { WordRoll } from '@/components/core/word-roll';
import { countLabel, installCommandOf } from '@/lib/site';
import { ArrowUpRightIcon, SearchIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import { Tabs, TabsList, TabsTab } from '@/registry/ndeko/ui/tabs';

import { ROW_TITLE } from './section-heading';
import { PIECE_BY_CATEGORY, pieceHrefOf } from './showcase-pieces';
import { usePrefersReducedMotion } from './use-prefers-reduced-motion';

export type FoundCategory = { slug: string; name: string; count: number };

type Step = {
  id: string;
  title: string;
  hint: string;
};

const STEPS: Step[] = [
  { id: 'find', title: 'Find it', hint: 'Search or browse a family' },
  {
    id: 'install',
    title: 'Install it',
    hint: 'One command, any package manager',
  },
  { id: 'own', title: 'Own it', hint: 'The file is yours to change' },
];

const STEP_MS = 7000;
const CYCLE_MS = 2200;

const INSTALLED_ITEM = 'dialog-01';

const INSTALL_LINES: TerminalLine[] = [
  { kind: 'command', text: installCommandOf(INSTALLED_ITEM) },
  { kind: 'output', text: '✔ Checking registry.', tone: 'success' },
  { kind: 'output', text: '✔ Installing dependencies.', tone: 'success' },
  { kind: 'output', text: '✔ Created 3 files:', tone: 'success' },
  { kind: 'output', text: '  - components/dialog-01.tsx', tone: 'muted' },
  { kind: 'output', text: '  - components/ui/alert-dialog.tsx', tone: 'muted' },
  { kind: 'output', text: '  - components/ui/button.tsx', tone: 'muted' },
];

type Radius = { id: string; label: string; token: string };

const RADII: Radius[] = [
  { id: 'full', label: 'Full', token: 'rounded-full' },
  { id: 'large', label: 'Large', token: 'rounded-lg' },
  { id: 'small', label: 'Small', token: 'rounded-sm' },
];

const RADIUS_TOKENS = RADII.map((radius) => radius.token);

const SWAP = {
  initial: { opacity: 0, y: 8, filter: 'blur(4px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  exit: { opacity: 0, y: -8, filter: 'blur(4px)' },
};

const SWAP_TIMING = { duration: 0.28, ease: [0.23, 1, 0.32, 1] } as const;

const ROW_TRAVEL = { type: 'spring', duration: 0.3, bounce: 0 } as const;

const PANEL_PADDING = 'h-full p-5 sm:p-8';

function nextIndexOf(current: number, length: number) {
  const next = current + 1;
  return next % length;
}

function stepIndexOf(id: string) {
  const index = STEPS.findIndex((step) => step.id === id);
  if (index < 0) {
    return 0;
  }
  return index;
}

/** Moves through a list on a timer while `isCycling`, and stops for good once the visitor picks. */
function useCycle(length: number, isRunning: boolean) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [hasPicked, setHasPicked] = useState(false);
  const isCycling = isRunning && !hasPicked;

  useEffect(() => {
    if (!isCycling) {
      return;
    }
    function advance() {
      setActiveIndex((current) => nextIndexOf(current, length));
    }
    const interval = window.setInterval(advance, CYCLE_MS);
    return () => window.clearInterval(interval);
  }, [length, isCycling]);

  function pick(index: number) {
    setHasPicked(true);
    setActiveIndex(index);
  }

  return { activeIndex, pick };
}

type FindRowProps = {
  category: FoundCategory;
  index: number;
  isActive: boolean;
  onPick: (index: number) => void;
};

function FindRow({ category, index, isActive, onPick }: FindRowProps) {
  function pickThisRow() {
    onPick(index);
  }

  return (
    <li>
      <Link
        href={`/components/${category.slug}`}
        onPointerEnter={pickThisRow}
        onFocus={pickThisRow}
        className='focus-visible:ring-ring/25 relative flex h-9 items-center justify-between gap-4 rounded-lg px-3 text-sm outline-none focus-visible:ring-[3px]'
      >
        {isActive && (
          <motion.span
            layoutId='find-row'
            transition={ROW_TRAVEL}
            aria-hidden='true'
            className='bg-foreground/[0.05] absolute inset-0 rounded-lg'
          />
        )}
        <span className={cn('relative', isActive && 'font-medium')}>
          {category.name}
        </span>
        <span className='text-muted-foreground relative text-xs tabular-nums'>
          {countLabel(category.count, 'component', 'components')}
        </span>
      </Link>
    </li>
  );
}

/** The real component of the category found, in a stage, named so it can be opened in the catalogue. */
function LivePiece({ slug }: { slug: string }) {
  const showcase = PIECE_BY_CATEGORY[slug];
  if (!showcase) {
    return null;
  }
  const { name, Piece } = showcase;

  return (
    <div className='bg-foreground/[0.03] hidden h-full min-h-0 flex-col rounded-2xl p-4 md:flex'>
      <AnimatePresence mode='popLayout' initial={false}>
        <motion.div
          key={name}
          initial={SWAP.initial}
          animate={SWAP.animate}
          exit={SWAP.exit}
          transition={SWAP_TIMING}
          className='flex min-h-0 flex-1 flex-col gap-3'
        >
          <Link
            href={pieceHrefOf(name)}
            className='text-muted-foreground hover:text-foreground focus-visible:ring-ring/25 inline-flex w-fit items-center gap-1 rounded-sm font-mono text-xs transition-colors outline-none focus-visible:ring-[3px]'
          >
            {name}
            <ArrowUpRightIcon className='size-3' />
          </Link>
          <div className='flex min-h-0 flex-1 items-center justify-center'>
            <Piece />
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function FindPanel({
  categories,
  isRunning,
}: {
  categories: FoundCategory[];
  isRunning: boolean;
}) {
  const { activeIndex, pick } = useCycle(categories.length, isRunning);
  const active = categories[activeIndex];

  return (
    <div
      className={cn(
        PANEL_PADDING,
        'grid gap-6 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] md:items-stretch'
      )}
    >
      <div className='flex flex-col justify-center gap-3'>
        <div className='bg-background hairline-ring ring-border flex h-11 items-center gap-2.5 rounded-xl px-3.5 shadow-[0_1px_2px_rgb(0_0_0/0.05)]'>
          <SearchIcon className='text-muted-foreground size-4' />
          <AnimatePresence mode='popLayout' initial={false}>
            <motion.span
              key={active.slug}
              initial={SWAP.initial}
              animate={SWAP.animate}
              exit={SWAP.exit}
              transition={SWAP_TIMING}
              className='text-sm'
            >
              {active.name}
            </motion.span>
          </AnimatePresence>
        </div>
        <ul className='flex flex-col gap-0.5'>
          {categories.map((category, index) => (
            <FindRow
              key={category.slug}
              category={category}
              index={index}
              isActive={index === activeIndex}
              onPick={pick}
            />
          ))}
        </ul>
      </div>
      <LivePiece slug={active.slug} />
    </div>
  );
}

function InstallPanel() {
  return (
    <div
      className={cn(
        PANEL_PADDING,
        'mx-auto flex max-w-2xl flex-col justify-center gap-4'
      )}
    >
      <InstallCommand itemName={INSTALLED_ITEM} />
      <Terminal lines={INSTALL_LINES} title='your-project' />
    </div>
  );
}

function CodeLine({ children }: { children: React.ReactNode }) {
  return <span className='block whitespace-pre'>{children}</span>;
}

function OwnPanel({ isRunning }: { isRunning: boolean }) {
  const { activeIndex, pick } = useCycle(RADII.length, isRunning);
  const radius = RADII[activeIndex];

  function pickRadius(value: unknown) {
    const index = RADII.findIndex((candidate) => candidate.id === value);
    if (index < 0) {
      return;
    }
    pick(index);
  }

  return (
    <div
      className={cn(
        PANEL_PADDING,
        'grid items-center gap-6 md:grid-cols-2 md:gap-8'
      )}
    >
      <div className='bg-background hairline-ring ring-border overflow-hidden rounded-xl shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
        <p className='text-muted-foreground flex h-10 items-center px-4 font-mono text-xs'>
          components/ui/button.tsx
        </p>
        <code className='block overflow-x-auto px-4 pb-4 font-mono text-[13px] leading-6'>
          <CodeLine>
            <span className='text-primary-ink'>const</span> buttonVariants =
            cva([
          </CodeLine>
          <CodeLine>
            <span className='text-muted-foreground'>
              {"  'inline-flex items-center',"}
            </span>
          </CodeLine>
          <CodeLine>
            <span className='text-muted-foreground'>{"  'gap-2 "}</span>
            <span className='bg-primary/10 text-primary-ink inline-flex rounded px-1'>
              <WordRoll text={radius.token} labels={RADIUS_TOKENS} />
            </span>
            <span className='text-muted-foreground'>{" font-medium',"}</span>
          </CodeLine>
          <CodeLine>
            <span className='text-muted-foreground'>{'  …'}</span>
          </CodeLine>
          <CodeLine>]);</CodeLine>
        </code>
      </div>
      <div className='flex flex-col items-center gap-6'>
        <Tabs value={radius.id} onValueChange={pickRadius}>
          <TabsList variant='segmented' aria-label='Corner radius'>
            {RADII.map((candidate) => (
              <TabsTab key={candidate.id} value={candidate.id}>
                {candidate.label}
              </TabsTab>
            ))}
          </TabsList>
        </Tabs>
        <div className='flex items-center gap-3'>
          <Button
            size='lg'
            variant='outline'
            className={cn(
              'transition-[border-radius,color,background-color,box-shadow,scale] duration-200',
              radius.token
            )}
          >
            Cancel
          </Button>
          <Button
            size='lg'
            className={cn(
              'transition-[border-radius,color,background-color,box-shadow,scale] duration-200',
              radius.token
            )}
          >
            Create project
          </Button>
        </div>
        <p className='text-muted-foreground max-w-64 text-center text-xs text-pretty'>
          Change one class in your copy and every button follows
        </p>
      </div>
    </div>
  );
}

type ProgressFillProps = {
  isActive: boolean;
  isRunning: boolean;
  onDone: () => void;
};

function ProgressFill({ isActive, isRunning, onDone }: ProgressFillProps) {
  if (!isActive) {
    return null;
  }
  if (!isRunning) {
    return <span className='bg-primary absolute inset-0 rounded-full' />;
  }
  return (
    <motion.span
      initial={{ scaleX: 0 }}
      animate={{ scaleX: 1 }}
      transition={{ duration: STEP_MS / 1000, ease: 'linear' }}
      onAnimationComplete={onDone}
      className='bg-primary absolute inset-0 origin-left rounded-full'
    />
  );
}

type ActivePanelProps = {
  activeId: string;
  categories: FoundCategory[];
  isRunning: boolean;
};

function ActivePanel({ activeId, categories, isRunning }: ActivePanelProps) {
  if (activeId === 'install') {
    return <InstallPanel />;
  }
  if (activeId === 'own') {
    return <OwnPanel isRunning={isRunning} />;
  }
  return <FindPanel categories={categories} isRunning={isRunning} />;
}

/** Three steps that take turns on their own, each one a working piece: a search, a terminal, a file. */
type HowItWorksProps = {
  categories: FoundCategory[];
  /** The section heading, set above the steps in the first column. */
  heading: ReactNode;
};

export function HowItWorks({ categories, heading }: HowItWorksProps) {
  const [activeId, setActiveId] = useState(STEPS[0].id);
  const [isPaused, setIsPaused] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(rootRef, { margin: '-20% 0px' });
  const prefersReducedMotion = usePrefersReducedMotion();
  const canPlay = isInView && !prefersReducedMotion;
  const isRunning = canPlay && !isPaused;

  function showNextStep() {
    const index = stepIndexOf(activeId);
    const nextIndex = nextIndexOf(index, STEPS.length);
    setActiveId(STEPS[nextIndex].id);
  }

  function pickStep(value: unknown) {
    setActiveId(String(value));
  }

  function pause() {
    setIsPaused(true);
  }

  function resume() {
    setIsPaused(false);
  }

  return (
    <div
      ref={rootRef}
      onPointerEnter={pause}
      onPointerLeave={resume}
      onFocusCapture={pause}
      onBlurCapture={resume}
    >
      <TabsPrimitive.Root
        value={activeId}
        onValueChange={pickStep}
        className='grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-center lg:gap-14'
      >
        <div className='flex flex-col gap-10'>
          {heading}
          <TabsPrimitive.List
            aria-label='How it works'
            className='grid grid-cols-3 gap-3 lg:grid-cols-1 lg:gap-1'
          >
            {STEPS.map((step, index) => {
              const isActive = step.id === activeId;
              return (
                <TabsPrimitive.Tab
                  key={step.id}
                  value={step.id}
                  className={cn(
                    'focus-visible:ring-ring/25 relative flex flex-col items-center gap-2 overflow-hidden rounded-xl px-2 pt-3 pb-4 text-center transition-colors duration-200 outline-none focus-visible:ring-[3px] lg:flex-row lg:items-start lg:gap-4 lg:px-4 lg:py-4 lg:text-left',
                    isActive && 'lg:bg-foreground/[0.04]',
                    !isActive && 'lg:hover:bg-foreground/[0.02]'
                  )}
                >
                  <span
                    className={cn(
                      'flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-semibold tabular-nums transition-colors duration-200',
                      isActive && 'bg-primary text-primary-foreground',
                      !isActive && 'bg-foreground/[0.08] text-muted-foreground'
                    )}
                  >
                    {index + 1}
                  </span>
                  <span className='flex flex-col gap-1'>
                    <span
                      className={cn(
                        ROW_TITLE,
                        'transition-colors duration-200',
                        !isActive && 'text-muted-foreground'
                      )}
                    >
                      {step.title}
                    </span>
                    <span className='text-muted-foreground hidden text-sm lg:block'>
                      {step.hint}
                    </span>
                  </span>
                  <span className='bg-foreground/[0.08] absolute inset-x-2 bottom-0 h-0.5 overflow-hidden rounded-full lg:inset-x-4 lg:bottom-1.5'>
                    <ProgressFill
                      isActive={isActive}
                      isRunning={isRunning}
                      onDone={showNextStep}
                    />
                  </span>
                </TabsPrimitive.Tab>
              );
            })}
          </TabsPrimitive.List>
        </div>
        <div className='bg-card hairline-ring ring-border relative h-[27rem] overflow-hidden rounded-3xl shadow-[0_1px_2px_rgb(0_0_0/0.04)] md:h-[28rem]'>
          <AnimatePresence mode='wait' initial={false}>
            <motion.div
              key={activeId}
              initial={SWAP.initial}
              animate={SWAP.animate}
              exit={SWAP.exit}
              transition={SWAP_TIMING}
              className='h-full'
            >
              <TabsPrimitive.Panel
                value={activeId}
                keepMounted
                className='h-full'
              >
                <ActivePanel
                  activeId={activeId}
                  categories={categories}
                  isRunning={isRunning}
                />
              </TabsPrimitive.Panel>
            </motion.div>
          </AnimatePresence>
        </div>
      </TabsPrimitive.Root>
    </div>
  );
}
