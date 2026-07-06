'use client';

import { useMemo, useState } from 'react';

import { BrandLogo, type BrandSlug } from '@/registry/ndeko/lib/brand-logos';
import { cn } from '@/registry/ndeko/lib/utils';

import { useSceneFrames, type SceneFrame } from './_parts/use-scene-frames';
import { useScenePlay } from './_parts/use-scene-play';

export type OverloadWindow = {
  id: string;
  /** The site in the tab that is open. */
  title: string;
  brand: BrandSlug;
  /** How many more tabs wait behind it. */
  tabCount: number;
};

type Slot = {
  left: string;
  top: string;
};

/** Where each window of the pile sits, back to front. The pile holds five windows at most. */
const SLOTS: Slot[] = [
  { left: '4%', top: '8%' },
  { left: '30%', top: '4%' },
  { left: '14%', top: '26%' },
  { left: '46%', top: '24%' },
  { left: '26%', top: '44%' },
];

/** The order the highlight visits the slots when nobody points: never two neighbours in a row. */
const TOUR = [4, 1, 3, 0, 2];

const WANDER_MS = 1800;

const MAX_STUB_TABS = 6;

const DOTS = [0, 1, 2];

function tourOf(windowCount: number) {
  const visited = TOUR.filter((slot) => slot < windowCount);
  const frames: SceneFrame<number>[] = visited.map((slot) => ({
    state: slot,
    holdMs: WANDER_MS,
  }));
  if (frames.length === 0) {
    return [{ state: 0, holdMs: WANDER_MS }];
  }
  return frames;
}

function stubsOf(tabCount: number) {
  const shown = Math.min(tabCount, MAX_STUB_TABS);
  return Array.from({ length: shown }, (_, index) => index);
}

function labelOf(windows: OverloadWindow[]) {
  const titles = windows.map((site) => site.title);
  const list = titles.join(', ');
  return `${windows.length} browser windows piled on each other: ${list}`;
}

type BrowserWindowProps = {
  site: OverloadWindow;
  slot: Slot;
  isLit: boolean;
  onPoint: () => void;
};

function BrowserWindow({ site, slot, isLit, onPoint }: BrowserWindowProps) {
  return (
    <div
      data-lit={isLit}
      style={slot}
      onPointerEnter={onPoint}
      className='bg-card absolute h-[46%] w-[48%] rounded-lg transition-[translate] duration-300 ease-(--ease-out-strong) data-[lit=true]:-translate-y-1.5'
    >
      <span className='hairline-ring ring-border absolute inset-0 rounded-[inherit] shadow-[0_1px_2px_rgb(0_0_0/0.06)]' />
      <span
        data-lit={isLit}
        className='hairline-ring ring-primary-ink absolute inset-0 rounded-[inherit] opacity-0 shadow-[0_4px_8px_-2px_rgb(0_0_0/0.06),0_12px_32px_-4px_rgb(0_0_0/0.1)] transition-opacity duration-300 ease-(--ease-out-strong) data-[lit=true]:opacity-100'
      />
      <div className='relative flex h-full flex-col overflow-hidden rounded-[inherit]'>
        <div className='bg-foreground/[0.04] flex h-6 shrink-0 items-center gap-1.5 px-2'>
          <span className='flex shrink-0 gap-1'>
            {DOTS.map((dot) => (
              <span
                key={dot}
                className='bg-foreground/15 size-1.5 rounded-full'
              />
            ))}
          </span>
          <span className='bg-card flex h-4 max-w-[70%] shrink-0 items-center gap-1 rounded-[5px] px-1.5'>
            <BrandLogo brand={site.brand} className='size-2.5 shrink-0' />
            <span className='truncate text-[10px] leading-none font-medium'>
              {site.title}
            </span>
          </span>
          <span className='flex min-w-0 gap-1.5 overflow-hidden'>
            {stubsOf(site.tabCount).map((stub) => (
              <span
                key={stub}
                className='bg-foreground/[0.07] h-2.5 w-4 shrink-0 rounded-[3px]'
              />
            ))}
          </span>
        </div>
        <div className='flex min-h-0 flex-1 flex-col gap-1.5 p-2'>
          <span className='bg-foreground/[0.09] h-1.5 w-3/5 shrink-0 rounded-full' />
          <span className='bg-foreground/[0.05] h-1.5 w-full shrink-0 rounded-full' />
          <span className='bg-foreground/[0.05] h-1.5 w-4/5 shrink-0 rounded-full' />
          <span className='bg-foreground/[0.04] mt-0.5 min-h-0 flex-1 rounded-md' />
        </div>
      </div>
    </div>
  );
}

export type TabOverloadProps = {
  /** Back to front. The pile shows the first five. */
  windows: OverloadWindow[];
  className?: string;
};

export function TabOverload({ windows, className }: TabOverloadProps) {
  const { ref, isPlaying, isStill } = useScenePlay();
  const [pointed, setPointed] = useState<number | null>(null);
  const pile = windows.slice(0, SLOTS.length);
  const tour = useMemo(() => tourOf(pile.length), [pile.length]);
  const isWandering = isPlaying && pointed === null;
  const wandering = useSceneFrames(tour, { isPlaying: isWandering, isStill });
  const lit = pointed ?? wandering;

  return (
    <div
      ref={ref}
      role='img'
      aria-label={labelOf(pile)}
      onPointerLeave={() => setPointed(null)}
      className={cn(
        'bg-foreground/[0.03] relative aspect-[4/3] w-full max-w-[22rem] rounded-xl',
        className
      )}
    >
      {pile.map((site, index) => (
        <BrowserWindow
          key={site.id}
          site={site}
          slot={SLOTS[index]}
          isLit={index === lit}
          onPoint={() => setPointed(index)}
        />
      ))}
    </div>
  );
}

const WINDOWS: OverloadWindow[] = [
  { id: 'linear', title: 'Linear', brand: 'linear', tabCount: 5 },
  { id: 'github', title: 'GitHub', brand: 'github', tabCount: 3 },
  { id: 'notion', title: 'Notion', brand: 'notion', tabCount: 6 },
  { id: 'figma', title: 'Figma', brand: 'figma', tabCount: 4 },
  { id: 'gmail', title: 'Gmail', brand: 'gmail', tabCount: 6 },
];

export default function Illustration05() {
  return <TabOverload windows={WINDOWS} />;
}
