import { Marquee } from '@/components/core/marquee';
import { cn } from '@/lib/utils';

type Wordmark = {
  name: string;
  mark: string;
};

const WORDMARKS: Wordmark[] = [
  { name: 'Larkspur', mark: 'size-4 rounded-full bg-current' },
  { name: 'Oakbridge', mark: 'size-4 rounded-[4px] bg-current' },
  { name: 'Sundial', mark: 'size-4 rounded-full hairline-ring ring-current' },
  { name: 'Kestrel', mark: 'size-3.5 rotate-45 rounded-[3px] bg-current' },
  { name: 'Copperleaf', mark: 'h-4 w-2.5 rounded-full bg-current' },
  { name: 'Pinecrest', mark: 'h-4 w-1.5 rounded-full bg-current' },
  { name: 'Marrow & Co', mark: 'size-4 rounded-sm hairline-ring ring-current' },
];

export function MarqueeWordmarks() {
  return (
    <Marquee gap={48} className='text-muted-foreground w-full py-10'>
      {WORDMARKS.map((wordmark) => (
        <div key={wordmark.name} className='flex items-center gap-2'>
          <span aria-hidden='true' className={cn(wordmark.mark)} />
          <span className='text-xl font-semibold whitespace-nowrap'>
            {wordmark.name}
          </span>
        </div>
      ))}
    </Marquee>
  );
}
