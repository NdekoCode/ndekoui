'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';

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

type PageKind = 'profile' | 'feed' | 'gallery';

const PAGE_KINDS: Segment<PageKind>[] = [
  { value: 'profile', label: 'Profile' },
  { value: 'feed', label: 'Feed' },
  { value: 'gallery', label: 'Gallery' },
];

const FEED_ROWS = [0, 1, 2];

const GALLERY_TILES = [0, 1, 2, 3];

function ProfileSkeleton() {
  return (
    <div className='flex flex-col gap-4'>
      <div className='flex items-center gap-3'>
        <SweepBlock className='size-10 shrink-0 rounded-full' />
        <div className='flex min-w-0 flex-1 flex-col gap-2'>
          <SweepBlock className='h-3 w-2/5 rounded-full' />
          <SweepBlock className='h-2.5 w-1/4 rounded-full' />
        </div>
      </div>
      <div className='flex flex-col gap-2'>
        <SweepBlock className='h-3 w-full rounded-full' />
        <SweepBlock className='h-3 w-11/12 rounded-full' />
        <SweepBlock className='h-3 w-3/5 rounded-full' />
      </div>
      <SweepBlock className='h-24 w-full rounded-lg' />
      <div className='flex gap-2'>
        <SweepBlock className='h-8 w-24 rounded-full' />
        <SweepBlock className='h-8 w-20 rounded-full' />
      </div>
    </div>
  );
}

function FeedSkeleton() {
  return (
    <div className='flex flex-col gap-5'>
      {FEED_ROWS.map((row) => (
        <div key={row} className='flex items-start gap-3'>
          <SweepBlock className='size-8 shrink-0 rounded-full' />
          <div className='flex min-w-0 flex-1 flex-col gap-2'>
            <SweepBlock className='h-3 w-1/3 rounded-full' />
            <SweepBlock className='h-3 w-full rounded-full' />
            <SweepBlock className='h-3 w-4/5 rounded-full' />
          </div>
        </div>
      ))}
    </div>
  );
}

function GallerySkeleton() {
  return (
    <div className='grid grid-cols-2 gap-3'>
      {GALLERY_TILES.map((tile) => (
        <div key={tile} className='flex flex-col gap-2'>
          <SweepBlock className='h-20 w-full rounded-lg' />
          <SweepBlock className='h-3 w-3/4 rounded-full' />
        </div>
      ))}
    </div>
  );
}

function PageSkeleton({ kind }: { kind: PageKind }) {
  if (kind === 'feed') {
    return <FeedSkeleton />;
  }
  if (kind === 'gallery') {
    return <GallerySkeleton />;
  }
  return <ProfileSkeleton />;
}

const KIND_ANNOUNCEMENTS: Record<PageKind, string> = {
  profile: 'Showing the profile skeleton',
  feed: 'Showing the feed skeleton',
  gallery: 'Showing the gallery skeleton',
};

export default function Loading05() {
  const [kind, setKind] = useState<PageKind>('profile');
  const [announcement, setAnnouncement] = useState('');

  const steps: AutoplayStep[] = [
    { after: 3200, run: () => setKind('feed') },
    { after: 3200, run: () => setKind('gallery') },
    { after: 3200, run: () => setKind('profile') },
  ];
  const { ref, isInView } = useAutoplay(steps, {
    loopAfter: 2400,
    onReset: () => setKind('profile'),
  });

  useKeptHeight(ref);

  function chooseKind(next: PageKind) {
    setKind(next);
    setAnnouncement(KIND_ANNOUNCEMENTS[next]);
  }

  return (
    <div
      ref={ref}
      className='flex min-h-[26rem] w-full max-w-sm flex-col gap-3'
    >
      <Segments
        label='Page skeleton'
        value={kind}
        segments={PAGE_KINDS}
        onValueChange={chooseKind}
      />
      <Card className='py-4'>
        <CardContent className='min-h-[20rem] px-4'>
          <SweepScope isActive={isInView}>
            <PageSkeleton kind={kind} />
          </SweepScope>
        </CardContent>
      </Card>
      <LiveRegion message={announcement} />
    </div>
  );
}
