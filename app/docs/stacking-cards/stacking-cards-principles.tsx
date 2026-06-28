'use client';
import { useRef } from 'react';
import { StackingCard, StackingCards } from '@/components/core/stacking-cards';
import {
  FileTextIcon,
  type Icon,
  PencilIcon,
  SearchIcon,
  UsersIcon,
} from '@/registry/ndeko/lib/icons';

type Principle = {
  title: string;
  text: string;
  icon: Icon;
};

const PRINCIPLES: Principle[] = [
  {
    title: 'Read the brief again',
    text: 'Before anyone comments on a screen, someone reads the problem out loud. Half of the feedback answers a question nobody asked.',
    icon: FileTextIcon,
  },
  {
    title: 'Fill it with real data',
    text: 'Long names, empty lists, a price with six digits. A design that only works with the sample data is not finished.',
    icon: SearchIcon,
  },
  {
    title: 'Remove one thing',
    text: 'Every review ends with one element taken out. If nobody misses it a week later, it stays out.',
    icon: PencilIcon,
  },
  {
    title: 'Show five people',
    text: 'Five people who were not in the room try it while we watch, without a word from us.',
    icon: UsersIcon,
  },
];

export function StackingCardsPrinciples() {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={containerRef}
      className='relative h-[400px] w-full overflow-y-auto rounded-xl px-4 sm:px-8'
    >
      <div className='flex h-[120px] flex-col justify-end gap-1 pb-2 text-center'>
        <h2 className='text-foreground text-base font-semibold text-balance'>
          How we review a design
        </h2>
      </div>
      <StackingCards
        containerRef={containerRef}
        frameClassName='h-[400px]'
        peek={12}
      >
        {PRINCIPLES.map((principle, index) => {
          const Glyph = principle.icon;
          const number = index + 1;

          return (
            <StackingCard
              key={principle.title}
              className='bg-card hairline-ring ring-border max-w-md rounded-2xl shadow-[0_1px_2px_rgb(0_0_0/0.04)]'
            >
              <article className='flex h-[220px] flex-col justify-between p-6'>
                <div className='flex items-center justify-between'>
                  <span className='gem-plate grid size-9 place-items-center rounded-lg [--gem:var(--primary)]'>
                    <Glyph className='size-4' />
                  </span>
                  <span className='text-muted-foreground text-xs tabular-nums'>
                    {number} of {PRINCIPLES.length}
                  </span>
                </div>
                <div className='flex flex-col gap-1.5'>
                  <h3 className='text-foreground text-base font-semibold'>
                    {principle.title}
                  </h3>
                  <p className='text-muted-foreground text-[13px]'>
                    {principle.text}
                  </p>
                </div>
              </article>
            </StackingCard>
          );
        })}
      </StackingCards>
      <div className='h-[160px]' />
    </div>
  );
}
