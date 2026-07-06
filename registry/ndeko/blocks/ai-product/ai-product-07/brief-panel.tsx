'use client';

import { motion, type Transition } from 'motion/react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { EASE_OUT_STRONG } from '@/registry/ndeko/lib/motion-presets';
import { cn } from '@/registry/ndeko/lib/utils';
import { Fold } from '@/registry/ndeko/ui/chat-motion';
import { Chip } from '@/registry/ndeko/ui/chip';
import { Input } from '@/registry/ndeko/ui/input';
import { Settle, SettleItem } from '@/registry/ndeko/ui/settle';

import {
  directionOf,
  FONT_CLASS,
  FONT_LABEL,
  RESULT_INDEXES,
  type Direction,
} from './data';
import { DirectionArt, ResultDrawing } from './direction-art';
import { GenerateBar } from './generate-bar';
import type { DirectionState } from './session';

const ART_STYLE = { borderRadius: 10 };

const REVEAL: Transition = {
  duration: 0.3,
  ease: EASE_OUT_STRONG,
  delay: 0.18,
};

const REVEAL_STILL: Transition = { duration: 0.2 };

function revealOf(shouldReduceMotion: boolean) {
  if (shouldReduceMotion) {
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      transition: REVEAL_STILL,
    };
  }
  return {
    initial: { opacity: 0, y: 6 },
    animate: { opacity: 1, y: 0 },
    transition: REVEAL,
  };
}

function EmptySlot() {
  return (
    <div className='hairline-border border-foreground/20 flex min-h-48 flex-col items-start justify-center gap-1 rounded-xl border-dashed p-6'>
      <p className='text-sm font-medium'>No direction picked yet</p>
      <p className='text-muted-foreground max-w-sm text-[13px] text-pretty'>
        Its palette, type pair and three keywords land here as a brief you can
        change
      </p>
    </div>
  );
}

function PaletteChips({ direction }: { direction: Direction }) {
  return (
    <ul aria-label='Palette' className='flex flex-wrap gap-1.5'>
      {direction.swatches.map((swatch) => (
        <li key={swatch.name}>
          <Chip color={swatch.color}>{swatch.name}</Chip>
        </li>
      ))}
    </ul>
  );
}

function TypePair({ direction }: { direction: Direction }) {
  return (
    <div className='flex flex-col gap-1'>
      <p
        className={cn(
          'text-xl leading-tight font-semibold',
          FONT_CLASS[direction.display]
        )}
      >
        {FONT_LABEL[direction.display]} for headlines
      </p>
      <p className={cn('text-[13px]', FONT_CLASS[direction.text])}>
        {FONT_LABEL[direction.text]} for the text that is read at length
      </p>
    </div>
  );
}

type KeywordsProps = {
  keywords: string[];
  isLocked: boolean;
  onEdit: (index: number, text: string) => void;
};

function Keywords({ keywords, isLocked, onEdit }: KeywordsProps) {
  return (
    <ul aria-label='Keywords' className='flex flex-wrap gap-1.5'>
      {keywords.map((keyword, index) => (
        <li key={index}>
          <Input
            size='sm'
            aria-label={`Keyword ${index + 1}`}
            autoComplete='off'
            maxLength={24}
            value={keyword}
            disabled={isLocked}
            onChange={(event) => onEdit(index, event.target.value)}
            className='field-sizing-content w-auto min-w-20'
          />
        </li>
      ))}
    </ul>
  );
}

const GRID = 'grid grid-cols-2 gap-2 @lg:grid-cols-3';

const SLOT = 'bg-foreground/[0.04] overflow-hidden rounded-lg';

function ResultSlots() {
  return (
    <ul aria-hidden='true' className={GRID}>
      {RESULT_INDEXES.map((index) => (
        <li key={index} className={SLOT}>
          <span className='block aspect-[4/3]' />
        </li>
      ))}
    </ul>
  );
}

function Results({ direction }: { direction: Direction }) {
  return (
    <ul aria-label='Options' className={GRID}>
      {RESULT_INDEXES.map((index) => (
        <li key={index} className={SLOT}>
          <SettleItem>
            <ResultDrawing direction={direction} index={index} />
          </SettleItem>
        </li>
      ))}
    </ul>
  );
}

type BriefPanelProps = {
  state: DirectionState;
  pressed: string | null;
  onKeyword: (index: number, text: string) => void;
  onGenerate: () => void;
  onStartOver: () => void;
};

export function BriefPanel({
  state,
  pressed,
  onKeyword,
  onGenerate,
  onStartOver,
}: BriefPanelProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const reveal = revealOf(shouldReduceMotion);
  const pickedId = state.pickedId;
  if (pickedId === null) {
    return <EmptySlot />;
  }
  const direction = directionOf(pickedId);
  const isGenerating = state.phase === 'generating';
  const isDone = state.phase === 'done';
  const hasResults = isGenerating || isDone;

  return (
    <section
      aria-label={`Brief: ${direction.name}`}
      className='bg-card hairline-ring ring-border dark:bg-foreground/[0.03] @container flex flex-col gap-5 rounded-xl p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)] @lg:p-5'
    >
      <div className='flex flex-col gap-4 @lg:flex-row @lg:items-start'>
        <div className='w-full max-w-72 shrink-0'>
          <motion.span
            key={pickedId}
            layoutId={`art-${pickedId}`}
            style={ART_STYLE}
            className='block overflow-hidden'
          >
            <DirectionArt direction={direction} />
          </motion.span>
        </div>
        <motion.div
          key={`${pickedId}-brief`}
          initial={reveal.initial}
          animate={reveal.animate}
          transition={reveal.transition}
          className='flex min-w-0 flex-1 flex-col gap-4'
        >
          <div className='flex flex-col gap-1'>
            <h3 className='text-sm font-medium'>{direction.name}</h3>
            <p className='text-muted-foreground text-[13px] text-pretty'>
              {direction.line}
            </p>
          </div>
          <PaletteChips direction={direction} />
          <TypePair direction={direction} />
        </motion.div>
      </div>
      <motion.div
        key={`${pickedId}-keywords`}
        initial={reveal.initial}
        animate={reveal.animate}
        transition={reveal.transition}
        className='flex flex-col gap-2'
      >
        <p className='text-muted-foreground text-xs'>Keywords</p>
        <Keywords
          keywords={state.keywords}
          isLocked={isGenerating}
          onEdit={onKeyword}
        />
      </motion.div>
      <GenerateBar
        phase={state.phase}
        progress={state.progress}
        pressed={pressed}
        onGenerate={onGenerate}
        onStartOver={onStartOver}
      />
      <Fold open={hasResults}>
        {isGenerating && <ResultSlots />}
        {isDone && (
          <Settle isShown>
            <Results direction={direction} />
          </Settle>
        )}
      </Fold>
    </section>
  );
}
