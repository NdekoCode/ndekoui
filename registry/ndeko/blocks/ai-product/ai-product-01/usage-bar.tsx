'use client';

import { motion, type Transition } from 'motion/react';

import { MotionNumber } from '@/components/core/motion-number';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { seriesColorOf } from '@/registry/ndeko/lib/agent-run';
import { EASE_OUT_STRONG, INSTANT } from '@/registry/ndeko/lib/motion-presets';
import { BrandTile } from '@/registry/ndeko/ui/brand-tile';

import { MODELS, shareOf, type ModelId, type PeriodId } from './data';

const STAGGER_S = 0.07;

const FILL_S = 0.7;

type Layer = {
  id: ModelId;
  color: string;
  share: number;
  delay: number;
};

/** The segments overlap, longest at the bottom: each layer reaches the end of its model, so the one on top is the first segment. */
function layersOf(byModel: Record<ModelId, number>, limit: number) {
  const layers: Layer[] = [];
  let running = 0;
  for (const [index, model] of MODELS.entries()) {
    running += byModel[model.id];
    layers.push({
      id: model.id,
      color: seriesColorOf(model.series),
      share: shareOf(running, limit),
      delay: index * STAGGER_S,
    });
  }
  return [...layers].reverse();
}

function fillOf(shouldReduceMotion: boolean, delay: number): Transition {
  if (shouldReduceMotion) {
    return INSTANT;
  }
  return { duration: FILL_S, ease: EASE_OUT_STRONG, delay };
}

function startOf(hasChanged: boolean, shouldReduceMotion: boolean) {
  if (shouldReduceMotion) {
    return false;
  }
  if (hasChanged) {
    return { scaleX: 0 };
  }
  return false;
}

export function creditsText(value: number) {
  return value.toLocaleString('en-US');
}

type UsageBarProps = {
  periodId: PeriodId;
  limit: number;
  used: number;
  byModel: Record<ModelId, number>;
  hasChanged: boolean;
};

export function UsageBar({
  periodId,
  limit,
  used,
  byModel,
  hasChanged,
}: UsageBarProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const layers = layersOf(byModel, limit);
  const initial = startOf(hasChanged, shouldReduceMotion);
  const usedText = creditsText(used);
  const limitText = creditsText(limit);
  const label = `${usedText} of ${limitText} credits used`;

  return (
    <div className='relative flex flex-col gap-1.5'>
      <p className='text-muted-foreground flex items-baseline justify-end gap-1 text-xs'>
        Limit
        <MotionNumber value={limit} className='text-foreground' />
      </p>
      <div className='relative'>
        <div
          role='img'
          aria-label={label}
          className='bg-foreground/[0.06] relative h-3 overflow-hidden rounded-full'
        >
          {layers.map((layer) => (
            <motion.span
              key={`${periodId}-${layer.id}`}
              initial={initial}
              animate={{ scaleX: layer.share }}
              transition={fillOf(shouldReduceMotion, layer.delay)}
              style={{ backgroundColor: layer.color }}
              className='absolute inset-0 origin-left'
            />
          ))}
        </div>
        <span
          aria-hidden='true'
          className='bg-foreground/40 absolute end-0 -top-1 -bottom-1 w-px'
        />
      </div>
    </div>
  );
}

type ModelLegendProps = {
  byModel: Record<ModelId, number>;
};

export function ModelLegend({ byModel }: ModelLegendProps) {
  return (
    <ul className='grid grid-cols-2 gap-x-4 gap-y-2 @xl:grid-cols-4'>
      {MODELS.map((model) => (
        <li key={model.id} className='flex min-w-0 items-center gap-2'>
          <span
            aria-hidden='true'
            style={{ backgroundColor: seriesColorOf(model.series) }}
            className='size-2 shrink-0 rounded-full'
          />
          <BrandTile brand={model.brand} size='sm' />
          <span className='min-w-0 flex-1 truncate text-[13px]'>
            {model.name}
          </span>
          <MotionNumber
            value={byModel[model.id]}
            className='text-muted-foreground text-xs'
          />
        </li>
      ))}
    </ul>
  );
}
