import { InfiniteSlider } from '@/components/core/infinite-slider';
import {
  BRANDS,
  BrandLogo,
  type BrandSlug,
} from '@/registry/ndeko/lib/brand-logos';
import { ArrowRightIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';

import { ROWS, SECTION } from './data';
import { FernhollowMark } from './fernhollow-mark';

const TILE_GAP = 16;

const ALL_BRANDS = ROWS.flatMap((row) => row.brands);

const TOOL_NAMES = ALL_BRANDS.map((brand) => BRANDS[brand].title);

const TOOL_LIST = `Works with ${TOOL_NAMES.join(', ')}`;

type GemStyle = React.CSSProperties & { '--gem': string };

const HUB_STYLE: GemStyle = { '--gem': 'var(--primary)' };

function LogoTile({ brand }: { brand: BrandSlug }) {
  return (
    <span className='keycap-3d flex size-14 shrink-0 items-center justify-center rounded-lg sm:size-16'>
      <BrandLogo brand={brand} className='size-7 sm:size-8' />
    </span>
  );
}

function HubTile() {
  return (
    <div aria-hidden='true' className='absolute inset-0 m-auto size-fit'>
      <div className='surface-raised rounded-2xl p-1.5'>
        <span
          style={HUB_STYLE}
          className='gem-plate flex size-16 items-center justify-center rounded-[calc(var(--radius-2xl)-0.375rem)] sm:size-18'
        >
          <FernhollowMark className='size-8 sm:size-9' />
        </span>
      </div>
    </div>
  );
}

export default function Integrations02() {
  return (
    <section className='px-4 py-16 sm:px-6 sm:py-24 lg:px-8'>
      <div className='mx-auto flex max-w-5xl flex-col items-center'>
        <div className='relative w-full max-w-3xl'>
          <div
            aria-hidden='true'
            className='flex flex-col gap-4 mask-x-from-80%'
          >
            {ROWS.map((row) => (
              <InfiniteSlider
                key={row.id}
                gap={TILE_GAP}
                speed={row.speed}
                reverse={row.reverse}
              >
                {row.brands.map((brand) => (
                  <LogoTile key={brand} brand={brand} />
                ))}
              </InfiniteSlider>
            ))}
          </div>
          <HubTile />
        </div>
        <div className='mt-10 flex max-w-xl flex-col items-center gap-3 text-center sm:mt-14'>
          <h2 className='text-2xl font-semibold text-balance sm:text-3xl'>
            {SECTION.title}
          </h2>
          <p className='text-muted-foreground text-base text-pretty'>
            {SECTION.description}
          </p>
          <p className='sr-only'>{TOOL_LIST}</p>
          <Button
            size='lg'
            className='mt-3'
            nativeButton={false}
            render={<a href='#' />}
          >
            {SECTION.action}
            <ArrowRightIcon />
          </Button>
        </div>
      </div>
    </section>
  );
}
