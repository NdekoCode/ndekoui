'use client';

import { useInView } from 'motion/react';
import { useRef } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { SettleItem } from '@/registry/ndeko/ui/settle';

import { FIGURES, FIGURES_SECTION, type Figure } from './data';
import { Reveal } from './reveal';

const SEEN_ONCE = { once: true } as const;

function shownValueOf(figure: Figure, isSeen: boolean) {
  if (isSeen) {
    return figure.value;
  }
  return 0;
}

function FigureCell({ figure }: { figure: Figure }) {
  const ref = useRef<HTMLDivElement>(null);
  const isSeen = useInView(ref, SEEN_ONCE);
  const shownValue = shownValueOf(figure, isSeen);

  return (
    <div ref={ref} className='flex flex-col gap-1'>
      <p className='text-3xl font-semibold tabular-nums @2xl:text-4xl'>
        <MotionNumber value={shownValue} suffix={figure.suffix} />
      </p>
      <p className='text-muted-foreground text-[13px] text-pretty'>
        {figure.label}
      </p>
    </div>
  );
}

export function Figures() {
  return (
    <section className='px-4 py-8 @sm:px-6 @5xl:px-8'>
      <Reveal
        className='mx-auto max-w-6xl'
        groupClassName='flex flex-col gap-4'
      >
        <SettleItem className='grid grid-cols-3 gap-4 @sm:gap-8'>
          {FIGURES.map((figure) => (
            <FigureCell key={figure.id} figure={figure} />
          ))}
        </SettleItem>
        <SettleItem>
          <p className='text-muted-foreground text-xs'>
            {FIGURES_SECTION.note}
          </p>
        </SettleItem>
      </Reveal>
    </section>
  );
}
