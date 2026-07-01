'use client';

import { Tabs } from '@base-ui/react/tabs';
import {
  AnimatePresence,
  motion,
  useInView,
  useReducedMotion,
} from 'motion/react';
import { useEffect, useRef, useState } from 'react';

import { InstallCommand } from '@/app/blocks/_shared/install-command';
import { countLabel } from '@/lib/site';
import {
  CheckIcon,
  FileIcon,
  FolderIcon,
  SearchIcon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';

export type FoundCategory = { name: string; count: number };

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
  { id: 'own', title: 'Own it', hint: 'Every file lands in your project' },
];

const STEP_MS = 6500;
const QUERY_STEP_MS = 2200;

const INSTALLED_ITEM = 'dialog-01';

const LANDED_FILES = [
  { path: 'components/dialog-01.tsx', note: 'the component' },
  { path: 'components/ui/alert-dialog.tsx', note: 'the primitive it uses' },
  { path: 'components/ui/button.tsx', note: 'its button' },
  { path: 'app/globals.css', note: 'the theme tokens' },
];

const PANEL_SWAP = {
  initial: { opacity: 0, y: 8, filter: 'blur(4px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  exit: { opacity: 0, y: -8, filter: 'blur(4px)' },
};

const PANEL_TIMING = { duration: 0.28, ease: [0.23, 1, 0.32, 1] } as const;

const CHIP_POSITIONS = [
  'left-[8%] top-[18%] -rotate-3',
  'right-[9%] top-[14%] rotate-2',
  'left-[14%] bottom-[18%] rotate-2',
  'right-[12%] bottom-[22%] -rotate-2',
  'left-[38%] bottom-[8%] rotate-1',
  'right-[34%] top-[6%] -rotate-1',
];

const FILE_DELAY_START = 0.12;
const FILE_DELAY_STEP = 0.08;

function fileTimingOf(index: number) {
  const offset = index * FILE_DELAY_STEP;
  const delay = FILE_DELAY_START + offset;
  return { ...PANEL_TIMING, delay };
}

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

function FindPanel({
  categories,
  isRunning,
}: {
  categories: FoundCategory[];
  isRunning: boolean;
}) {
  const [queryIndex, setQueryIndex] = useState(0);
  const found = categories[queryIndex];
  const chips = categories.slice(0, CHIP_POSITIONS.length);

  useEffect(() => {
    if (!isRunning) {
      return;
    }
    function advance() {
      setQueryIndex((current) => nextIndexOf(current, categories.length));
    }
    const interval = window.setInterval(advance, QUERY_STEP_MS);
    return () => window.clearInterval(interval);
  }, [categories.length, isRunning]);

  return (
    <div className='relative flex h-full items-center justify-center px-4'>
      {chips.map((category, index) => (
        <span
          key={category.name}
          aria-hidden='true'
          className={cn(
            'bg-card hairline-ring ring-border text-muted-foreground absolute hidden rounded-lg px-2.5 py-1 text-xs shadow-[0_2px_6px_-2px_rgb(0_0_0/0.12)] sm:block',
            CHIP_POSITIONS[index]
          )}
        >
          {category.name}
        </span>
      ))}
      <div className='flex w-full max-w-sm flex-col gap-3'>
        <div className='bg-card hairline-ring ring-border flex items-center gap-2.5 rounded-full px-4 py-3 shadow-[0_8px_24px_-12px_rgb(30_27_75/0.25)]'>
          <SearchIcon className='text-muted-foreground size-4' />
          <AnimatePresence mode='popLayout' initial={false}>
            <motion.span
              key={found.name}
              initial={PANEL_SWAP.initial}
              animate={PANEL_SWAP.animate}
              exit={PANEL_SWAP.exit}
              transition={PANEL_TIMING}
              className='text-sm'
            >
              {found.name}
            </motion.span>
          </AnimatePresence>
        </div>
        <p className='text-muted-foreground text-center text-xs tabular-nums'>
          {`${countLabel(found.count, 'component', 'components')} in ${found.name}`}
        </p>
      </div>
    </div>
  );
}

function InstallPanel() {
  return (
    <div className='flex h-full flex-col items-center justify-center gap-4 px-4'>
      <p className='text-muted-foreground text-center text-sm'>
        Pick your package manager, then copy.
      </p>
      <InstallCommand
        itemName={INSTALLED_ITEM}
        className='bg-card hairline-ring ring-border w-full max-w-md shadow-[0_8px_24px_-12px_rgb(30_27_75/0.25)]'
      />
    </div>
  );
}

function OwnPanel() {
  return (
    <div className='flex h-full items-center justify-center px-4'>
      <ul className='bg-card hairline-ring ring-border flex w-full max-w-md flex-col gap-1 rounded-xl p-2 shadow-[0_8px_24px_-12px_rgb(30_27_75/0.25)]'>
        <li className='text-muted-foreground flex items-center gap-2 px-2 py-1.5 text-xs'>
          <FolderIcon className='size-4' />
          your-project
        </li>
        {LANDED_FILES.map((file, index) => (
          <motion.li
            key={file.path}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={fileTimingOf(index)}
            className='bg-foreground/[0.03] flex items-center gap-2 rounded-lg px-2.5 py-2'
          >
            <FileIcon className='text-muted-foreground size-4 shrink-0' />
            <code className='min-w-0 flex-1 truncate font-mono text-xs'>
              {file.path}
            </code>
            <span className='text-muted-foreground hidden text-xs sm:inline'>
              {file.note}
            </span>
            <CheckIcon className='text-success-foreground size-4 shrink-0' />
          </motion.li>
        ))}
      </ul>
    </div>
  );
}

function ProgressFill({
  isActive,
  isRunning,
  onDone,
}: {
  isActive: boolean;
  isRunning: boolean;
  onDone: () => void;
}) {
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

/** Three steps that take turns on their own, with the panel of the current one under them. */
export function HowItWorks({ categories }: { categories: FoundCategory[] }) {
  const [activeId, setActiveId] = useState(STEPS[0].id);
  const [isPaused, setIsPaused] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(rootRef, { margin: '-20% 0px' });
  const prefersReducedMotion = useReducedMotion();
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
      <Tabs.Root
        value={activeId}
        onValueChange={pickStep}
        className='flex flex-col gap-8'
      >
        <Tabs.List
          aria-label='How it works'
          className='mx-auto grid w-full max-w-3xl grid-cols-3 gap-3 sm:gap-6'
        >
          {STEPS.map((step, index) => {
            const isActive = step.id === activeId;
            return (
              <Tabs.Tab
                key={step.id}
                value={step.id}
                className='group focus-visible:ring-ring/25 flex flex-col items-center gap-2 rounded-xl pb-1 text-center outline-none focus-visible:ring-[3px]'
              >
                <span className='bg-foreground/[0.08] relative h-1 w-full overflow-hidden rounded-full'>
                  <ProgressFill
                    isActive={isActive}
                    isRunning={isRunning}
                    onDone={showNextStep}
                  />
                </span>
                <span
                  className={cn(
                    'mt-2 flex size-6 items-center justify-center rounded-md text-xs font-semibold tabular-nums transition-colors',
                    isActive && 'bg-primary text-primary-foreground',
                    !isActive && 'bg-foreground/[0.08] text-muted-foreground'
                  )}
                >
                  {index + 1}
                </span>
                <span
                  className={cn(
                    'text-sm font-semibold transition-colors sm:text-base',
                    !isActive && 'text-muted-foreground'
                  )}
                >
                  {step.title}
                </span>
                <span className='text-muted-foreground hidden text-sm sm:block'>
                  {step.hint}
                </span>
              </Tabs.Tab>
            );
          })}
        </Tabs.List>
        <div className='bg-card hairline-ring ring-border relative h-80 overflow-hidden rounded-2xl bg-[radial-gradient(60%_80%_at_50%_0%,color-mix(in_oklab,var(--primary)_8%,transparent),transparent)] shadow-[0_1px_2px_rgb(0_0_0/0.04)] sm:h-96'>
          <AnimatePresence mode='wait' initial={false}>
            <motion.div
              key={activeId}
              initial={PANEL_SWAP.initial}
              animate={PANEL_SWAP.animate}
              exit={PANEL_SWAP.exit}
              transition={PANEL_TIMING}
              className='h-full'
            >
              <Tabs.Panel value={activeId} keepMounted className='h-full'>
                <ActivePanel
                  activeId={activeId}
                  categories={categories}
                  isRunning={isRunning}
                />
              </Tabs.Panel>
            </motion.div>
          </AnimatePresence>
        </div>
      </Tabs.Root>
    </div>
  );
}

function ActivePanel({
  activeId,
  categories,
  isRunning,
}: {
  activeId: string;
  categories: FoundCategory[];
  isRunning: boolean;
}) {
  if (activeId === 'install') {
    return <InstallPanel />;
  }
  if (activeId === 'own') {
    return <OwnPanel />;
  }
  return <FindPanel categories={categories} isRunning={isRunning} />;
}
