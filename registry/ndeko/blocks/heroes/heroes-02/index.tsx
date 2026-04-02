import { ArrowRightIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';

import { BoardStage } from './board-stage';
import { HERO } from './data';

export default function Heroes02() {
  return (
    <section className='px-4 pt-16 pb-12 sm:px-6 sm:pt-24 sm:pb-16 lg:px-8'>
      <div className='mx-auto flex max-w-3xl flex-col items-center gap-5 text-center'>
        <p className='text-primary-ink text-xs font-medium'>{HERO.eyebrow}</p>
        <h1 className='text-4xl font-semibold text-balance sm:text-5xl'>
          {HERO.title}
        </h1>
        <p className='text-muted-foreground max-w-xl text-base text-pretty'>
          {HERO.description}
        </p>
        <div className='flex flex-wrap justify-center gap-2 pt-1'>
          <Button size='lg' nativeButton={false} render={<a href='#' />}>
            {HERO.primaryAction}
            <ArrowRightIcon />
          </Button>
          <Button
            size='lg'
            variant='outline'
            nativeButton={false}
            render={<a href='#' />}
          >
            {HERO.secondaryAction}
          </Button>
        </div>
      </div>
      <div className='mx-auto mt-12 max-w-5xl sm:mt-16'>
        <BoardStage />
      </div>
    </section>
  );
}
