import { ScrollText } from '@/components/core/scroll-text';

export function ScrollTextCharacter() {
  return (
    <div className='flex w-full justify-center px-6 py-16'>
      <ScrollText
        as='h2'
        mode='character'
        className='text-foreground max-w-md text-center text-4xl font-semibold text-balance'
      >
        Ship the small version on Friday
      </ScrollText>
    </div>
  );
}
