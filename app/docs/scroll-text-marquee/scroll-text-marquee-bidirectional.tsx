import { ScrollTextMarquee } from '@/components/core/scroll-text-marquee';

export function ScrollTextMarqueeBidirectional() {
  return (
    <div className='flex w-full flex-col py-12'>
      <ScrollTextMarquee bidirectional speed={40} className='text-foreground'>
        Boards that follow the way your team works
        <span
          aria-hidden='true'
          className='text-muted-foreground/40 pl-[0.4em]'
        >
          /
        </span>
      </ScrollTextMarquee>
    </div>
  );
}
