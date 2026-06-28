import { ScrollText } from '@/components/core/scroll-text';

export function ScrollTextHighlight() {
  return (
    <div className='flex w-full justify-center px-6 py-16'>
      <p className='text-muted-foreground max-w-lg text-xl leading-relaxed'>
        Most handoffs stall for the same reason.{' '}
        <ScrollText as='span' mode='highlight' className='text-foreground'>
          The next person never learns that the work is ready for them.
        </ScrollText>{' '}
        A status that changes on its own closes that gap.
      </p>
    </div>
  );
}
