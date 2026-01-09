'use client';

import { Slider as SliderPrimitive } from '@base-ui/react/slider';
import { useState } from 'react';

type Band = {
  frequency: string;
  name: string;
  initialGain: number;
};

const BANDS: Band[] = [
  { frequency: '60', name: '60 Hz', initialGain: 2 },
  { frequency: '250', name: '250 Hz', initialGain: 1 },
  { frequency: '1k', name: '1 kHz', initialGain: -1 },
  { frequency: '4k', name: '4 kHz', initialGain: -3 },
  { frequency: '16k', name: '16 kHz', initialGain: 2 },
];

const MIN_GAIN = -5;
const MAX_GAIN = 5;

const CONTROL =
  'relative flex h-full touch-none flex-col items-center px-2 select-none data-disabled:opacity-50';

const TRACK = 'bg-foreground/10 relative h-full w-1 grow rounded-full';

const THUMB = [
  'group/thumb block h-6 w-4 shrink-0 rounded-[5px] bg-white shadow-[0_1px_3px_rgb(0_0_0/0.18)] hairline-ring ring-foreground/15 outline-none',
  'transition-[scale,box-shadow] duration-150 ease-(--ease-out-strong) has-focus-visible:ring-[3px] has-focus-visible:ring-ring/30 data-dragging:scale-110',
].join(' ');

const VALUE_BUBBLE = [
  'pointer-events-none absolute start-full top-1/2 ms-2.5 -translate-y-1/2 origin-left whitespace-nowrap',
  'rounded-lg px-2 py-1 text-xs font-medium tabular-nums text-popover-foreground',
  '[--bubble-top:var(--popover)] [--bubble-bottom:color-mix(in_oklab,var(--popover),var(--primary)_9%)]',
  'bg-linear-to-b from-(--bubble-top) to-(--bubble-bottom) hairline-ring ring-border shadow-md shadow-black/6',
  'scale-95 opacity-0 transition-[opacity,scale] duration-150 ease-(--ease-out-strong)',
  'group-data-dragging/thumb:scale-100 group-data-dragging/thumb:opacity-100',
  'group-has-focus-visible/thumb:scale-100 group-has-focus-visible/thumb:opacity-100',
].join(' ');

function gainLabelOf(gain: number) {
  if (gain > 0) {
    return `+${gain} dB`;
  }
  return `${gain} dB`;
}

function gainTextOf(_formattedValue: string, gain: number) {
  return gainLabelOf(gain);
}

function EqualizerBand({ band }: { band: Band }) {
  const [gain, setGain] = useState(band.initialGain);

  return (
    <div className='relative flex flex-col items-center gap-2 has-focus-visible:z-10 has-data-dragging:z-10'>
      <SliderPrimitive.Root
        value={gain}
        onValueChange={setGain}
        min={MIN_GAIN}
        max={MAX_GAIN}
        orientation='vertical'
        className='min-h-0 flex-1'
      >
        <SliderPrimitive.Control className={CONTROL}>
          <SliderPrimitive.Track className={TRACK}>
            <SliderPrimitive.Indicator className='bg-primary rounded-full' />
            <SliderPrimitive.Thumb
              aria-label={band.name}
              getAriaValueText={gainTextOf}
              className={THUMB}
            >
              <span className={VALUE_BUBBLE} aria-hidden='true'>
                {gainLabelOf(gain)}
              </span>
            </SliderPrimitive.Thumb>
          </SliderPrimitive.Track>
        </SliderPrimitive.Control>
      </SliderPrimitive.Root>
      <span
        className='text-muted-foreground text-xs tabular-nums'
        aria-hidden='true'
      >
        {band.frequency}
      </span>
    </div>
  );
}

export default function Slider27() {
  return (
    <fieldset className='flex w-full max-w-xs flex-col'>
      <legend className='mb-4 text-[13px] font-medium'>Equalizer</legend>
      <div className='flex h-48 justify-center gap-8'>
        {BANDS.map((band) => (
          <EqualizerBand key={band.frequency} band={band} />
        ))}
      </div>
    </fieldset>
  );
}
