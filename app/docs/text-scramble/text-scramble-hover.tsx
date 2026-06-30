import { TextScramble } from '@/components/core/text-scramble';
import { Button } from '@/registry/ndeko/ui/button';

const LINKS = ['Docs', 'Components', 'Templates', 'Change log'];

export function TextScrambleHover() {
  return (
    <nav aria-label='Site' className='flex flex-wrap items-center gap-1'>
      {LINKS.map((label) => (
        <Button
          key={label}
          variant='ghost'
          render={<a href='#' />}
          nativeButton={false}
          className='text-muted-foreground'
        >
          <TextScramble
            as='span'
            trigger={false}
            replayOnHover
            stableWidth
            duration={0.4}
            speed={0.03}
          >
            {label}
          </TextScramble>
        </Button>
      ))}
    </nav>
  );
}
