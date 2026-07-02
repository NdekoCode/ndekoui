import { InView } from '@/components/core/in-view';

const EASE_OUT_STRONG = [0.23, 1, 0.32, 1] as const;

export function InViewBasic() {
  return (
    <div className='h-[350px] w-full overflow-auto'>
      <div className='text-muted-foreground py-12 text-center text-[13px]'>
        Scroll down
      </div>
      <div className='flex h-[500px] items-end justify-center px-4 pb-24'>
        <InView
          variants={{
            hidden: { opacity: 0, y: 100, filter: 'blur(4px)' },
            visible: { opacity: 1, y: 0, filter: 'blur(0px)' },
          }}
          viewOptions={{ margin: '0px 0px -200px 0px' }}
          transition={{ duration: 0.3, ease: EASE_OUT_STRONG }}
        >
          <div className='max-w-96'>
            <p className='text-muted-foreground text-sm'>
              <strong className='text-foreground font-medium'>
                Motion components for product teams.
              </strong>{' '}
              ndekoui ships the small movements that tell people the interface
              heard them: a press that gives, a label that becomes its next
              state, a panel that grows to fit. Copy a component and keep the
              code.
            </p>
          </div>
        </InView>
      </div>
    </div>
  );
}
