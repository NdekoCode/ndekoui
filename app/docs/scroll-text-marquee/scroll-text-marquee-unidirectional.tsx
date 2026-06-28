import { ScrollTextMarquee } from '@/components/core/scroll-text-marquee';

function Separator() {
  return (
    <span aria-hidden='true' className='text-muted-foreground/40 pl-[0.4em]'>
      /
    </span>
  );
}

export function ScrollTextMarqueeUnidirectional() {
  return (
    <div className='flex w-full flex-col gap-1 py-12'>
      <ScrollTextMarquee className='text-foreground'>
        Plan the week in one view
        <Separator />
      </ScrollTextMarquee>
      <ScrollTextMarquee direction='right' className='text-muted-foreground'>
        Ship the small version first
        <Separator />
      </ScrollTextMarquee>
    </div>
  );
}
