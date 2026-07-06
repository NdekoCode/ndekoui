'use client';

import {
  Children,
  isValidElement,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import {
  useAutoplay,
  type AutoplayStep,
} from '@/registry/ndeko/hooks/use-autoplay';
import { cn } from '@/registry/ndeko/lib/utils';

import { hundredthsOf } from './_parts/rounded';
import { useHover } from './_parts/use-hover';

type CardPose = React.CSSProperties & {
  transform: string;
  transformOrigin: string;
  transitionDelay: string;
  zIndex: number;
};

type FanPlace = {
  angle: number;
  offset: number;
};

const DEFAULT_SPREAD_DEG = 20;

const DEFAULT_GAP_PX = 10;

const STAGGER_MS = 35;

/** Every card turns around the same point: under the middle of the stack, a little less than one card height below it. */
const PIVOT = '50% 190%';

/** At rest the cards behind the front one lean a little to either side, so the stack reads as a pile of cards. */
const REST_LEAN_DEG = 2;

function alternatingSignOf(index: number) {
  if (index % 2 === 0) {
    return 1;
  }
  return -1;
}

function restAngleOf(index: number) {
  if (index === 0) {
    return 0;
  }
  const sign = alternatingSignOf(index);
  const fading = 1 / Math.sqrt(index);
  return sign * REST_LEAN_DEG * fading;
}

/** The front card ends at the right end of the fan, each card behind it one step to its left. */
function fanPlaceOf(
  index: number,
  count: number,
  spread: number,
  gap: number
): FanPlace {
  const steps = count - 1;
  if (steps < 1) {
    return { angle: 0, offset: 0 };
  }
  const slot = steps - index;
  const share = slot / steps - 0.5;
  const fromMiddle = slot - steps / 2;
  return { angle: share * spread, offset: fromMiddle * gap };
}

/** The front card leads on the way out and the back card on the way in, so the cards never cross. */
function delayOf(index: number, count: number, isFannedOut: boolean) {
  if (isFannedOut) {
    return index * STAGGER_MS;
  }
  const fromBack = count - 1 - index;
  return fromBack * STAGGER_MS;
}

function placeOf(
  index: number,
  count: number,
  isFannedOut: boolean,
  spread: number,
  gap: number
): FanPlace {
  if (isFannedOut) {
    return fanPlaceOf(index, count, spread, gap);
  }
  return { angle: restAngleOf(index), offset: 0 };
}

function poseOf(
  index: number,
  count: number,
  isFannedOut: boolean,
  spread: number,
  gap: number
): CardPose {
  const place = placeOf(index, count, isFannedOut, spread, gap);
  const offset = hundredthsOf(place.offset);
  const angle = hundredthsOf(place.angle);
  const delay = delayOf(index, count, isFannedOut);
  return {
    transform: `translateX(${offset}px) rotate(${angle}deg)`,
    transformOrigin: PIVOT,
    transitionDelay: `${delay}ms`,
    zIndex: count - index,
  };
}

/** A card keeps its own key, so a stack whose cards change order moves each card instead of swapping their faces. */
function keyOf(card: ReactNode, index: number) {
  const hasKey = isValidElement(card) && card.key !== null;
  if (hasKey) {
    return card.key;
  }
  return index;
}

export type FanStackProps = {
  /** The cards, the front one first. */
  children: ReactNode;
  /** What the stack holds, read out when the keyboard reaches it: "Four wallpapers". */
  label: string;
  /** The angle between the two outermost cards once fanned out, in degrees. */
  spread?: number;
  /** The distance between two neighbouring cards once fanned out, in pixels. */
  gap?: number;
  /** Fans the cards out with no pointer on them, for a demonstration. */
  isFanned?: boolean;
  className?: string;
};

/**
 * A stack of cards that fans out under the pointer or the keyboard focus and closes again when they
 * leave. A finger cannot hover, so a tap opens the fan and the next tap closes it. Fanned, the outer
 * cards stand past the sides of the stack: with the default spread, leave about two thirds of a card
 * of room on each side.
 */
export function FanStack({
  children,
  label,
  spread = DEFAULT_SPREAD_DEG,
  gap = DEFAULT_GAP_PX,
  isFanned = false,
  className,
}: FanStackProps) {
  const cards = Children.toArray(children);
  const count = cards.length;
  const { isHovered, hoverHandlers } = useHover();
  const [isFocused, setIsFocused] = useState(false);
  const [isTapped, setIsTapped] = useState(false);
  const lastPointer = useRef('mouse');
  const isFannedOut = isFanned || isHovered || isFocused || isTapped;

  function rememberPointer(event: React.PointerEvent<HTMLDivElement>) {
    lastPointer.current = event.pointerType;
  }

  function toggleOnTap() {
    if (lastPointer.current === 'touch') {
      setIsTapped((current) => !current);
    }
  }

  function focusEnters(event: React.FocusEvent<HTMLDivElement>) {
    const isKeyboardFocus = event.target.matches(':focus-visible');
    if (isKeyboardFocus) {
      setIsFocused(true);
    }
  }

  function focusLeaves(event: React.FocusEvent<HTMLDivElement>) {
    const staysInside = event.currentTarget.contains(event.relatedTarget);
    if (staysInside) {
      return;
    }
    setIsFocused(false);
    setIsTapped(false);
  }

  return (
    <div
      role='group'
      aria-label={label}
      tabIndex={0}
      onPointerDown={rememberPointer}
      onClick={toggleOnTap}
      onFocus={focusEnters}
      onBlur={focusLeaves}
      className={cn(
        'focus-visible:ring-ring focus-visible:ring-offset-background grid w-fit rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-offset-4',
        className
      )}
      {...hoverHandlers}
    >
      {cards.map((card, index) => (
        <div
          key={keyOf(card, index)}
          style={poseOf(index, count, isFannedOut, spread, gap)}
          className='col-start-1 row-start-1 transition-transform duration-500 ease-(--ease-out-strong)'
        >
          {card}
        </div>
      ))}
    </div>
  );
}

type Wallpaper = {
  id: string;
  name: string;
  detail: string;
  picture: string;
};

function WallpaperCard({ wallpaper }: { wallpaper: Wallpaper }) {
  return (
    <figure className='bg-card hairline-ring ring-border flex w-32 flex-col gap-2 rounded-xl p-1.5 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
      <span
        aria-hidden='true'
        style={{ backgroundImage: `url(${wallpaper.picture})` }}
        className='block aspect-[4/5] rounded-[calc(var(--radius-xl)-0.375rem)] bg-cover bg-center'
      />
      <figcaption className='flex min-w-0 flex-col px-1 pb-0.5'>
        <span className='truncate text-[13px] font-medium'>
          {wallpaper.name}
        </span>
        <span className='text-muted-foreground truncate text-xs'>
          {wallpaper.detail}
        </span>
      </figcaption>
    </figure>
  );
}

const WALLPAPERS: Wallpaper[] = [
  {
    id: 'dawn',
    name: 'Dawn',
    detail: 'Indigo hills',
    picture: '/images/scenes/scene-01.svg',
  },
  {
    id: 'lagoon',
    name: 'Lagoon',
    detail: 'Teal valley',
    picture: '/images/scenes/scene-02.svg',
  },
  {
    id: 'ember',
    name: 'Ember',
    detail: 'Clay ridge',
    picture: '/images/scenes/scene-03.svg',
  },
  {
    id: 'nightfall',
    name: 'Nightfall',
    detail: 'Moonlit ridge',
    picture: '/images/scenes/scene-07.svg',
  },
];

export default function Effect01() {
  const [isFanned, setIsFanned] = useState(false);
  const { isHovered, hoverHandlers } = useHover();
  const steps: AutoplayStep[] = [
    { after: 1200, run: () => setIsFanned(true) },
    { after: 2400, run: () => setIsFanned(false) },
  ];
  const { ref, isAutoplaying } = useAutoplay(steps, {
    loopAfter: 1500,
    onReset: () => setIsFanned(false),
    isEnabled: !isHovered,
  });
  /** A pointer on the piece only pauses the demonstration, so its fan holds; once a person took over, the fan it left closes. */
  const isDemoStopped = !isAutoplaying && !isHovered;
  if (isDemoStopped && isFanned) {
    setIsFanned(false);
  }

  return (
    <div
      ref={ref}
      className='flex w-full justify-center py-2'
      {...hoverHandlers}
    >
      <FanStack label='Four wallpapers' isFanned={isFanned}>
        {WALLPAPERS.map((wallpaper) => (
          <WallpaperCard key={wallpaper.id} wallpaper={wallpaper} />
        ))}
      </FanStack>
    </div>
  );
}
