import Link from 'next/link';
import type { CSSProperties } from 'react';

import { REPOSITORY_URL } from '@/app/_site/repository';
import { MCP_PAGE_PATH } from '@/app/mcp/_shared/mcp-config';
import {
  ArrowRightIcon,
  ArrowUpRightIcon,
  GithubIcon,
  StarIcon,
} from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';

import { Eyebrow } from './section-heading';
import { TileField } from './tile-field';

const BAND_STYLE: CSSProperties = {
  backgroundImage: [
    'radial-gradient(60% 80% at 50% 100%, color-mix(in oklab, var(--primary) 18%, transparent), transparent 75%)',
    'radial-gradient(40% 60% at 80% 0%, color-mix(in oklab, hsl(292 80% 72%) 8%, transparent), transparent 70%)',
  ].join(', '),
};

const NUMBER_FORMAT = new Intl.NumberFormat('en-US');

function starLabelOf(starCount: number | null) {
  const hasCount = starCount !== null;
  if (!hasCount) {
    return 'Star on GitHub';
  }
  const count = NUMBER_FORMAT.format(starCount);
  return `Star on GitHub · ${count}`;
}

/** The last call to action, right above the footer. */
export function ClosingBand({ starCount }: { starCount: number | null }) {
  const starLabel = starLabelOf(starCount);

  return (
    <section
      aria-labelledby='closing-title'
      className='relative isolate overflow-hidden px-4 py-24 sm:py-32'
      style={BAND_STYLE}
    >
      <TileField className='top-6 opacity-80' />
      <div className='relative mx-auto flex max-w-2xl flex-col items-center gap-6 text-center'>
        <Eyebrow icon={StarIcon}>Free and MIT licensed</Eyebrow>
        <h2
          id='closing-title'
          className='text-3xl font-semibold tracking-tight text-balance sm:text-5xl sm:leading-[1.1]'
        >
          <span className='text-tint'>Start your next screen</span> from pieces
          that already move
        </h2>
        <p className='text-muted-foreground max-w-lg text-base text-pretty'>
          Star the repository to follow new components, blocks and templates as
          they land, or connect your editor and ask it for the next one.
        </p>
        <div className='flex flex-wrap items-center justify-center gap-3'>
          <Button
            size='lg'
            nativeButton={false}
            className='rounded-full px-5'
            role='link'
            render={<a href={REPOSITORY_URL} />}
          >
            <GithubIcon />
            {starLabel}
          </Button>
          <Button
            size='lg'
            variant='outline'
            nativeButton={false}
            className='rounded-full px-5'
            render={<Link href='/components' />}
          >
            Browse components
            <ArrowRightIcon />
          </Button>
        </div>
        <Link
          href={MCP_PAGE_PATH}
          className='text-muted-foreground hover:text-foreground focus-visible:ring-ring/25 inline-flex items-center gap-1 rounded-sm text-sm transition-colors outline-none focus-visible:ring-[3px]'
        >
          Connect your editor through MCP
          <ArrowUpRightIcon className='size-3.5' />
        </Link>
      </div>
    </section>
  );
}
