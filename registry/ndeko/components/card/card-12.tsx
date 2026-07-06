'use client';

import { useInView } from 'motion/react';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';

import {
  Globe,
  type GlobeArc,
  type GlobeLocation,
  type GlobeMarker,
} from '@/components/core/globe';
import { useDocumentVisible } from '@/registry/ndeko/hooks/use-agent-run';
import type { AutoplayStep } from '@/registry/ndeko/hooks/use-autoplay';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import {
  PRESS_LEAD_MS,
  pressedQuietOf,
  spokenUnless,
  usePress,
} from '@/registry/ndeko/lib/demonstration';
import { cn } from '@/registry/ndeko/lib/utils';
import { Card } from '@/registry/ndeko/ui/card';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';

import { SampleNote } from './_parts/sample-note';
import { useCardDemo } from './_parts/use-card-demo';

export type RouteCity = {
  id: string;
  name: string;
  country: string;
  location: GlobeLocation;
};

/** A route joins two cities and is drawn from whichever of them is picked. */
export type Route = {
  id: string;
  fromId: string;
  toId: string;
};

type Vector = [x: number, y: number, z: number];

type Drawing = { hubId: string; progress: number };

const DRAW_MS = 900;

/** The globe turns first: a route starts to draw once its city has come most of the way to the front. */
const TURN_LEAD_MS = 520;

/** Under this share an arc is a needle standing on its city: it is drawn from here on. */
const FIRST_STROKE = 0.04;

/** Two cities this close, or exactly opposite, have no single path between them to follow. */
const SAME_PLACE = 0.0001;

const HUB_MARKER = 0.075;

const CITY_MARKER = 0.045;

const NO_ARCS: GlobeArc[] = [];

const ARROW_KEYS = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];

/** Under 18rem a row puts the country under the city, across the width the route count leaves free. */
const ROW = [
  'flex h-10 w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 text-start text-[13px] outline-none',
  '@max-2xs:grid @max-2xs:grid-cols-[auto_minmax(0,1fr)_auto] @max-2xs:content-center @max-2xs:gap-y-0',
  'transition-[background-color,scale] duration-150 ease-(--ease-out-strong) active:scale-[0.98]',
  'hover:bg-foreground/[0.04] focus-visible:ring-ring/25 focus-visible:ring-[3px]',
].join(' ');

const PICKED_ROW = 'bg-foreground/[0.06] hover:bg-foreground/[0.06]';

function radiansOf(degrees: number) {
  const halfTurns = degrees / 180;
  return halfTurns * Math.PI;
}

function degreesOf(radians: number) {
  const halfTurns = radians / Math.PI;
  return halfTurns * 180;
}

function vectorOf([latitude, longitude]: GlobeLocation): Vector {
  const latitudeAngle = radiansOf(latitude);
  const longitudeAngle = radiansOf(longitude);
  const ring = Math.cos(latitudeAngle);
  const x = ring * Math.cos(longitudeAngle);
  const y = ring * Math.sin(longitudeAngle);
  const z = Math.sin(latitudeAngle);
  return [x, y, z];
}

/** Rounding can push a sine or a cosine a hair past 1, where the inverse functions give no answer. */
function withinUnit(value: number) {
  const atMostOne = Math.min(1, value);
  return Math.max(-1, atMostOne);
}

function locationOf([x, y, z]: Vector): GlobeLocation {
  const height = withinUnit(z);
  const latitudeAngle = Math.asin(height);
  const longitudeAngle = Math.atan2(y, x);
  const latitude = degreesOf(latitudeAngle);
  const longitude = degreesOf(longitudeAngle);
  return [latitude, longitude];
}

function alignmentOf(first: Vector, second: Vector) {
  const alongX = first[0] * second[0];
  const alongY = first[1] * second[1];
  const alongZ = first[2] * second[2];
  const flat = alongX + alongY;
  return flat + alongZ;
}

function blend(
  start: number,
  end: number,
  startWeight: number,
  endWeight: number
) {
  const fromStart = start * startWeight;
  const fromEnd = end * endWeight;
  return fromStart + fromEnd;
}

/** The point a share of the way from one city to another, along the shortest path over the globe. */
function pointAlong(
  from: GlobeLocation,
  to: GlobeLocation,
  share: number
): GlobeLocation {
  const start = vectorOf(from);
  const end = vectorOf(to);
  const alignment = alignmentOf(start, end);
  const bounded = withinUnit(alignment);
  const angle = Math.acos(bounded);
  const spread = Math.sin(angle);
  if (spread < SAME_PLACE) {
    return to;
  }
  const rest = 1 - share;
  const startAngle = rest * angle;
  const endAngle = share * angle;
  const startTurn = Math.sin(startAngle);
  const endTurn = Math.sin(endAngle);
  const startWeight = startTurn / spread;
  const endWeight = endTurn / spread;
  const x = blend(start[0], end[0], startWeight, endWeight);
  const y = blend(start[1], end[1], startWeight, endWeight);
  const z = blend(start[2], end[2], startWeight, endWeight);
  return locationOf([x, y, z]);
}

/** Fast at the start and slow at the end, the way a line is drawn by hand. */
function easedOf(progress: number) {
  const left = 1 - progress;
  const leftCubed = left ** 3;
  return 1 - leftCubed;
}

function otherEndOf(route: Route, cityId: string) {
  if (route.fromId === cityId) {
    return route.toId;
  }
  if (route.toId === cityId) {
    return route.fromId;
  }
  return null;
}

function destinationsOf(cityId: string, cities: RouteCity[], routes: Route[]) {
  const destinations: RouteCity[] = [];
  for (const route of routes) {
    const otherId = otherEndOf(route, cityId);
    const other = cities.find((city) => city.id === otherId);
    if (other) {
      destinations.push(other);
    }
  }
  return destinations;
}

function arcsOf(hub: RouteCity, destinations: RouteCity[], progress: number) {
  if (progress < FIRST_STROKE) {
    return NO_ARCS;
  }
  const share = easedOf(progress);
  return destinations.map((destination) => ({
    from: hub.location,
    to: pointAlong(hub.location, destination.location, share),
  }));
}

function markerSizeOf(isHub: boolean) {
  if (isHub) {
    return HUB_MARKER;
  }
  return CITY_MARKER;
}

function markersOf(cities: RouteCity[], hubId: string): GlobeMarker[] {
  return cities.map((city) => {
    const isHub = city.id === hubId;
    return {
      location: city.location,
      size: markerSizeOf(isHub),
      label: city.name,
    };
  });
}

function startOf(shouldReduceMotion: boolean) {
  if (shouldReduceMotion) {
    return 1;
  }
  return 0;
}

function leadOf(isFresh: boolean) {
  if (isFresh) {
    return TURN_LEAD_MS;
  }
  return 0;
}

function grown(drawing: Drawing, elapsed: number): Drawing {
  const step = elapsed / DRAW_MS;
  const further = drawing.progress + step;
  const progress = Math.min(1, further);
  return { hubId: drawing.hubId, progress };
}

function routeCountOf(count: number) {
  if (count === 0) {
    return 'No route';
  }
  if (count === 1) {
    return '1 route';
  }
  return `${count} routes`;
}

function focusOf(isHeld: boolean, hub: RouteCity) {
  if (isHeld) {
    return hub.location;
  }
  return null;
}

function dotOf(isPicked: boolean) {
  if (isPicked) {
    return 'bg-primary';
  }
  return 'bg-foreground/20';
}

type RouteLayerProps = {
  hub: RouteCity;
  cities: RouteCity[];
  destinations: RouteCity[];
  /** False once a person turns the globe by hand: it stays where they left it until a city is picked. */
  isHeld: boolean;
  /** Nothing is drawn while the card is off screen or the tab is hidden. */
  isActive: boolean;
  label: string;
};

/**
 * The globe takes its arcs as a prop, so the growing end of a route is state. This layer holds it
 * alone: while a route draws, nothing but the globe renders, and once it is drawn nothing runs.
 */
function RouteLayer({
  hub,
  cities,
  destinations,
  isHeld,
  isActive,
  label,
}: RouteLayerProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const [drawing, setDrawing] = useState<Drawing>({
    hubId: hub.id,
    progress: 1,
  });
  const isNewHub = drawing.hubId !== hub.id;
  if (isNewHub) {
    setDrawing({ hubId: hub.id, progress: startOf(shouldReduceMotion) });
  }
  const isDrawn = drawing.progress >= 1;
  const isFresh = drawing.progress === 0;
  const isDrawing = isActive && !isDrawn && !isNewHub;

  useEffect(() => {
    if (!isDrawing) {
      return;
    }
    let frame = 0;
    let lastTime = 0;

    function draw(time: number) {
      const sinceLastFrame = time - lastTime;
      const elapsed = Math.max(sinceLastFrame, 0);
      lastTime = time;
      setDrawing((current) => grown(current, elapsed));
      frame = requestAnimationFrame(draw);
    }

    function begin() {
      lastTime = performance.now();
      frame = requestAnimationFrame(draw);
    }

    const lead = setTimeout(begin, leadOf(isFresh));
    return () => {
      clearTimeout(lead);
      cancelAnimationFrame(frame);
    };
  }, [isDrawing, isFresh, drawing.hubId]);

  const markers = useMemo(() => markersOf(cities, hub.id), [cities, hub.id]);
  const arcs = useMemo(
    () => arcsOf(hub, destinations, drawing.progress),
    [hub, destinations, drawing.progress]
  );

  return (
    <Globe
      markers={markers}
      arcs={arcs}
      focus={focusOf(isHeld, hub)}
      autoRotate={false}
      label={label}
    />
  );
}

export type RouteGlobeProps = {
  title: string;
  cities: RouteCity[];
  routes: Route[];
  selectedId: string;
  onSelect: (cityId: string) => void;
  /** Says the routes are made up. Leave it out for real ones. */
  note?: string;
  /** The city a demonstration picks, shown held down. */
  pressedId?: string | null;
  className?: string;
};

export function RouteGlobe({
  title,
  cities,
  routes,
  selectedId,
  onSelect,
  note,
  pressedId = null,
  className,
}: RouteGlobeProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const isInView = useInView(cardRef, { amount: 0.3 });
  const isVisible = useDocumentVisible();
  const [hasAppeared, setHasAppeared] = useState(false);
  const [releasedId, setReleasedId] = useState<string | null>(null);
  const isFirstSight = isInView && !hasAppeared;
  if (isFirstSight) {
    setHasAppeared(true);
  }
  const isOnScreen = isInView && isVisible;
  const isHeld = releasedId !== selectedId;
  const hub = cities.find((city) => city.id === selectedId);
  const destinations = useMemo(
    () => destinationsOf(selectedId, cities, routes),
    [selectedId, cities, routes]
  );

  function pick(cityId: string) {
    setReleasedId(null);
    onSelect(cityId);
  }

  /** A person who turns the globe by hand keeps it where they leave it, until a city is picked again. */
  function letGo() {
    setReleasedId(selectedId);
  }

  /**
   * The globe turns on this same key press. Letting go clears its focus, which would stop that turn
   * if it landed after it, so the release is committed before the globe sees the key.
   */
  function letGoBeforeArrowTurn(event: React.KeyboardEvent<HTMLDivElement>) {
    const isArrow = ARROW_KEYS.includes(event.key);
    const isFirstTurn = isArrow && isHeld;
    if (isFirstTurn) {
      flushSync(letGo);
    }
  }

  if (!hub) {
    return null;
  }

  const globeLabel = `Globe of ${title}, ${hub.name} in front`;

  return (
    <Card
      ref={cardRef}
      role='group'
      aria-labelledby={titleId}
      className={cn('@container w-full gap-4 p-5', className)}
    >
      <div className='flex items-baseline justify-between gap-3'>
        <h3 id={titleId} className='text-sm font-medium'>
          {title}
        </h3>
        {note && <SampleNote>{note}</SampleNote>}
      </div>
      <div className='flex flex-col gap-4 @sm:flex-row @sm:items-center'>
        <div
          onPointerDown={letGo}
          onKeyDownCapture={letGoBeforeArrowTurn}
          className='relative mx-auto aspect-square w-full max-w-[15rem] shrink-0 @sm:mx-0 @sm:w-44 @lg:w-56'
        >
          <div
            aria-hidden='true'
            className='bg-foreground/[0.04] absolute inset-[10%] rounded-full'
          />
          {hasAppeared && (
            <RouteLayer
              hub={hub}
              cities={cities}
              destinations={destinations}
              isHeld={isHeld}
              isActive={isOnScreen}
              label={globeLabel}
            />
          )}
        </div>
        <ul className='flex min-w-0 flex-1 flex-col gap-0.5'>
          {cities.map((city) => {
            const isPicked = city.id === hub.id;
            const isPressed = city.id === pressedId;
            const cityRoutes = destinationsOf(city.id, cities, routes);
            return (
              <li key={city.id}>
                <button
                  type='button'
                  aria-pressed={isPicked}
                  onClick={() => pick(city.id)}
                  className={cn(
                    ROW,
                    isPicked && PICKED_ROW,
                    pressedQuietOf(isPressed)
                  )}
                >
                  <span
                    aria-hidden='true'
                    className={cn(
                      'size-2 shrink-0 rounded-full',
                      dotOf(isPicked)
                    )}
                  />
                  <span className='min-w-0 flex-1 truncate @max-2xs:contents'>
                    <span className='font-medium @max-2xs:col-start-2 @max-2xs:row-start-1 @max-2xs:truncate'>
                      {city.name}
                    </span>
                    <span className='text-muted-foreground @max-2xs:col-[2/4] @max-2xs:row-start-2 @max-2xs:truncate @max-2xs:text-xs'>
                      <span className='@max-2xs:hidden'>, </span>
                      {city.country}
                    </span>
                  </span>
                  <span className='text-muted-foreground text-xs tabular-nums @max-2xs:col-start-3 @max-2xs:row-start-1'>
                    {routeCountOf(cityRoutes.length)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </Card>
  );
}

const CITIES: RouteCity[] = [
  {
    id: 'kinshasa',
    name: 'Kinshasa',
    country: 'DR Congo',
    location: [-4.44, 15.27],
  },
  {
    id: 'lisbon',
    name: 'Lisbon',
    country: 'Portugal',
    location: [38.72, -9.14],
  },
  { id: 'lagos', name: 'Lagos', country: 'Nigeria', location: [6.52, 3.38] },
  {
    id: 'new-york',
    name: 'New York',
    country: 'United States',
    location: [40.71, -74.01],
  },
  {
    id: 'sao-paulo',
    name: 'São Paulo',
    country: 'Brazil',
    location: [-23.55, -46.63],
  },
  {
    id: 'dubai',
    name: 'Dubai',
    country: 'United Arab Emirates',
    location: [25.2, 55.27],
  },
];

const ROUTES: Route[] = [
  { id: 'kinshasa-lagos', fromId: 'kinshasa', toId: 'lagos' },
  { id: 'kinshasa-lisbon', fromId: 'kinshasa', toId: 'lisbon' },
  { id: 'kinshasa-dubai', fromId: 'kinshasa', toId: 'dubai' },
  { id: 'kinshasa-sao-paulo', fromId: 'kinshasa', toId: 'sao-paulo' },
  { id: 'lisbon-new-york', fromId: 'lisbon', toId: 'new-york' },
  { id: 'lisbon-lagos', fromId: 'lisbon', toId: 'lagos' },
  { id: 'lisbon-dubai', fromId: 'lisbon', toId: 'dubai' },
  { id: 'lagos-sao-paulo', fromId: 'lagos', toId: 'sao-paulo' },
  { id: 'lagos-dubai', fromId: 'lagos', toId: 'dubai' },
  { id: 'new-york-sao-paulo', fromId: 'new-york', toId: 'sao-paulo' },
];

const FIRST_CITY_ID = 'kinshasa';

function announcementOf(cityId: string) {
  const city = CITIES.find((candidate) => candidate.id === cityId);
  if (!city) {
    return '';
  }
  const destinations = destinationsOf(cityId, CITIES, ROUTES);
  const names = destinations.map((destination) => destination.name);
  const count = routeCountOf(destinations.length);
  const list = names.join(', ');
  return `${city.name} in front, ${count}: ${list}`;
}

export default function Card12() {
  const [selectedId, setSelectedId] = useState(FIRST_CITY_ID);
  const { pressed, press } = usePress<string>();

  const steps: AutoplayStep[] = [
    { after: 2600, run: () => press('lagos') },
    { after: PRESS_LEAD_MS, run: () => setSelectedId('lagos') },
    { after: 3400, run: () => press('dubai') },
    { after: PRESS_LEAD_MS, run: () => setSelectedId('dubai') },
    { after: 3400, run: () => press('new-york') },
    { after: PRESS_LEAD_MS, run: () => setSelectedId('new-york') },
    { after: 3400, run: () => press(FIRST_CITY_ID) },
    { after: PRESS_LEAD_MS, run: () => setSelectedId(FIRST_CITY_ID) },
  ];
  const { ref, isAutoplaying } = useCardDemo(steps, {
    loopAfter: 800,
  });

  return (
    <div ref={ref} className='min-h-[18.75rem] w-full max-w-[36rem]'>
      <RouteGlobe
        title='Freight routes'
        cities={CITIES}
        routes={ROUTES}
        selectedId={selectedId}
        onSelect={setSelectedId}
        note='Illustrative'
        pressedId={pressed}
      />
      <LiveRegion
        message={spokenUnless(isAutoplaying, announcementOf(selectedId))}
      />
    </div>
  );
}
