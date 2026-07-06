import { Button } from '@/registry/ndeko/ui/button';

import { TidewellMark } from './brand-mark';
import { BRAND, HEADER } from './data';

export function SiteHeader() {
  return (
    <header className='px-4 pt-4 sm:px-6 lg:px-8'>
      <div className='mx-auto flex h-14 max-w-6xl items-center justify-between gap-4'>
        <a
          href='#'
          className='focus-visible:ring-ring/25 flex items-center gap-2 rounded-md text-sm font-semibold outline-none focus-visible:ring-[3px]'
        >
          <TidewellMark />
          {BRAND.name}
        </a>
        <Button
          variant='outline'
          nativeButton={false}
          render={<a href={HEADER.actionHref} />}
        >
          {HEADER.action}
        </Button>
      </div>
    </header>
  );
}
