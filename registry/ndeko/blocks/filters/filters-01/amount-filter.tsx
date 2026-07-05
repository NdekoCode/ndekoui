'use client';

import { Slider as SliderPrimitive } from '@base-ui/react/slider';
import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
} from 'motion/react';
import { useState } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { ChevronDownIcon, XIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Button } from '@/registry/ndeko/ui/button';
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from '@/registry/ndeko/ui/popover';

import {
  AMOUNT_BOUNDS,
  AMOUNT_PRESETS,
  type AmountPreset,
  type AmountRange,
  type Invoice,
} from './data';
import {
  CURRENCY_FORMAT,
  CURRENCY_LOCALE,
  FULL_RANGE,
  formatAmount,
  histogramOf,
  invoiceCountLabel,
  invoicesInRange,
  isFullRange,
  rangeLabelOf,
  sameRange,
  totalOf,
  type HistogramBin,
} from './invoice-model';

const THUMB_LABELS = ['Lowest amount', 'Highest amount'];

const SWAP_TRANSITION: Transition = { duration: 0.15, ease: [0.2, 0, 0, 1] };

const SWAP_VARIANTS: Variants = {
  enter: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
  visible: { opacity: 1, scale: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
};

const FADE_VARIANTS: Variants = {
  enter: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const THUMB = [
  'group/thumb relative block size-4 shrink-0 rounded-full bg-white shadow-[0_1px_3px_rgb(0_0_0/0.18)] hairline-ring ring-foreground/15 outline-none',
  'transition-[scale,box-shadow] duration-150 ease-(--ease-out-strong) data-dragging:scale-110',
  'group-data-gliding/range:transition-[inset-inline-start,scale,box-shadow] group-data-gliding/range:duration-200',
  'has-focus-visible:ring-[3px] has-focus-visible:ring-ring/30',
].join(' ');

const INDICATOR = [
  'bg-primary rounded-full',
  'group-data-gliding/range:transition-[inset-inline-start,width] group-data-gliding/range:duration-200 group-data-gliding/range:ease-(--ease-out-strong)',
].join(' ');

function swapVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return SWAP_VARIANTS;
}

function rangeOf(value: number | readonly number[]): AmountRange {
  if (typeof value === 'number') {
    return [value, AMOUNT_BOUNDS.max];
  }
  return [value[0], value[1]];
}

function barHeightOf(bin: HistogramBin) {
  if (bin.count === 0) {
    return '2px';
  }
  const percent = Math.max(bin.share * 100, 8);
  return `${percent}%`;
}

function barToneOf(bin: HistogramBin) {
  if (bin.isInRange) {
    return 'bg-primary';
  }
  return 'bg-foreground/10';
}

function triggerLabelOf(range: AmountRange) {
  if (isFullRange(range)) {
    return 'Any amount';
  }
  return rangeLabelOf(range);
}

function amountAriaTextOf(_formatted: string, value: number) {
  return formatAmount(value);
}

function Histogram({ bins }: { bins: HistogramBin[] }) {
  return (
    <div aria-hidden='true' className='flex h-16 items-end gap-0.5'>
      {bins.map((bin) => (
        <span
          key={bin.id}
          style={{ height: barHeightOf(bin) }}
          className={cn(
            'flex-1 rounded-[3px] transition-colors duration-150',
            barToneOf(bin)
          )}
        />
      ))}
    </div>
  );
}

type RangeSliderProps = {
  value: AmountRange;
  isGliding: boolean;
  onValueChange: (range: AmountRange) => void;
  onValueCommitted: (range: AmountRange) => void;
};

/** Built from the Base UI parts so the thumbs and the fill can glide to a preset and still follow the pointer without lag. */
function RangeSlider({
  value,
  isGliding,
  onValueChange,
  onValueCommitted,
}: RangeSliderProps) {
  const glidingAttribute = isGliding || undefined;
  const minimumSteps = AMOUNT_BOUNDS.minGap / AMOUNT_BOUNDS.step;

  function changeRange(next: number | readonly number[]) {
    const range = rangeOf(next);
    onValueChange(range);
  }

  function commitRange(next: number | readonly number[]) {
    const range = rangeOf(next);
    onValueCommitted(range);
  }

  return (
    <SliderPrimitive.Root
      value={[value[0], value[1]]}
      min={AMOUNT_BOUNDS.min}
      max={AMOUNT_BOUNDS.max}
      step={AMOUNT_BOUNDS.step}
      minStepsBetweenValues={minimumSteps}
      onValueChange={changeRange}
      onValueCommitted={commitRange}
      data-gliding={glidingAttribute}
      className='group/range w-full'
    >
      <SliderPrimitive.Control className='relative flex w-full touch-none items-center py-2 select-none'>
        <SliderPrimitive.Track className='bg-foreground/10 relative h-1 w-full grow rounded-full'>
          <SliderPrimitive.Indicator className={INDICATOR} />
          {THUMB_LABELS.map((label, index) => (
            <SliderPrimitive.Thumb
              key={label}
              index={index}
              aria-label={label}
              getAriaValueText={amountAriaTextOf}
              className={THUMB}
            />
          ))}
        </SliderPrimitive.Track>
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  );
}

type PresetListProps = {
  draft: AmountRange;
  onPick: (preset: AmountPreset) => void;
};

function PresetList({ draft, onPick }: PresetListProps) {
  return (
    <div
      role='group'
      aria-label='Common ranges'
      className='flex flex-wrap gap-1.5'
    >
      {AMOUNT_PRESETS.map((preset) => {
        const isCurrent = sameRange(preset.range, draft);

        return (
          <Button
            key={preset.id}
            variant='outline'
            size='sm'
            aria-pressed={isCurrent}
            onClick={() => onPick(preset)}
            className='aria-pressed:bg-primary/10 aria-pressed:text-primary-ink aria-pressed:ring-primary/30 dark:aria-pressed:bg-primary/15'
          >
            {preset.label}
          </Button>
        );
      })}
    </div>
  );
}

type AmountPanelProps = {
  invoices: Invoice[];
  value: AmountRange;
  onValueChange: (range: AmountRange) => void;
};

/** Mounted each time the popover opens, so the draft starts from the applied range. */
function AmountPanel({ invoices, value, onValueChange }: AmountPanelProps) {
  const [draft, setDraft] = useState<AmountRange>(value);
  const [isGliding, setIsGliding] = useState(false);
  const bins = histogramOf(invoices, draft);
  const matches = invoicesInRange(invoices, draft);
  const matchCount = matches.length;
  const matchTotal = totalOf(matches);
  const countNoun = invoiceCountLabel(matchCount);
  const isReset = isFullRange(draft);

  function followPointer(range: AmountRange) {
    setIsGliding(false);
    setDraft(range);
  }

  function jumpTo(range: AmountRange) {
    setIsGliding(true);
    setDraft(range);
    onValueChange(range);
  }

  return (
    <div className='flex flex-col gap-4'>
      <div className='flex items-baseline justify-between gap-3'>
        <PopoverTitle>Amount</PopoverTitle>
        <span className='text-muted-foreground text-xs tabular-nums'>
          {rangeLabelOf(draft)}
        </span>
      </div>
      <div className='flex flex-col gap-1'>
        <Histogram bins={bins} />
        <RangeSlider
          value={draft}
          isGliding={isGliding}
          onValueChange={followPointer}
          onValueCommitted={onValueChange}
        />
        <div className='text-muted-foreground flex justify-between text-xs tabular-nums'>
          <span>{formatAmount(AMOUNT_BOUNDS.min)}</span>
          <span>{formatAmount(AMOUNT_BOUNDS.max)}</span>
        </div>
      </div>
      <PresetList draft={draft} onPick={(preset) => jumpTo(preset.range)} />
      <div className='flex items-center gap-2 pt-1'>
        <p className='text-muted-foreground min-w-0 flex-1 truncate text-xs'>
          <MotionNumber
            value={matchCount}
            className='text-foreground font-medium'
          />{' '}
          {countNoun} ·{' '}
          <MotionNumber
            value={matchTotal}
            locale={CURRENCY_LOCALE}
            format={CURRENCY_FORMAT}
          />
        </p>
        <Button
          variant='ghost'
          size='sm'
          disabled={isReset}
          onClick={() => jumpTo(FULL_RANGE)}
        >
          Reset
        </Button>
        <PopoverClose render={<Button size='sm' />}>Done</PopoverClose>
      </div>
    </div>
  );
}

type AmountFilterProps = {
  /** The invoices left by the other filters: the histogram draws their spread. */
  invoices: Invoice[];
  value: AmountRange;
  onValueChange: (range: AmountRange) => void;
};

export function AmountFilter({
  invoices,
  value,
  onValueChange,
}: AmountFilterProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const variants = swapVariantsOf(shouldReduceMotion);
  const label = triggerLabelOf(value);
  const isFiltered = !isFullRange(value);

  return (
    <div className='flex items-center gap-1'>
      <Popover>
        <PopoverTrigger
          render={<Button variant='outline' className='gap-1.5 pe-2.5' />}
        >
          <span className='text-muted-foreground'>Amount</span>
          <AnimatedSize as='span' axis='width' contentClassName='relative flex'>
            <AnimatePresence mode='popLayout' initial={false}>
              <motion.span
                key={label}
                variants={variants}
                initial='enter'
                animate='visible'
                exit='exit'
                transition={SWAP_TRANSITION}
                className='tabular-nums'
              >
                {label}
              </motion.span>
            </AnimatePresence>
          </AnimatedSize>
          <ChevronDownIcon className='text-muted-foreground size-3.5' />
        </PopoverTrigger>
        <PopoverContent align='start' className='w-80'>
          <AmountPanel
            invoices={invoices}
            value={value}
            onValueChange={onValueChange}
          />
        </PopoverContent>
      </Popover>
      <AnimatePresence initial={false}>
        {isFiltered && (
          <motion.span
            key='clear-amount'
            variants={variants}
            initial='enter'
            animate='visible'
            exit='exit'
            transition={SWAP_TRANSITION}
            className='flex'
          >
            <Button
              variant='ghost'
              size='icon-sm'
              aria-label='Clear the amount filter'
              onClick={() => onValueChange(FULL_RANGE)}
              className='rounded-full'
            >
              <XIcon />
            </Button>
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
