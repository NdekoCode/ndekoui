'use client';

import type { CSSProperties } from 'react';

import { cn } from '@/registry/ndeko/lib/utils';
import { Slider } from '@/registry/ndeko/ui/slider';

import type { Plan } from './pricing-data';
import {
  formatVolume,
  LAST_POSITION,
  NOTCHES,
  positionOf,
  shareOf,
  volumeAt,
  type Zone,
  ZONES,
} from './volume-model';

const ZONE_INK =
  'text-muted-foreground transition-colors duration-200 data-current:text-foreground data-current:font-medium';

function amountOf(value: number | readonly number[]) {
  if (typeof value === 'number') {
    return value;
  }
  return value[0];
}

/** A zero-width anchor moved by a share of the row: it never widens the page. */
function anchorStyleOf(share: number): CSSProperties {
  const percent = share * 100;
  return { transform: `translateX(${percent}cqw)` };
}

function zoneCenterOf(zone: Zone) {
  const sum = zone.from + zone.to;
  const middle = sum / 2;
  return shareOf(middle);
}

function currentOf(isCurrent: boolean) {
  if (isCurrent) {
    return '';
  }
  return undefined;
}

/** Notches drawn across the track where another plan becomes the cheapest; the track paints over their middle. */
function TrackNotches() {
  return (
    <div
      aria-hidden='true'
      className='@container pointer-events-none absolute inset-x-0 top-1/2 h-3 -translate-y-1/2'
    >
      {NOTCHES.map((notch) => {
        const share = shareOf(notch.position);
        return (
          <span
            key={notch.volume}
            style={anchorStyleOf(share)}
            className='absolute inset-y-0 left-0 w-0'
          >
            <span className='bg-foreground/35 absolute inset-y-0 left-0 w-px -translate-x-1/2' />
          </span>
        );
      })}
    </div>
  );
}

function ZoneNames({ cheapest }: { cheapest: Plan }) {
  return (
    <div aria-hidden='true' className='@container relative h-5'>
      {ZONES.map((zone) => {
        const center = zoneCenterOf(zone);
        const isCurrent = zone.plan === cheapest;
        return (
          <span
            key={zone.from}
            style={anchorStyleOf(center)}
            className='absolute top-0 left-0 w-0'
          >
            <span
              data-current={currentOf(isCurrent)}
              className={cn(
                'absolute top-0 left-0 -translate-x-1/2 text-xs whitespace-nowrap',
                ZONE_INK
              )}
            >
              {zone.plan.name}
            </span>
          </span>
        );
      })}
    </div>
  );
}

type VolumeTrackProps = {
  volume: number;
  cheapest: Plan;
  onVolumeChange: (volume: number) => void;
};

/** The same volume on a log track, with a notch wherever the cheapest plan changes and the plan named on each stretch. */
export function VolumeTrack({
  volume,
  cheapest,
  onVolumeChange,
}: VolumeTrackProps) {
  const position = positionOf(volume);
  const spokenVolume = formatVolume(volume);

  function change(value: number | readonly number[]) {
    const nextPosition = amountOf(value);
    const next = volumeAt(nextPosition);
    onVolumeChange(next);
  }

  function spokenValueOf() {
    return `${spokenVolume} bank lines a month, ${cheapest.name} is the cheapest`;
  }

  return (
    <div className='flex flex-col gap-1.5'>
      <div className='relative'>
        <TrackNotches />
        <Slider
          value={position}
          min={0}
          max={LAST_POSITION}
          step={1}
          thumbLabels={['Bank lines a month']}
          getAriaValueText={spokenValueOf}
          onValueChange={change}
        />
      </div>
      <ZoneNames cheapest={cheapest} />
    </div>
  );
}
