'use client';

import {
  motion,
  type MotionValue,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'motion/react';
import { useEffect, useRef, useState } from 'react';

import { cn } from '@/lib/utils';

export type HoverEffect = 'zoom' | 'rise' | 'tilt' | 'trace';

export type HoverEffectCardImage = {
  src: string;
  alt: string;
};

export type HoverEffectCardProps = Omit<
  React.ComponentProps<'a'>,
  'title' | 'children' | 'ref'
> & {
  effect: HoverEffect;
  title: React.ReactNode;
  description?: React.ReactNode;
  meta?: React.ReactNode;
  image?: HoverEffectCardImage;
};

type EffectProps = Omit<HoverEffectCardProps, 'effect'>;

const LINK = [
  'group/card relative block rounded-xl cursor-pointer outline-none',
  'transition-[scale] duration-150 ease-(--ease-out-strong) active:scale-[0.97]',
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
].join(' ');

const SURFACE = [
  'relative isolate flex flex-col overflow-hidden rounded-xl bg-card text-card-foreground',
  'hairline-ring ring-border shadow-[0_1px_2px_rgb(0_0_0/0.04)]',
].join(' ');

const CARD = cn(LINK, SURFACE);

const CARD_RADIUS = 14;

function CardImage({
  image,
  className,
}: {
  image: HoverEffectCardImage;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- registry items land in any React app, where next/image may not exist
    <img
      src={image.src}
      alt={image.alt}
      className={cn('size-full object-cover', className)}
    />
  );
}

function CardText({
  title,
  description,
  meta,
}: Pick<EffectProps, 'title' | 'description' | 'meta'>) {
  return (
    <div className='flex flex-col gap-1 p-4'>
      <h3 className='text-foreground text-sm font-medium text-balance'>
        {title}
      </h3>
      {description && (
        <p className='text-muted-foreground text-[13px]'>{description}</p>
      )}
      {meta && (
        <div className='text-muted-foreground mt-2 flex items-center gap-2 text-xs'>
          {meta}
        </div>
      )}
    </div>
  );
}

const ZOOMING_IMAGE = [
  'transition-[scale] duration-300 ease-(--ease-out-strong)',
  'motion-safe:group-hover/card:scale-[1.04] motion-safe:group-hover/card:duration-500',
].join(' ');

function ZoomCard({
  title,
  description,
  meta,
  image,
  className,
  ...props
}: EffectProps) {
  return (
    <a className={cn(CARD, className)} {...props}>
      {image && (
        <div className='relative aspect-[3/2] overflow-hidden'>
          <CardImage image={image} className={ZOOMING_IMAGE} />
        </div>
      )}
      <CardText title={title} description={description} meta={meta} />
    </a>
  );
}

const RISING_PANEL = [
  'surface-raised absolute inset-x-3 bottom-3 flex items-center gap-2 rounded-lg px-3 py-2 text-xs',
  'transition-[opacity,translate] duration-150 ease-(--ease-out-strong)',
  '[@media(hover:hover)]:translate-y-2 [@media(hover:hover)]:opacity-0',
  'group-hover/card:translate-y-0 group-hover/card:opacity-100 group-hover/card:duration-250',
  'group-focus-visible/card:translate-y-0 group-focus-visible/card:opacity-100',
].join(' ');

function RiseCard({
  title,
  description,
  meta,
  image,
  className,
  ...props
}: EffectProps) {
  return (
    <a className={cn(CARD, className)} {...props}>
      <div className='bg-foreground/[0.03] relative aspect-[4/3] overflow-hidden'>
        {image && <CardImage image={image} />}
        {meta && <div className={RISING_PANEL}>{meta}</div>}
      </div>
      <CardText title={title} description={description} />
    </a>
  );
}

const TILT_DEGREES = 7;

const TILT_PERSPECTIVE = 900;

const TILT_SPRING = { stiffness: 260, damping: 32 };

const EDGE_MASK = {
  mask: 'linear-gradient(black, black) content-box exclude, linear-gradient(black, black)',
  WebkitMask:
    'linear-gradient(black, black) content-box xor, linear-gradient(black, black)',
};

const EDGE_LIGHT = [
  'pointer-events-none absolute inset-0 rounded-[inherit] p-(--hairline) opacity-0',
  'transition-opacity duration-150 group-hover/card:opacity-100 group-hover/card:duration-200',
].join(' ');

function isMouse(event: React.PointerEvent) {
  return event.pointerType === 'mouse';
}

function tiltStyleOf(
  prefersReducedMotion: boolean | null,
  rotateX: MotionValue<number>,
  rotateY: MotionValue<number>
) {
  if (prefersReducedMotion) {
    return undefined;
  }
  return { rotateX, rotateY, transformPerspective: TILT_PERSPECTIVE };
}

function TiltCard({
  title,
  description,
  meta,
  image,
  className,
  onPointerMove,
  onPointerLeave,
  ...props
}: EffectProps) {
  const prefersReducedMotion = useReducedMotion();
  const pointerX = useMotionValue(0.5);
  const pointerY = useMotionValue(0.5);
  const smoothX = useSpring(pointerX, TILT_SPRING);
  const smoothY = useSpring(pointerY, TILT_SPRING);
  const rotateY = useTransform(smoothX, [0, 1], [-TILT_DEGREES, TILT_DEGREES]);
  const rotateX = useTransform(smoothY, [0, 1], [TILT_DEGREES, -TILT_DEGREES]);
  const lightX = useTransform(pointerX, [0, 1], [0, 100]);
  const lightY = useTransform(pointerY, [0, 1], [0, 100]);
  const edgeLight = useMotionTemplate`radial-gradient(160px circle at ${lightX}% ${lightY}%, color-mix(in oklab, var(--foreground) 45%, transparent), transparent 70%)`;
  const tiltStyle = tiltStyleOf(prefersReducedMotion, rotateX, rotateY);

  function followPointer(event: React.PointerEvent<HTMLAnchorElement>) {
    onPointerMove?.(event);
    if (!isMouse(event)) {
      return;
    }
    const bounds = event.currentTarget.getBoundingClientRect();
    const offsetX = event.clientX - bounds.left;
    const offsetY = event.clientY - bounds.top;
    const ratioX = offsetX / bounds.width;
    const ratioY = offsetY / bounds.height;
    pointerX.set(ratioX);
    pointerY.set(ratioY);
  }

  function settle(event: React.PointerEvent<HTMLAnchorElement>) {
    onPointerLeave?.(event);
    pointerX.set(0.5);
    pointerY.set(0.5);
  }

  return (
    <a
      className={cn(LINK, className)}
      onPointerMove={followPointer}
      onPointerLeave={settle}
      {...props}
    >
      <motion.div className={cn(SURFACE, 'h-full')} style={tiltStyle}>
        {image && (
          <div className='relative aspect-[3/2] overflow-hidden'>
            <CardImage image={image} />
          </div>
        )}
        <CardText title={title} description={description} meta={meta} />
        <motion.span
          aria-hidden='true'
          className={EDGE_LIGHT}
          style={{ background: edgeLight, ...EDGE_MASK }}
        />
      </motion.div>
    </a>
  );
}

const TRACE_STROKE = 1.5;

const TRACE_PATH = [
  'fill-none stroke-primary [stroke-dasharray:1] [stroke-dashoffset:1]',
  'transition-[stroke-dashoffset] duration-200 ease-(--ease-out-strong)',
  'group-hover/card:[stroke-dashoffset:0] group-hover/card:duration-500 group-hover/card:ease-(--ease-in-out-strong)',
  'group-focus-visible/card:[stroke-dashoffset:0]',
].join(' ');

type Size = { width: number; height: number };

function roundedOutlineOf({ width, height }: Size, radius: number) {
  const inset = TRACE_STROKE / 2;
  const r = radius - inset;
  const right = width - inset;
  const bottom = height - inset;
  const left = inset;
  const top = inset;
  return [
    `M ${left + r} ${top}`,
    `H ${right - r}`,
    `A ${r} ${r} 0 0 1 ${right} ${top + r}`,
    `V ${bottom - r}`,
    `A ${r} ${r} 0 0 1 ${right - r} ${bottom}`,
    `H ${left + r}`,
    `A ${r} ${r} 0 0 1 ${left} ${bottom - r}`,
    `V ${top + r}`,
    `A ${r} ${r} 0 0 1 ${left + r} ${top}`,
    'Z',
  ].join(' ');
}

function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState<Size | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }
    const observer = new ResizeObserver(([entry]) => {
      const box = entry.borderBoxSize[0];
      setSize({ width: box.inlineSize, height: box.blockSize });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return { ref, size };
}

function TraceCard({
  title,
  description,
  meta,
  image,
  className,
  ...props
}: EffectProps) {
  const { ref, size } = useElementSize<HTMLAnchorElement>();

  return (
    <a ref={ref} className={cn(CARD, className)} {...props}>
      {image && (
        <div className='relative aspect-[3/2] overflow-hidden'>
          <CardImage image={image} />
        </div>
      )}
      <CardText title={title} description={description} meta={meta} />
      {size && (
        <svg
          aria-hidden='true'
          className='pointer-events-none absolute inset-0 size-full'
          viewBox={`0 0 ${size.width} ${size.height}`}
        >
          <path
            d={roundedOutlineOf(size, CARD_RADIUS)}
            pathLength={1}
            strokeWidth={TRACE_STROKE}
            className={TRACE_PATH}
          />
        </svg>
      )}
    </a>
  );
}

export function HoverEffectCard({ effect, ...props }: HoverEffectCardProps) {
  if (effect === 'zoom') {
    return <ZoomCard {...props} />;
  }
  if (effect === 'rise') {
    return <RiseCard {...props} />;
  }
  if (effect === 'tilt') {
    return <TiltCard {...props} />;
  }
  return <TraceCard {...props} />;
}
