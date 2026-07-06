import { ArrowRightIcon, UserRoundPlusIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';

import { OPENING } from './data';

/** A seat nobody holds yet: the dashed slot is the one place in the grid that invites an addition. */
export function OpeningCard() {
  return (
    <article className='hairline-border border-foreground/20 flex h-full flex-col items-start gap-4 rounded-xl border-dashed p-5'>
      <span className='keycap-3d text-muted-foreground flex size-12 items-center justify-center rounded-full'>
        <UserRoundPlusIcon />
      </span>
      <div className='flex flex-col gap-1'>
        <h3 className='text-sm font-medium'>{OPENING.title}</h3>
        <p className='text-muted-foreground text-[13px] leading-5 text-pretty'>
          {OPENING.text}
        </p>
      </div>
      <Button
        variant='outline'
        size='sm'
        nativeButton={false}
        render={<a href={OPENING.href} />}
        className='mt-auto'
      >
        {OPENING.linkLabel}
        <ArrowRightIcon />
      </Button>
    </article>
  );
}
