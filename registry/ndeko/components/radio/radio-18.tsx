import { useId } from 'react';

import { RadioGroup, RadioGroupItem } from '@/registry/ndeko/ui/radio-group';

const SCORES = ['0', '1', '2', '3', '4', '5'];

const SCORE_SEGMENT = [
  'relative flex h-8 flex-1 cursor-pointer items-center justify-center bg-card text-[13px] font-medium text-foreground tabular-nums shadow-[0_1px_2px_rgb(0_0_0/0.05)] hairline-ring ring-foreground/12 transition-[box-shadow,color] duration-150',
  'first:rounded-s-full last:rounded-e-full',
  'has-data-checked:z-10 has-data-checked:text-primary-ink has-data-checked:ring-primary/45',
  'has-focus-visible:z-10 has-focus-visible:ring-[3px] has-focus-visible:ring-ring/25',
].join(' ');

export default function Radio18() {
  const captionId = useId();

  return (
    <div className='flex w-full flex-col gap-3'>
      <span
        id={captionId}
        className='text-foreground text-[13px] leading-none font-medium'
      >
        How likely are you to recommend us?
      </span>
      <RadioGroup
        aria-labelledby={captionId}
        className='flex gap-0 -space-x-px'
      >
        {SCORES.map((score) => (
          <label key={score} className={SCORE_SEGMENT}>
            <RadioGroupItem value={score} className='sr-only' />
            {score}
          </label>
        ))}
      </RadioGroup>
      <div className='text-muted-foreground flex justify-between text-xs'>
        <span>Not likely</span>
        <span>Very likely</span>
      </div>
    </div>
  );
}
