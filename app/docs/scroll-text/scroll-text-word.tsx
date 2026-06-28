import { ScrollText } from '@/components/core/scroll-text';

export function ScrollTextWord() {
  return (
    <div className='flex w-full justify-center px-6 py-16'>
      <ScrollText className='text-foreground max-w-lg text-2xl font-medium text-balance'>
        A board should answer one question before lunch: who is waiting on whom.
        Everything else on the screen is there to help you act on that answer.
      </ScrollText>
    </div>
  );
}
