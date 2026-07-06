import Link from 'next/link';

import { REPOSITORY_URL } from '@/app/_site/repository';
import { MCP_PAGE_PATH } from '@/app/mcp/_shared/mcp-config';
import {
  ArrowRightIcon,
  ArrowUpRightIcon,
  GithubIcon,
  StarIcon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';

import { Reveal } from './reveal';
import {
  Eyebrow,
  SECTION_LEAD,
  SECTION_TITLE,
  STAGGER_MS,
} from './section-heading';
import { TileField } from './tile-field';

/* The same grain wash as the hero, poured from the bottom centre of the band. */
const BAND_WASH =
  'grain-wash pointer-events-none absolute inset-0 -z-10 [--wash-a:50%_100%] [--wash-b:50%_100%] [--wash-fade:to_top] [--wash-strength:0.5]';

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
      className='relative isolate overflow-hidden px-4 py-20 sm:py-28'
    >
      <span aria-hidden='true' className={BAND_WASH} />
      <TileField className='top-6 opacity-80' />
      <div className='relative mx-auto flex max-w-2xl flex-col items-center gap-6 text-center'>
        <Reveal>
          <Eyebrow icon={StarIcon}>Free and MIT licensed</Eyebrow>
        </Reveal>
        <Reveal delay={STAGGER_MS}>
          <h2 id='closing-title' className={SECTION_TITLE}>
            <span className='text-tint'>Start your next screen</span> from
            pieces that already move
          </h2>
        </Reveal>
        <Reveal delay={STAGGER_MS * 2}>
          <p className={cn(SECTION_LEAD, 'max-w-lg')}>
            Star the repository to follow new components, blocks and templates
            as they land, or connect your editor and ask it for the next one.
          </p>
        </Reveal>
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
