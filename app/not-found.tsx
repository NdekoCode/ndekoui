import Link from 'next/link';

import { SiteShell } from '@/app/_site/site-shell';
import { Button } from '@/registry/ndeko/ui/button';

export default function NotFound() {
  return (
    <SiteShell>
      <section className='mx-auto flex max-w-md flex-col items-center gap-4 py-24 text-center'>
        <span className='keycap-3d text-muted-foreground flex h-8 items-center rounded-md px-2.5 font-mono text-xs font-medium'>
          404
        </span>
        <h1 className='text-2xl font-semibold text-balance'>
          This page does not exist
        </h1>
        <p className='text-muted-foreground text-[13px] text-pretty'>
          The link may be old, or the item moved to another category. The
          catalogue lists everything that is published.
        </p>
        <div className='flex flex-wrap justify-center gap-2'>
          <Button nativeButton={false} render={<Link href='/components' />}>
            Browse components
          </Button>
          <Button
            variant='outline'
            nativeButton={false}
            render={<Link href='/' />}
          >
            Go to the home page
          </Button>
        </div>
      </section>
    </SiteShell>
  );
}
