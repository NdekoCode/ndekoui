import { InView } from '@/components/core/in-view';

const EASE_OUT_STRONG = [0.23, 1, 0.32, 1] as const;

export function InViewBasicMultiple() {
  return (
    <div className='h-[350px] w-full overflow-x-hidden overflow-y-auto'>
      <div className='text-muted-foreground mb-36 py-12 text-center text-[13px]'>
        Scroll down
      </div>
      <div className='flex h-[350px] items-end justify-center px-4 pb-24'>
        <InView
          variants={{
            hidden: {
              opacity: 0,
              y: 30,
              scale: 0.95,
              filter: 'blur(4px)',
            },
            visible: {
              opacity: 1,
              y: 0,
              scale: 1,
              filter: 'blur(0px)',
            },
          }}
          transition={{ duration: 0.3, ease: EASE_OUT_STRONG }}
          viewOptions={{ margin: '0px 0px -350px 0px' }}
        >
          <div className='bg-foreground/[0.04] max-w-96 rounded-xl p-4'>
            <p className='text-muted-foreground text-[13px]'>
              <strong className='text-foreground font-medium'>
                Athletics.
              </strong>{' '}
              Watch running, jumping and throwing events. Athletes compete in
              many different activities.
            </p>
          </div>
        </InView>
      </div>
      <div className='flex h-[350px] items-end justify-center px-4 pb-24'>
        <InView
          variants={{
            hidden: {
              opacity: 0,
              x: 100,
            },
            visible: {
              opacity: 1,
              x: 0,
            },
          }}
          transition={{ duration: 0.3, ease: EASE_OUT_STRONG }}
          viewOptions={{ margin: '0px 0px -350px 0px' }}
        >
          <div className='bg-foreground max-w-96 rounded-xl p-4'>
            <p className='text-background/70 text-[13px]'>
              <strong className='text-background font-medium'>Swimming.</strong>{' '}
              See swimmers race in water. They use different styles to swim fast
              and win medals.
            </p>
          </div>
        </InView>
      </div>
      <div className='flex h-[350px] items-end justify-center overflow-x-hidden px-4 pb-24'>
        <InView
          variants={{
            hidden: {
              opacity: 0,
              scale: 1.5,
            },
            visible: {
              opacity: 1,
              scale: 1,
            },
          }}
          transition={{ duration: 0.3, ease: EASE_OUT_STRONG }}
          viewOptions={{ margin: '0px 0px -350px 0px' }}
        >
          <div className='bg-foreground/[0.04] max-w-96 rounded-xl p-4'>
            <p className='text-muted-foreground text-[13px]'>
              <strong className='text-foreground font-medium'>
                Gymnastics.
              </strong>{' '}
              Gymnasts perform flips and jumps. They show strength and balance
              in their routines.
            </p>
          </div>
        </InView>
      </div>
    </div>
  );
}
