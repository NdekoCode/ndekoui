import { SVGProps } from 'react';
import { Cursor } from '@/components/core/cursor';
import { FeatherIcon } from '@/registry/ndeko/lib/icons';

const EASE_OUT_STRONG = [0.23, 1, 0.32, 1] as const;

const MouseIcon = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width={26}
      height={31}
      fill='none'
      aria-hidden='true'
      {...props}
    >
      <g clipPath='url(#cursor-2-clip)'>
        <path
          className='fill-primary stroke-primary-foreground'
          fillRule='evenodd'
          strokeLinecap='square'
          strokeWidth={2}
          d='M21.993 14.425 2.549 2.935l4.444 23.108 4.653-10.002z'
          clipRule='evenodd'
        />
      </g>
      <defs>
        <clipPath id='cursor-2-clip'>
          <path d='M0 0h26v31H0z' />
        </clipPath>
      </defs>
    </svg>
  );
};

export function Cursor2() {
  return (
    <div className='py-12'>
      <div className='bg-card hairline-ring ring-border overflow-hidden rounded-xl p-2 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
        <Cursor
          attachToParent
          variants={{
            initial: { scale: 0.3, opacity: 0 },
            animate: { scale: 1, opacity: 1 },
            exit: { scale: 0.3, opacity: 0 },
          }}
          transition={{
            ease: EASE_OUT_STRONG,
            duration: 0.15,
          }}
          className='top-4 left-12'
        >
          <div>
            <MouseIcon className='size-6' />
            <div className='bg-primary text-primary-foreground mt-1 ml-4 rounded-md px-2 py-0.5 text-xs font-medium'>
              Ama Mensah
            </div>
          </div>
        </Cursor>
        <div className='bg-success/10 flex h-40 w-32 flex-col justify-between rounded-lg p-3'>
          <span className='gem-plate grid size-8 place-items-center rounded-md [--gem:var(--success)]'>
            <FeatherIcon className='size-4' />
          </span>
          <span className='text-foreground text-[13px] font-medium'>
            Herb garden
          </span>
        </div>
      </div>
    </div>
  );
}
