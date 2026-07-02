import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';

import { REPOSITORY_URL } from '@/app/_site/repository';
import { CLIENTS } from '@/app/mcp/_components/clients';
import { ShadcnMark } from '@/app/mcp/_components/client-marks';
import { countLabel } from '@/lib/site';
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

/** Clients drawn with a real mark; the others only have a monogram, which reads as a placeholder here. */
const MARKED_CLIENT_IDS = new Set([
  'claude-code',
  'claude',
  'cursor',
  'windsurf',
  'gemini-cli',
  'zed',
  'warp',
  'opencode',
  'v0',
]);

const GLOW_STYLE: CSSProperties = {
  backgroundImage:
    'radial-gradient(70% 55% at 50% 0%, color-mix(in oklab, var(--primary) 20%, transparent), transparent 72%)',
};

const SETTLE_STEP_MS = 70;

const NUMBER_FORMAT = new Intl.NumberFormat('en-US');

type HomeHeroProps = {
  componentTotal: number;
  starCount: number | null;
  children: ReactNode;
};

function markedClients() {
  return CLIENTS.filter((client) => MARKED_CLIENT_IDS.has(client.id));
}

function settleDelayOf(step: number): CSSProperties {
  const delay = step * SETTLE_STEP_MS;
  return { animationDelay: `${delay}ms` };
}

type SettleProps = {
  step: number;
  /** A large surface fades and rises without the blur. */
  isLarge?: boolean;
  className?: string;
  children: ReactNode;
};

function settleClassOf(isLarge: boolean) {
  if (isLarge) {
    return 'motion-safe:animate-settle-plain';
  }
  return 'motion-safe:animate-settle';
}

/** One line of the hero: it sharpens and rises into place on load, a beat after the line above it. */
function Settle({ step, isLarge = false, className, children }: SettleProps) {
  return (
    <div
      style={settleDelayOf(step)}
      className={cn(settleClassOf(isLarge), className)}
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
    <div
      aria-hidden='true'
      className='pointer-events-none absolute inset-x-0 top-0 -z-10 h-[64rem] mask-b-from-60%'
    >
      <div className='absolute inset-0' style={GLOW_STYLE} />
      <TileField className='top-24' />
    </div>
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
  componentTotal,
  starCount,
  children,
}: HomeHeroProps) {
  const componentCount = countLabel(componentTotal, 'component', 'components');

  return (
    <section
      aria-labelledby='home-title'
      className='flex flex-col items-center px-4 pt-12 text-center sm:pt-20'
    >
      <div className='flex flex-col items-center gap-6'>
        <Settle step={0}>
          <p className='bg-card/80 text-primary-ink hairline-ring ring-border rounded-full px-3 py-1 text-xs font-medium shadow-[0_1px_2px_rgb(0_0_0/0.04)] backdrop-blur-sm'>
            {`${componentCount}, free and open source`}
          </p>
        </Settle>
        <Settle step={1}>
          <h1 id='home-title' className={cn(DISPLAY_TITLE, 'max-w-4xl')}>
            <span className='text-tint'>React components</span> that animate
            every change of state
          </h1>
        </Settle>
        <Settle step={2}>
          <BuiltWith />
        </Settle>
        <Settle step={3}>
          <p className='text-muted-foreground max-w-xl text-base text-pretty sm:text-lg'>
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
      <Settle step={5} className='mt-14'>
        <WorksWith />
      </Settle>
      <Settle
        step={7}
        isLarge
        className='mt-16 w-full max-w-6xl sm:mt-20 md:px-2'
      >
        {children}
      </Settle>
    </section>
  );
}
