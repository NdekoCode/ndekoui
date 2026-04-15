import { cn } from '@/registry/ndeko/lib/utils';

import { LOGO_CLOUD, MARKS } from './data';
import { MarkShape } from './mark-shape';

const MARQUEE_LOOP = [...MARKS, ...MARKS];

function isRepeatedMark(index: number) {
  return index >= MARKS.length;
}

function hiddenFromReadersOf(isRepeated: boolean) {
  if (isRepeated) {
    return true;
  }
  return undefined;
}

export function LogoCloud() {
  return (
    <section className='px-4 py-12 sm:px-6 sm:py-16 lg:px-8'>
      <div className='mx-auto flex max-w-6xl flex-col gap-8'>
        <h2 className='text-muted-foreground text-center text-sm font-medium text-balance'>
          {LOGO_CLOUD.title}
        </h2>
        <div className='group relative overflow-hidden mask-x-from-85% motion-reduce:mask-none'>
          <ul className='motion-safe:animate-marquee flex w-max [--marquee-duration:44s] group-hover:[animation-play-state:paused] motion-reduce:w-full motion-reduce:flex-wrap motion-reduce:justify-center motion-reduce:gap-y-6'>
            {MARQUEE_LOOP.map((mark, index) => {
              const isRepeated = isRepeatedMark(index);

              return (
                <li
                  key={`${mark.name}-${index}`}
                  aria-hidden={hiddenFromReadersOf(isRepeated)}
                  className={cn(
                    'text-foreground/55 flex shrink-0 items-center gap-2.5 px-6 sm:px-9',
                    isRepeated && 'motion-reduce:hidden'
                  )}
                >
                  <MarkShape shape={mark.shape} />
                  <span className='text-base font-semibold whitespace-nowrap'>
                    {mark.name}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
        <p className='text-muted-foreground text-center text-xs text-balance'>
          {LOGO_CLOUD.note}
        </p>
      </div>
    </section>
  );
}
