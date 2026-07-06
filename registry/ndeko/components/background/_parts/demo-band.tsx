import { useId, type ReactNode, type Ref } from 'react';

import { cn } from '@/registry/ndeko/lib/utils';

type BandAlign = 'center' | 'end';

const ALIGNMENTS: Record<BandAlign, string> = {
  center: 'justify-center',
  end: 'justify-end pb-10',
};

type DemoBandProps = {
  ref?: Ref<HTMLElement>;
  title: string;
  /** The background under test. It fills the band, behind the headline and the actions. */
  background: ReactNode;
  /** `end` sets the headline at the foot of the band and leaves its middle to the background. */
  align?: BandAlign;
  children: ReactNode;
};

/**
 * The band every background is shown in: the page colour, a headline in the foreground colour and
 * the actions laid straight over the background, to prove that text stays readable above it.
 */
export function DemoBand({
  ref,
  title,
  background,
  align = 'center',
  children,
}: DemoBandProps) {
  const titleId = useId();

  return (
    <section
      ref={ref}
      aria-labelledby={titleId}
      className={cn(
        'bg-background @container relative isolate flex h-90 w-full flex-col items-center overflow-hidden rounded-xl',
        ALIGNMENTS[align]
      )}
    >
      {background}
      <div className='relative flex max-w-lg flex-col items-center gap-5 px-6 text-center'>
        <h3
          id={titleId}
          className='text-2xl font-semibold text-balance @lg:text-3xl'
        >
          {title}
        </h3>
        <div className='flex flex-wrap items-center justify-center gap-2'>
          {children}
        </div>
      </div>
    </section>
  );
}
