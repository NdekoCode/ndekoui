import { Cursor } from '@/components/core/cursor';
import { CompassIcon } from '@/registry/ndeko/lib/icons';

export function Cursor3() {
  return (
    <div>
      <div className='text-foreground p-4 text-sm font-medium'>
        <Cursor
          attachToParent
          variants={{
            initial: { height: 0, opacity: 0, scale: 0.3 },
            animate: { height: 'auto', opacity: 1, scale: 1 },
            exit: { height: 0, opacity: 0, scale: 0.3 },
          }}
          transition={{
            type: 'spring',
            duration: 0.3,
            bounce: 0.1,
          }}
          className='overflow-hidden'
          springConfig={{
            bounce: 0.01,
          }}
        >
          <div className='bg-info/10 flex size-40 flex-col justify-between rounded-lg p-3'>
            <span className='gem-plate grid size-8 place-items-center rounded-md [--gem:var(--info)]'>
              <CompassIcon className='size-4' />
            </span>
            <span className='flex flex-col'>
              <span className='text-foreground text-[13px] font-medium'>
                Vell Point
              </span>
              <span className='text-muted-foreground text-xs'>
                Lighthouse trail, 6 km
              </span>
            </span>
          </div>
        </Cursor>
        Lighthouse at Vell Point
      </div>
    </div>
  );
}
