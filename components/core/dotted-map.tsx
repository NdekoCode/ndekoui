import { cn } from '@/lib/utils';

import {
  DOTTED_MAP_BOUNDS,
  DOTTED_MAP_HEIGHT,
  DOTTED_MAP_PATH,
  DOTTED_MAP_WIDTH,
} from './dotted-map-points';

export type DottedMapMarker = {
  lat: number;
  lng: number;
  label?: string;
  pulse?: boolean;
};

type PlacedMarker = DottedMapMarker & {
  x: number;
  y: number;
  left: string;
  top: string;
};

const EDGE = 0.5;

const VIEW_WIDTH = DOTTED_MAP_WIDTH + EDGE * 2;

const VIEW_HEIGHT = DOTTED_MAP_HEIGHT + EDGE * 2;

const VIEW_BOX = `${-EDGE} ${-EDGE} ${VIEW_WIDTH} ${VIEW_HEIGHT}`;

const LONGITUDE_SPAN = DOTTED_MAP_BOUNDS.lngMax - DOTTED_MAP_BOUNDS.lngMin;

const LATITUDE_SPAN = DOTTED_MAP_BOUNDS.latMax - DOTTED_MAP_BOUNDS.latMin;

const PULSE_STAGGER_MS = 450;

function percentOf(value: number, span: number) {
  const share = (value + EDGE) / span;
  return `${share * 100}%`;
}

function placeMarker(marker: DottedMapMarker): PlacedMarker {
  const fromWest = marker.lng - DOTTED_MAP_BOUNDS.lngMin;
  const fromNorth = DOTTED_MAP_BOUNDS.latMax - marker.lat;
  const x = (fromWest / LONGITUDE_SPAN) * DOTTED_MAP_WIDTH;
  const y = (fromNorth / LATITUDE_SPAN) * DOTTED_MAP_HEIGHT;
  return {
    ...marker,
    x,
    y,
    left: percentOf(x, VIEW_WIDTH),
    top: percentOf(y, VIEW_HEIGHT),
  };
}

function markerKeyOf(marker: DottedMapMarker, index: number) {
  return `${marker.lat}:${marker.lng}:${index}`;
}

function pulsesOf(marker: DottedMapMarker, pulseByDefault: boolean) {
  return marker.pulse ?? pulseByDefault;
}

function hasLabel(marker: PlacedMarker) {
  return Boolean(marker.label);
}

export type DottedMapProps = {
  markers?: DottedMapMarker[];
  pulse?: boolean;
  dotSize?: number;
  markerSize?: number;
  className?: string;
  dotClassName?: string;
  label?: string;
};

export function DottedMap({
  markers = [],
  pulse = false,
  dotSize = 0.5,
  markerSize = 1.1,
  className,
  dotClassName,
  label = 'World map',
}: DottedMapProps) {
  const placedMarkers = markers.map(placeMarker);
  const labelledMarkers = placedMarkers.filter(hasLabel);
  const markerRadius = markerSize / 2;

  return (
    <div className={cn('relative w-full', className)}>
      <svg
        viewBox={VIEW_BOX}
        role='img'
        aria-label={label}
        className='block h-auto w-full'
      >
        <path
          d={DOTTED_MAP_PATH}
          fill='none'
          stroke='currentColor'
          strokeWidth={dotSize}
          strokeLinecap='round'
          strokeDasharray='0 1'
          className={cn('text-foreground/20', dotClassName)}
        />
        {placedMarkers.map((marker, index) => {
          const isPulsing = pulsesOf(marker, pulse);
          const pulseDelay = index * PULSE_STAGGER_MS;

          return (
            <g key={markerKeyOf(marker, index)} className='text-primary'>
              {isPulsing && (
                <circle
                  cx={marker.x}
                  cy={marker.y}
                  r={markerRadius}
                  fill='currentColor'
                  opacity={0.45}
                  aria-hidden='true'
                  style={{
                    animationDuration: '2.4s',
                    animationDelay: `${pulseDelay}ms`,
                  }}
                  className='origin-center animate-ping [transform-box:fill-box] motion-reduce:hidden'
                />
              )}
              <circle
                cx={marker.x}
                cy={marker.y}
                r={markerRadius}
                fill='currentColor'
              />
            </g>
          );
        })}
      </svg>
      {labelledMarkers.map((marker, index) => (
        <span
          key={markerKeyOf(marker, index)}
          style={{ left: marker.left, top: marker.top }}
          className='bg-popover text-popover-foreground hairline-ring ring-border pointer-events-none absolute -mt-2 -translate-x-1/2 -translate-y-full rounded-md px-1.5 py-0.5 text-[11px] leading-4 font-medium whitespace-nowrap shadow-[0_1px_2px_rgb(0_0_0/0.06)]'
        >
          {marker.label}
        </span>
      ))}
    </div>
  );
}
