'use client';

import {
  animate,
  AnimatePresence,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useTransform,
} from 'motion/react';
import { useEffect, useId, useImperativeHandle, useRef, useState } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { WordRoll } from '@/components/core/word-roll';
import {
  useAutoplay,
  type AutoplayStep,
} from '@/registry/ndeko/hooks/use-autoplay';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { hold, spokenUnless } from '@/registry/ndeko/lib/demonstration';
import { ChevronDownIcon } from '@/registry/ndeko/lib/icons';
import { springOf } from '@/registry/ndeko/lib/motion-presets';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import { Input } from '@/registry/ndeko/ui/input';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from '@/registry/ndeko/ui/popover';

import { DrawnCheck } from './_parts/drawn-check';
import { LabTile } from './_parts/lab-tile';
import type { LabId } from './_parts/labs';

export type Effort = 'low' | 'medium' | 'high' | 'max';

export type EffortModel = {
  id: string;
  name: string;
  lab: LabId;
  /** Seconds per answer at Low and at Max effort; the stops between grow geometrically. */
  seconds: [number, number];
  /** Dollars per answer at Low and at Max effort. */
  cost: [number, number];
};

export type EffortControlHandle = {
  /** Glides the knob to a stop, held the way a finger holds it, and lets it catch there. */
  moveTo: (effort: Effort) => void;
};

const EFFORTS: Effort[] = ['low', 'medium', 'high', 'max'];

const EFFORT_LABEL: Record<Effort, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  max: 'Max',
};

const EFFORT_LABELS = EFFORTS.map((effort) => EFFORT_LABEL[effort]);

const LAST_INDEX = EFFORTS.length - 1;

/** Live figures move in twentieths of a stop, so digits roll with the finger without a render per frame. */
const LIVE_STEPS_PER_STOP = 20;

/** How far a flick carries, in seconds of its release velocity. */
const PROJECTION_S = 0.16;

/** Past either end the knob follows the finger at this fraction of the distance. */
const EDGE_RESISTANCE = 0.18;

const SETTLE = { type: 'spring', stiffness: 420, damping: 34 } as const;

const SECONDS_FORMAT: Intl.NumberFormatOptions = {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
};

const COST_FORMAT: Intl.NumberFormatOptions = {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
};

const SECONDS_TEXT = new Intl.NumberFormat('en-US', SECONDS_FORMAT);

const COST_TEXT = new Intl.NumberFormat('en-US', COST_FORMAT);

function shareOfIndex(index: number) {
  return index / LAST_INDEX;
}

function percentOf(share: number) {
  const percent = share * 100;
  return `${percent}%`;
}

/** The knob travels by transform: its share of the width of the track, which is a size container. */
function knobOffsetOf(share: number) {
  return `calc(${share} * 100cqw)`;
}

function stopDotStyleOf(index: number) {
  const share = shareOfIndex(index);
  return { left: percentOf(share) };
}

function boundedIndex(index: number) {
  return Math.min(LAST_INDEX, Math.max(0, index));
}

function nearestIndexOf(position: number) {
  const rounded = Math.round(position);
  return boundedIndex(rounded);
}

function quantize(position: number) {
  const steps = Math.round(position * LIVE_STEPS_PER_STOP);
  const quantized = steps / LIVE_STEPS_PER_STOP;
  return Math.min(LAST_INDEX, Math.max(0, quantized));
}

function rubberBand(share: number) {
  if (share < 0) {
    return share * EDGE_RESISTANCE;
  }
  if (share > 1) {
    const overshoot = share - 1;
    return 1 + overshoot * EDGE_RESISTANCE;
  }
  return share;
}

function clampedShare(share: number) {
  return Math.min(1, Math.max(0, share));
}

function figureAt(range: [number, number], position: number) {
  const [atLow, atMax] = range;
  const ratio = atMax / atLow;
  const progress = position / LAST_INDEX;
  const growth = Math.pow(ratio, progress);
  return atLow * growth;
}

function roundedSeconds(seconds: number) {
  const tenths = Math.round(seconds * 10);
  return tenths / 10;
}

function roundedCost(cost: number) {
  const thousandths = Math.round(cost * 1000);
  return thousandths / 1000;
}

export function secondsOf(model: EffortModel, position: number) {
  const seconds = figureAt(model.seconds, position);
  return roundedSeconds(seconds);
}

export function costOf(model: EffortModel, position: number) {
  const cost = figureAt(model.cost, position);
  return roundedCost(cost);
}

function stopToneOf(isCurrent: boolean) {
  if (isCurrent) {
    return 'text-foreground';
  }
  return 'text-muted-foreground hover:text-foreground';
}

function stopAlignOf(index: number) {
  if (index === 0) {
    return 'start-0 text-start';
  }
  if (index === LAST_INDEX) {
    return 'end-0 text-end';
  }
  return '-translate-x-1/2 text-center';
}

function stopLeftOf(index: number) {
  const isEdge = index === 0 || index === LAST_INDEX;
  if (isEdge) {
    return undefined;
  }
  const share = shareOfIndex(index);
  return { left: percentOf(share) };
}

function keyStepOf(key: string) {
  const isBack = key === 'ArrowLeft' || key === 'ArrowDown';
  if (isBack) {
    return -1;
  }
  const isForward = key === 'ArrowRight' || key === 'ArrowUp';
  if (isForward) {
    return 1;
  }
  return 0;
}

type EffortTrackProps = {
  value: Effort;
  livePosition: number;
  onValueChange: (effort: Effort) => void;
  onLiveChange: (position: number | null) => void;
  valueText: string;
  handleRef?: React.Ref<EffortControlHandle>;
};

function EffortTrack({
  value,
  livePosition,
  onValueChange,
  onLiveChange,
  valueText,
  handleRef,
}: EffortTrackProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const index = EFFORTS.indexOf(value);
  const share = useMotionValue(shareOfIndex(index));
  const knobX = useTransform(share, knobOffsetOf);
  const fillScale = useTransform(share, clampedShare);
  const [isGrabbing, setIsGrabbing] = useState(false);
  const [isLifted, setIsLifted] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLSpanElement>(null);
  const isDragging = useRef(false);
  const isInteracting = useRef(false);
  const interaction = useRef(0);
  const settling = useRef<ReturnType<typeof animate> | null>(null);
  const nearestStop = nearestIndexOf(livePosition);
  const isHeld = isGrabbing || isLifted;
  const press = pressOf(isHeld, shouldReduceMotion);

  useMotionValueEvent(share, 'change', (latest) => {
    if (!isInteracting.current) {
      return;
    }
    const position = latest * LAST_INDEX;
    onLiveChange(quantize(position));
  });

  useEffect(() => {
    if (isInteracting.current) {
      return;
    }
    const target = shareOfIndex(index);
    settling.current?.stop();
    if (shouldReduceMotion) {
      share.set(target);
      return;
    }
    settling.current = animate(share, target, SETTLE);
  }, [index, share, shouldReduceMotion]);

  function beginInteraction() {
    settling.current?.stop();
    isInteracting.current = true;
    interaction.current += 1;
  }

  function finishInteraction(token: number) {
    const isLatest = token === interaction.current;
    if (!isLatest) {
      return;
    }
    isInteracting.current = false;
    setIsLifted(false);
    onLiveChange(null);
  }

  function settleTo(targetIndex: number, velocity: number) {
    const token = interaction.current;
    const target = shareOfIndex(targetIndex);
    onValueChange(EFFORTS[targetIndex]);
    if (shouldReduceMotion) {
      share.set(target);
      finishInteraction(token);
      return;
    }
    const controls = animate(share, target, { ...SETTLE, velocity });
    settling.current = controls;
    controls.then(() => finishInteraction(token));
  }

  function shareAt(clientX: number) {
    const track = trackRef.current;
    if (!track) {
      return share.get();
    }
    const rect = track.getBoundingClientRect();
    const offset = clientX - rect.left;
    const raw = offset / rect.width;
    return rubberBand(raw);
  }

  function startDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) {
      return;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    beginInteraction();
    isDragging.current = true;
    setIsGrabbing(true);
    knobRef.current?.focus({ preventScroll: true });
    share.set(shareAt(event.clientX));
  }

  function moveDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (!isDragging.current) {
      return;
    }
    share.set(shareAt(event.clientX));
  }

  function endDrag() {
    if (!isDragging.current) {
      return;
    }
    isDragging.current = false;
    setIsGrabbing(false);
    const velocity = share.getVelocity();
    const current = share.get();
    const carried = velocity * PROJECTION_S;
    const projected = current + carried;
    const position = projected * LAST_INDEX;
    settleTo(nearestIndexOf(position), velocity);
  }

  function moveFromKeys(event: React.KeyboardEvent<HTMLSpanElement>) {
    const step = keyStepOf(event.key);
    let targetIndex = index + step;
    if (event.key === 'Home') {
      targetIndex = 0;
    }
    if (event.key === 'End') {
      targetIndex = LAST_INDEX;
    }
    const bounded = boundedIndex(targetIndex);
    const isMove = bounded !== index;
    if (!isMove) {
      return;
    }
    event.preventDefault();
    beginInteraction();
    settleTo(bounded, 0);
  }

  function jumpTo(stopIndex: number) {
    beginInteraction();
    settleTo(stopIndex, 0);
  }

  function moveTo(effort: Effort) {
    const stopIndex = EFFORTS.indexOf(effort);
    beginInteraction();
    setIsLifted(true);
    settleTo(stopIndex, 0);
  }

  useImperativeHandle(handleRef, () => ({ moveTo }));

  return (
    <div className='flex flex-col gap-1.5'>
      <div
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className={cn(
          'relative h-9 touch-none px-3 select-none',
          cursorOf(isGrabbing)
        )}
      >
        <div ref={trackRef} className='@container relative h-full'>
          <span className='bg-foreground/[0.08] absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full' />
          <motion.span
            aria-hidden='true'
            style={{ scaleX: fillScale }}
            className='bg-primary/85 absolute inset-x-0 top-1/2 h-1.5 origin-left -translate-y-1/2 rounded-full'
          />
          {EFFORTS.map((effort, stopIndex) => (
            <span
              key={effort}
              aria-hidden='true'
              style={stopDotStyleOf(stopIndex)}
              className='bg-card hairline-ring ring-foreground/20 absolute top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full'
            />
          ))}
          <motion.span
            ref={knobRef}
            role='slider'
            tabIndex={0}
            aria-label='Effort'
            aria-valuemin={0}
            aria-valuemax={LAST_INDEX}
            aria-valuenow={index}
            aria-valuetext={valueText}
            onKeyDown={moveFromKeys}
            style={{ x: knobX }}
            animate={press}
            transition={{ duration: 0.12 }}
            className='bg-card hairline-ring ring-foreground/15 dark:bg-foreground/90 focus-visible:ring-ring focus-visible:ring-offset-background absolute top-1/2 left-0 -mt-2.5 -ml-2.5 size-5 rounded-full shadow-[0_1px_3px_rgb(0_0_0/0.18)] outline-none focus-visible:ring-2 focus-visible:ring-offset-2'
          />
        </div>
      </div>
      <div className='relative mx-3 h-4 text-xs'>
        {EFFORTS.map((effort, stopIndex) => (
          <button
            key={effort}
            type='button'
            tabIndex={-1}
            onClick={() => jumpTo(stopIndex)}
            style={stopLeftOf(stopIndex)}
            className={cn(
              'absolute top-0 cursor-pointer whitespace-nowrap transition-[color,scale] duration-150 active:scale-[0.97]',
              stopAlignOf(stopIndex),
              stopToneOf(stopIndex === nearestStop)
            )}
          >
            {EFFORT_LABEL[effort]}
          </button>
        ))}
      </div>
    </div>
  );
}

function cursorOf(isGrabbing: boolean) {
  if (isGrabbing) {
    return 'cursor-grabbing';
  }
  return 'cursor-grab';
}

function pressOf(isHeld: boolean, shouldReduceMotion: boolean | null) {
  const canScale = isHeld && !shouldReduceMotion;
  if (canScale) {
    return { scale: 1.15 };
  }
  return { scale: 1 };
}

function rowStepOf(key: string) {
  const isPrevious = key === 'ArrowUp' || key === 'ArrowLeft';
  if (isPrevious) {
    return -1;
  }
  const isNext = key === 'ArrowDown' || key === 'ArrowRight';
  if (isNext) {
    return 1;
  }
  return 0;
}

function moveIndexOf(key: string, current: number, count: number) {
  const step = rowStepOf(key);
  if (key === 'Home') {
    return 0;
  }
  if (key === 'End') {
    return count - 1;
  }
  const moved = current + step;
  const wrapped = moved + count;
  return wrapped % count;
}

type ModelRowsProps = {
  models: EffortModel[];
  modelId: string;
  onModelChange: (modelId: string) => void;
  position: number;
};

function ModelRows({
  models,
  modelId,
  onModelChange,
  position,
}: ModelRowsProps) {
  const highlightId = useId();
  const groupRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = usePrefersReducedMotion();
  const spring = springOf(shouldReduceMotion);
  const pickedIndex = models.findIndex((model) => model.id === modelId);

  function moveFromKeys(event: React.KeyboardEvent<HTMLButtonElement>) {
    const isArrow = rowStepOf(event.key) !== 0;
    const isEdge = event.key === 'Home' || event.key === 'End';
    const isMove = isArrow || isEdge;
    if (!isMove) {
      return;
    }
    event.preventDefault();
    const nextIndex = moveIndexOf(event.key, pickedIndex, models.length);
    const next = models[nextIndex];
    onModelChange(next.id);
    requestAnimationFrame(() => {
      const button = groupRef.current?.querySelector<HTMLElement>(
        `[data-model="${next.id}"]`
      );
      button?.focus();
    });
  }

  return (
    <div className='flex flex-col gap-1'>
      <div
        aria-hidden='true'
        className='text-muted-foreground grid grid-cols-[1fr_3.5rem_4rem] gap-2 px-2.5 text-[11px]'
      >
        <span>Model</span>
        <span className='text-end'>Time</span>
        <span className='text-end'>Cost</span>
      </div>
      <div
        ref={groupRef}
        role='radiogroup'
        aria-label='Model'
        className='flex flex-col'
      >
        {models.map((model) => {
          const isPicked = model.id === modelId;
          const seconds = secondsOf(model, position);
          const cost = costOf(model, position);
          return (
            <button
              key={model.id}
              type='button'
              role='radio'
              aria-checked={isPicked}
              tabIndex={tabIndexOf(isPicked)}
              data-model={model.id}
              onClick={() => onModelChange(model.id)}
              onKeyDown={moveFromKeys}
              className='hover:bg-foreground/[0.03] focus-visible:ring-ring/25 relative grid h-10 cursor-pointer grid-cols-[1fr_3.5rem_4rem] items-center gap-2 rounded-lg px-2.5 text-start text-[13px] outline-none focus-visible:ring-[3px]'
            >
              {isPicked && (
                <motion.span
                  layoutId={highlightId}
                  layoutDependency={modelId}
                  transition={spring}
                  aria-hidden='true'
                  className='bg-foreground/[0.05] dark:bg-foreground/[0.07] absolute inset-0 rounded-lg'
                />
              )}
              <span className='relative flex min-w-0 items-center gap-2'>
                <LabTile lab={model.lab} size='sm' />
                <span className='truncate font-medium'>{model.name}</span>
                <AnimatePresence initial={false}>
                  {isPicked && <DrawnCheck key='mark' className='size-4' />}
                </AnimatePresence>
              </span>
              <span className='text-muted-foreground relative text-end text-xs'>
                <MotionNumber
                  value={seconds}
                  format={SECONDS_FORMAT}
                  suffix='s'
                />
              </span>
              <span className='relative text-end text-xs'>
                <MotionNumber value={cost} format={COST_FORMAT} />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function tabIndexOf(isPicked: boolean) {
  if (isPicked) {
    return 0;
  }
  return -1;
}

function modelIn(models: EffortModel[], modelId: string) {
  return models.find((model) => model.id === modelId) ?? models[0];
}

function valueTextOf(model: EffortModel, effort: Effort) {
  const position = EFFORTS.indexOf(effort);
  const seconds = secondsOf(model, position);
  const cost = costOf(model, position);
  const secondsText = SECONDS_TEXT.format(seconds);
  const costText = COST_TEXT.format(cost);
  const label = EFFORT_LABEL[effort];
  return `${label}: about ${secondsText} seconds and ${costText} per answer with ${model.name}`;
}

export type EffortControlProps = {
  models: EffortModel[];
  modelId: string;
  onModelChange: (modelId: string) => void;
  effort: Effort;
  onEffortChange: (effort: Effort) => void;
  /** Moves the knob from outside, for a demonstration or a control beside it. */
  handleRef?: React.Ref<EffortControlHandle>;
  className?: string;
};

export function EffortControl({
  models,
  modelId,
  onModelChange,
  effort,
  onEffortChange,
  handleRef,
  className,
}: EffortControlProps) {
  const [livePosition, setLivePosition] = useState<number | null>(null);
  const restingPosition = EFFORTS.indexOf(effort);
  const position = livePosition ?? restingPosition;
  const nearest = nearestIndexOf(position);
  const nearestLabel = EFFORT_LABEL[EFFORTS[nearest]];
  const model = modelIn(models, modelId);
  const valueText = valueTextOf(model, effort);

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <div className='flex flex-col gap-2'>
        <div className='flex items-baseline justify-between gap-3'>
          <p className='text-sm font-medium'>Effort</p>
          <p className='text-muted-foreground text-xs'>
            <WordRoll
              text={nearestLabel}
              labels={EFFORT_LABELS}
              value={nearest}
            />
          </p>
        </div>
        <EffortTrack
          value={effort}
          livePosition={position}
          onValueChange={onEffortChange}
          onLiveChange={setLivePosition}
          valueText={valueText}
          handleRef={handleRef}
        />
      </div>
      <ModelRows
        models={models}
        modelId={modelId}
        onModelChange={onModelChange}
        position={position}
      />
      <p className='text-muted-foreground text-[11px]'>
        Time and cost per answer are illustrative
      </p>
    </div>
  );
}

function chipLabelOf(model: EffortModel, effort: Effort) {
  return `${model.name}, ${EFFORT_LABEL[effort]}`;
}

export function EffortChip(props: EffortControlProps) {
  const model = modelIn(props.models, props.modelId);
  const label = chipLabelOf(model, props.effort);

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            type='button'
            variant='outline'
            size='sm'
            aria-label={`Model and effort: ${label}`}
            className='gap-1.5 ps-1.5 pe-2'
          />
        }
      >
        <LabTile lab={model.lab} size='sm' />
        <WordRoll text={label} />
        <ChevronDownIcon className='text-muted-foreground size-3.5' />
      </PopoverTrigger>
      <PopoverContent
        side='top'
        align='end'
        className='w-[22rem] max-w-[calc(100vw-2rem)] p-4'
      >
        <PopoverTitle className='sr-only'>Model and effort</PopoverTitle>
        <EffortControl {...props} />
      </PopoverContent>
    </Popover>
  );
}

const MODELS: EffortModel[] = [
  {
    id: 'claude-haiku',
    name: 'Claude Haiku',
    lab: 'anthropic',
    seconds: [1.2, 6.4],
    cost: [0.001, 0.006],
  },
  {
    id: 'claude-sonnet',
    name: 'Claude Sonnet',
    lab: 'anthropic',
    seconds: [2.4, 18],
    cost: [0.004, 0.038],
  },
  {
    id: 'claude-opus',
    name: 'Claude Opus',
    lab: 'anthropic',
    seconds: [5.5, 52],
    cost: [0.019, 0.24],
  },
  {
    id: 'gemini-pro',
    name: 'Gemini Pro',
    lab: 'google',
    seconds: [4.1, 37],
    cost: [0.011, 0.12],
  },
];

const START_MODEL = 'claude-sonnet';

const START_EFFORT: Effort = 'high';

export default function Prompt04() {
  const [modelId, setModelId] = useState(START_MODEL);
  const [effort, setEffort] = useState<Effort>(START_EFFORT);
  const control = useRef<EffortControlHandle>(null);
  const model = modelIn(MODELS, modelId);
  const announcement = valueTextOf(model, effort);

  function resetDemo() {
    setModelId(START_MODEL);
    setEffort(START_EFFORT);
  }

  const steps: AutoplayStep[] = [
    { after: 1500, run: () => control.current?.moveTo('medium') },
    { after: 620, run: () => control.current?.moveTo('low') },
    { after: 1100, run: () => control.current?.moveTo('medium') },
    { after: 620, run: () => control.current?.moveTo('high') },
    { after: 620, run: () => control.current?.moveTo('max') },
    { after: 1200, run: () => control.current?.moveTo('high') },
    { after: 1200, run: () => setModelId('claude-opus') },
    { after: 1500, run: () => setModelId(START_MODEL) },
    { after: 500, run: hold },
  ];
  const { ref, isAutoplaying } = useAutoplay(steps, {
    loopAfter: 2400,
    onReset: resetDemo,
  });

  return (
    <div ref={ref} className='flex w-full max-w-[26rem] flex-col gap-3'>
      <EffortControl
        models={MODELS}
        modelId={modelId}
        onModelChange={setModelId}
        effort={effort}
        onEffortChange={setEffort}
        handleRef={control}
        className='bg-card hairline-ring ring-border rounded-xl p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'
      />
      <div className='flex flex-col gap-1.5'>
        <p className='text-muted-foreground px-1 text-xs'>In a composer</p>
        <div className='bg-card hairline-ring ring-border flex items-center gap-2 rounded-xl p-1.5 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
          <Input
            aria-label='Prompt'
            placeholder='Plan the Q4 data migration'
            className='min-w-0 flex-1 bg-transparent shadow-none ring-0 dark:bg-transparent'
          />
          <EffortChip
            models={MODELS}
            modelId={modelId}
            onModelChange={setModelId}
            effort={effort}
            onEffortChange={setEffort}
          />
        </div>
      </div>
      <LiveRegion message={spokenUnless(isAutoplaying, announcement)} />
    </div>
  );
}
