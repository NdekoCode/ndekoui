import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';

import { PauseOffscreen } from '@/app/_site/pause-offscreen';
import { REPOSITORY_URL } from '@/app/_site/repository';
import { ShadcnMark } from '@/app/mcp/_components/client-marks';
import { CLIENTS } from '@/app/mcp/_components/clients';
import {
  ArrowRightIcon,
  GithubIcon,
  ReactBrandIcon,
  StarIcon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';

import { DISPLAY_TITLE } from './section-heading';
import { TileField } from './tile-field';

/** The manual setup entry is not a tool of its own. */
const OTHER_CLIENT_ID = 'other';

/* One grain wash of the primary colour poured from the top centre of the hero. */
const HERO_WASH =
  'grain-wash absolute inset-x-0 top-0 h-[40rem] [--wash-a:50%_0%] [--wash-b:50%_0%] [--wash-strength:0.5]';

const SETTLE_STEP_MS = 70;

const NUMBER_FORMAT = new Intl.NumberFormat('en-US');

type HomeHeroProps = {
  componentPhrase: string;
  starCount: number | null;
  children: ReactNode;
};

function markedClients() {
  return CLIENTS.filter((client) => client.id !== OTHER_CLIENT_ID);
}

function settleDelayOf(step: number): CSSProperties {
  const delay = step * SETTLE_STEP_MS;
  return { animationDelay: `${delay}ms` };
}

type SettleProps = {
  step: number;
  /** A large surface fades and rises without the blur. */
  isLarge?: boolean;
  /**
   * The title, the largest text of the page: it sharpens and rises without fading in. A browser
   * counts a line still at opacity 0 as not shown, and a slow phone would wait seconds for it.
   */
  isShownAtOnce?: boolean;
  className?: string;
  children: ReactNode;
};

function settleClassOf(isLarge: boolean, isShownAtOnce: boolean) {
  if (isShownAtOnce) {
    return 'motion-safe:animate-sharpen';
  }
  if (isLarge) {
    return 'motion-safe:animate-settle-plain';
  }
  return 'motion-safe:animate-settle';
}

/** One line of the hero: it sharpens and rises into place on load, a beat after the line above it. */
function Settle({
  step,
  isLarge = false,
  isShownAtOnce = false,
  className,
  children,
}: SettleProps) {
  return (
    <div
      style={settleDelayOf(step)}
      className={cn(settleClassOf(isLarge, isShownAtOnce), className)}
    >
      {children}
    </div>
  );
}

function StarCount({ starCount }: { starCount: number | null }) {
  const hasCount = starCount !== null;
  if (!hasCount) {
    return null;
  }
  const label = NUMBER_FORMAT.format(starCount);
  return (
    <span className='bg-foreground/[0.06] text-muted-foreground inline-flex items-center gap-1 rounded-full px-1.5 text-xs tabular-nums'>
      <StarIcon className='size-3' />
      {label}
    </span>
  );
}

/** Behind the header and the hero: the brand glow and the tiles. */
export function HeroBackdrop() {
  return (
    <PauseOffscreen
      aria-hidden='true'
      className='pointer-events-none absolute inset-x-0 top-0 -z-10 h-[64rem] mask-b-from-60%'
    >
      <div className={HERO_WASH} />
      <TileField className='top-24' />
    </PauseOffscreen>
  );
}

function BuiltWith() {
  return (
    <p className='flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-base font-medium'>
      <span className='flex items-center gap-2'>
        Built for
        <ReactBrandIcon className='size-5 text-[#58c4dc]' />
        React
      </span>
      <span className='flex items-center gap-2'>
        Installed with
        <ShadcnMark className='size-4' />
        shadcn
      </span>
    </p>
  );
}

function WorksWith() {
  const clients = markedClients();

  return (
    <div className='flex flex-col items-center gap-5'>
      <p className='text-muted-foreground text-sm'>
        Open it in, or connect it to, the tools you already use
      </p>
      <ul className='flex max-w-2xl flex-wrap justify-center gap-x-8 gap-y-5 grayscale'>
        {clients.map((client) => (
          <li
            key={client.id}
            title={client.name}
            className='text-foreground/70 flex items-center opacity-80'
          >
            <client.Mark className='size-7' />
            <span className='sr-only'>{client.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** The first screen. Its children are the product view, which settles last. */
export function HomeHero({
  componentPhrase,
  starCount,
  children,
}: HomeHeroProps) {
  return (
    <section
      aria-labelledby='home-title'
      className='flex flex-col items-center px-4 pt-10 text-center sm:pt-14'
    >
      <div className='flex flex-col items-center gap-5'>
        <Settle step={0}>
          <p className='bg-card/80 text-primary-ink hairline-ring ring-border rounded-full px-3 py-1 text-xs font-medium shadow-[0_1px_2px_rgb(0_0_0/0.04)] backdrop-blur-sm'>
            {componentPhrase}
            <span className='max-sm:hidden'>, free and open source</span>
          </p>
        </Settle>
        <Settle step={1} isShownAtOnce>
          <h1 id='home-title' className={cn(DISPLAY_TITLE, 'max-w-4xl')}>
            <span className='text-tint'>React components</span> that animate
            every change of state
          </h1>
        </Settle>
        <Settle step={2}>
          <BuiltWith />
        </Settle>
        <Settle step={3}>
          <p className='text-muted-foreground max-w-2xl text-base text-pretty sm:text-lg'>
            Primitives, components, blocks and templates on one design language.
            Copy them with one command, or let your editor fetch them through
            MCP.
          </p>
        </Settle>
      </div>
      <Settle
        step={4}
        className='mt-8 flex flex-wrap items-center justify-center gap-3'
      >
        <Button
          size='lg'
          nativeButton={false}
          className='rounded-full px-5'
          render={<Link href='/components' />}
        >
          Browse components
          <ArrowRightIcon />
        </Button>
        <Button
          size='lg'
          variant='outline'
          nativeButton={false}
          className='rounded-full px-5'
          role='link'
          render={<a href={REPOSITORY_URL} />}
        >
          <GithubIcon />
          Star on GitHub
          <StarCount starCount={starCount} />
        </Button>
      </Settle>
      <Settle
        step={5}
        isLarge
        className='mt-12 w-full max-w-7xl sm:mt-14 md:px-4'
      >
        {children}
      </Settle>
      <Settle step={7} className='mt-20 sm:mt-24'>
        <WorksWith />
      </Settle>
    </section>
  );
}
