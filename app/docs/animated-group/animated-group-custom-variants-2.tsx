'use client';
import { AnimatedGroup } from '@/components/core/animated-group';
import { cn } from '@/registry/ndeko/lib/utils';

const WORDMARKS = [
  { name: 'Halden', mark: 'size-4 rounded-full bg-current' },
  { name: 'Quillstone', mark: 'size-4 rounded-[3px] bg-current' },
  { name: 'Tidewell', mark: 'h-4 w-[3px] rounded-full bg-current' },
  { name: 'Ashgrove', mark: 'size-4 rounded-full hairline-ring ring-current' },
];

export function AnimatedGroupCustomVariants2() {
  return (
    <AnimatedGroup
      className='grid h-full grid-cols-2 gap-8 p-12 md:grid-cols-3 lg:grid-cols-4'
      variants={{
        container: {
          visible: {
            transition: {
              staggerChildren: 0.05,
            },
          },
        },
        item: {
          hidden: {
            opacity: 0,
            filter: 'blur(12px)',
            y: -60,
            rotateX: 90,
          },
          visible: {
            opacity: 1,
            filter: 'blur(0px)',
            y: 0,
            rotateX: 0,
            transition: {
              type: 'spring',
              bounce: 0.3,
              duration: 1,
            },
          },
        },
      }}
    >
      {WORDMARKS.map((wordmark) => (
        <div
          key={wordmark.name}
          className='text-muted-foreground flex items-center justify-center gap-2'
        >
          <span aria-hidden='true' className='flex items-center gap-[3px]'>
            <span className={cn(wordmark.mark)} />
            {wordmark.name === 'Tidewell' && (
              <span className={cn(wordmark.mark)} />
            )}
          </span>
          <span className='text-lg font-semibold'>{wordmark.name}</span>
        </div>
      ))}
    </AnimatedGroup>
  );
}
