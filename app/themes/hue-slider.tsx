'use client';

import { Slider as SliderPrimitive } from '@base-ui/react/slider';

import { hsl } from '@/lib/theme-colours';

const MAX_HUE = 359;

const LARGE_STEP = 15;

const TRACK_STOPS = [
  0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330, 359,
];

const TRACK_SATURATION = 82;

const TRACK_LIGHTNESS = 54;

const HUE_TRACK = `linear-gradient(to right, ${TRACK_STOPS.map((hue) =>
  hsl(hue, TRACK_SATURATION, TRACK_LIGHTNESS)
).join(', ')})`;

const TRACK_STYLE = { backgroundImage: HUE_TRACK };

const THUMB = [
  'block size-5 shrink-0 rounded-full shadow-[0_1px_3px_rgb(0_0_0/0.3)] ring-2 ring-white outline-none',
  'transition-[scale] duration-150 ease-(--ease-out-strong) data-dragging:scale-110',
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring',
].join(' ');

type HueSliderProps = {
  hue: number;
  onHueChange: (hue: number) => void;
};

function hueValueText(_formatted: string, value: number) {
  return `${value} degrees`;
}

export function HueSlider({ hue, onHueChange }: HueSliderProps) {
  function changeHue(value: number | readonly number[]) {
    if (typeof value !== 'number') {
      return;
    }
    onHueChange(value);
  }

  const thumbStyle = {
    backgroundColor: hsl(hue, TRACK_SATURATION, TRACK_LIGHTNESS),
  };

  return (
    <SliderPrimitive.Root
      value={hue}
      onValueChange={changeHue}
      min={0}
      max={MAX_HUE}
      step={1}
      largeStep={LARGE_STEP}
    >
      <SliderPrimitive.Control className='relative flex w-full touch-none items-center py-2 select-none'>
        <SliderPrimitive.Track
          style={TRACK_STYLE}
          className='hairline-ring ring-foreground/10 relative h-2.5 w-full grow rounded-full'
        >
          <SliderPrimitive.Thumb
            aria-label='Hue'
            getAriaValueText={hueValueText}
            style={thumbStyle}
            className={THUMB}
          />
        </SliderPrimitive.Track>
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  );
}
