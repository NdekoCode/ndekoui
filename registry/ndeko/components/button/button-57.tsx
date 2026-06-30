import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';

const LABEL = 'Start a project';
const LETTERS = Array.from(LABEL);
const LETTER_STAGGER_MS = 12;

const ROLL =
  'transition-[translate] duration-300 ease-(--ease-out-strong) whitespace-pre';

function letterDelayOf(index: number) {
  const delay = index * LETTER_STAGGER_MS;
  return { transitionDelay: `${delay}ms` };
}

export default function Button57() {
  return (
    <Button variant='outline' aria-label={LABEL}>
      <span aria-hidden='true' className='relative flex overflow-hidden'>
        {LETTERS.map((letter, index) => (
          <span key={index} className='relative flex flex-col'>
            <span
              className={cn(ROLL, 'group-hover/button:-translate-y-full')}
              style={letterDelayOf(index)}
            >
              {letter}
            </span>
            <span
              className={cn(
                ROLL,
                'absolute inset-x-0 top-full group-hover/button:-translate-y-full'
              )}
              style={letterDelayOf(index)}
            >
              {letter}
            </span>
          </span>
        ))}
      </span>
    </Button>
  );
}
