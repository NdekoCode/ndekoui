'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';

import { WordRoll } from '@/components/core/word-roll';
import {
  useAutoplay,
  type AutoplayStep,
} from '@/registry/ndeko/hooks/use-autoplay';
import { useKeptHeight } from '@/registry/ndeko/hooks/use-kept-height';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { cn } from '@/registry/ndeko/lib/utils';
import { Card, CardContent } from '@/registry/ndeko/ui/card';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { Segments, type Segment } from '@/registry/ndeko/ui/segments';

type SweepLight = 'sweeping' | 'still';

const SweepContext = createContext<SweepLight>('still');

const BAND_WIDTH_PX = 280;
const SPEED_PX_PER_MS = 0.7;
const PASS_SHARE = 0.72;

const BLOCK_BASE = [
  'relative block overflow-hidden rounded-md',
  '[--sweep-light:color-mix(in_oklab,var(--card)_85%,transparent)] dark:[--sweep-light:color-mix(in_oklab,var(--foreground)_10%,transparent)]',
].join(' ');

const BAND =
  'pointer-events-none absolute inset-y-0 left-0 w-[280px] bg-[linear-gradient(90deg,transparent,var(--sweep-light),transparent)]';

function tintOf(light: SweepLight) {
  if (light === 'sweeping') {
    return 'bg-foreground/[0.06]';
  }
  return 'bg-foreground/[0.08]';
}

function lightOf(isSweeping: boolean): SweepLight {
  if (isSweeping) {
    return 'sweeping';
  }
  return 'still';
}

function keyframesOf(blockLeft: number, viewportWidth: number): Keyframe[] {
  const start = -BAND_WIDTH_PX - blockLeft;
  const end = viewportWidth - blockLeft;
  const from = `${start}px 0`;
  const to = `${end}px 0`;
  return [
    { translate: from, offset: 0 },
    { translate: to, offset: PASS_SHARE },
    { translate: to, offset: 1 },
  ];
}

function periodOf(viewportWidth: number) {
  const travel = viewportWidth + BAND_WIDTH_PX;
  const passMs = travel / SPEED_PX_PER_MS;
  return Math.round(passMs / PASS_SHARE);
}

/**
 * Every band runs on the document timeline (start time 0), so all of them are at the same phase,
 * and each is shifted by the left edge of its own block, so they draw one light across the page.
 */
function SweepBand() {
  const bandRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const band = bandRef.current;
    const block = band?.parentElement;
    if (!band || !block) {
      return;
    }
    let animation: Animation | undefined;

    const restart = () => {
      animation?.cancel();
      const { left } = block.getBoundingClientRect();
      const width = window.innerWidth;
      const keyframes = keyframesOf(left, width);
      animation = band.animate(keyframes, {
        duration: periodOf(width),
        iterations: Infinity,
      });
      animation.startTime = 0;
    };

    restart();
    const observer = new ResizeObserver(restart);
    observer.observe(block);
    window.addEventListener('resize', restart);

    return () => {
      animation?.cancel();
      observer.disconnect();
      window.removeEventListener('resize', restart);
    };
  }, []);

  return <span ref={bandRef} aria-hidden='true' className={BAND} />;
}

type SweepScopeProps = {
  isActive: boolean;
  children: React.ReactNode;
};

export function SweepScope({ isActive, children }: SweepScopeProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const isSweeping = isActive && !shouldReduceMotion;
  const light = lightOf(isSweeping);

  return (
    <SweepContext.Provider value={light}>{children}</SweepContext.Provider>
  );
}

export function SweepBlock({ className }: { className?: string }) {
  const light = useContext(SweepContext);
  const isSweeping = light === 'sweeping';

  return (
    <span
      data-slot='sweep-block'
      aria-hidden='true'
      className={cn(BLOCK_BASE, tintOf(light), className)}
    >
      {isSweeping && <SweepBand />}
    </span>
  );
}

export type SkeletonKind = 'text' | 'profile' | 'list' | 'media';

const KINDS: Segment<SkeletonKind>[] = [
  { value: 'text', label: 'Text' },
  { value: 'profile', label: 'Profile' },
  { value: 'list', label: 'List' },
  { value: 'media', label: 'Media' },
];

const STANDS_IN_FOR: Record<SkeletonKind, string> = {
  text: 'An article or a description',
  profile: 'A person and what they do',
  list: 'Rows of an inbox or a table',
  media: 'A grid of covers or photos',
};

const STANDS_IN_FOR_LABELS = KINDS.map((kind) => STANDS_IN_FOR[kind.value]);

const BODY_WIDTHS = ['w-full', 'w-11/12', 'w-full', 'w-10/12'];

const LAST_LINE_WIDTH = 'w-1/2';

const STAT_COUNT = 3;

function lineWidthsOf(lines: number) {
  const bodyCount = Math.max(1, lines) - 1;
  const widths: string[] = [];
  for (let index = 0; index < bodyCount; index += 1) {
    const width = BODY_WIDTHS[index % BODY_WIDTHS.length];
    widths.push(width);
  }
  widths.push(LAST_LINE_WIDTH);
  return widths;
}

function indexesOf(count: number) {
  const safeCount = Math.max(1, count);
  return Array.from({ length: safeCount }, (_, index) => index);
}

type TextSkeletonProps = {
  lines?: number;
};

export function TextSkeleton({ lines = 4 }: TextSkeletonProps) {
  const widths = lineWidthsOf(lines);

  return (
    <div className='flex flex-col gap-4'>
      <SweepBlock className='h-4 w-1/2 rounded-full' />
      <div className='flex flex-col gap-2.5'>
        {widths.map((width, index) => (
          <SweepBlock
            key={`${index}-${width}`}
            className={cn('h-3 rounded-full', width)}
          />
        ))}
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className='flex flex-col gap-4'>
      <div className='flex flex-col'>
        <SweepBlock className='h-20 w-full rounded-lg' />
        <SweepBlock className='ring-card ms-4 -mt-7 size-14 rounded-full ring-4' />
      </div>
      <div className='flex flex-col gap-2'>
        <SweepBlock className='h-3.5 w-1/3 rounded-full' />
        <SweepBlock className='h-3 w-1/2 rounded-full' />
      </div>
      <div className='flex gap-6'>
        {indexesOf(STAT_COUNT).map((stat) => (
          <div key={stat} className='flex flex-col gap-1.5'>
            <SweepBlock className='h-3.5 w-8 rounded-full' />
            <SweepBlock className='h-2.5 w-12 rounded-full' />
          </div>
        ))}
      </div>
      <SweepBlock className='h-8 w-28 rounded-full' />
    </div>
  );
}

type ListSkeletonProps = {
  rows?: number;
};

export function ListSkeleton({ rows = 4 }: ListSkeletonProps) {
  return (
    <div className='flex flex-col gap-4'>
      {indexesOf(rows).map((row) => (
        <div key={row} className='flex items-center gap-3'>
          <SweepBlock className='size-8 shrink-0 rounded-full' />
          <div className='flex min-w-0 flex-1 flex-col gap-2'>
            <SweepBlock className='h-3 w-2/5 rounded-full' />
            <SweepBlock className='h-2.5 w-3/4 rounded-full' />
          </div>
          <SweepBlock className='h-5 w-10 shrink-0 rounded-md' />
        </div>
      ))}
    </div>
  );
}

type MediaSkeletonProps = {
  tiles?: number;
};

export function MediaSkeleton({ tiles = 4 }: MediaSkeletonProps) {
  return (
    <div className='grid grid-cols-2 gap-3'>
      {indexesOf(tiles).map((tile) => (
        <div key={tile} className='flex flex-col gap-2'>
          <SweepBlock className='aspect-[3/2] w-full rounded-lg' />
          <SweepBlock className='h-3 w-3/4 rounded-full' />
        </div>
      ))}
    </div>
  );
}

type SkeletonPresetProps = {
  kind: SkeletonKind;
};

export function SkeletonPreset({ kind }: SkeletonPresetProps) {
  if (kind === 'profile') {
    return <ProfileSkeleton />;
  }
  if (kind === 'list') {
    return <ListSkeleton />;
  }
  if (kind === 'media') {
    return <MediaSkeleton />;
  }
  return <TextSkeleton />;
}

const KIND_ANNOUNCEMENTS: Record<SkeletonKind, string> = {
  text: 'Showing the text skeleton',
  profile: 'Showing the profile skeleton',
  list: 'Showing the list skeleton',
  media: 'Showing the media skeleton',
};

export default function Loading06() {
  const [kind, setKind] = useState<SkeletonKind>('text');
  const [announcement, setAnnouncement] = useState('');

  const steps: AutoplayStep[] = [
    { after: 2800, run: () => setKind('profile') },
    { after: 2800, run: () => setKind('list') },
    { after: 2800, run: () => setKind('media') },
  ];
  const { ref, isInView } = useAutoplay(steps, {
    loopAfter: 2400,
    onReset: () => setKind('text'),
  });

  useKeptHeight(ref);

  function chooseKind(next: SkeletonKind) {
    setKind(next);
    setAnnouncement(KIND_ANNOUNCEMENTS[next]);
  }

  return (
    <div
      ref={ref}
      className='flex min-h-[28rem] w-full max-w-sm flex-col gap-3'
    >
      <Segments
        label='Skeleton preset'
        value={kind}
        segments={KINDS}
        onValueChange={chooseKind}
      />
      <Card className='py-4'>
        <CardContent className='min-h-[20rem] px-4'>
          <SweepScope isActive={isInView}>
            <SkeletonPreset kind={kind} />
          </SweepScope>
        </CardContent>
      </Card>
      <p className='text-muted-foreground flex min-h-4 gap-1 px-1 text-xs'>
        <span>Stands in for</span>
        <WordRoll
          text={STANDS_IN_FOR[kind]}
          labels={STANDS_IN_FOR_LABELS}
          className='text-foreground'
        />
      </p>
      <LiveRegion message={announcement} />
    </div>
  );
}
