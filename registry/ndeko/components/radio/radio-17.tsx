import { useId } from 'react';

import { RadioGroup, RadioGroupItem } from '@/registry/ndeko/ui/radio-group';

type Mood = 'angry' | 'sad' | 'neutral' | 'happy' | 'laughing';

const MOODS: { value: Mood; label: string }[] = [
  { value: 'angry', label: 'Angry' },
  { value: 'sad', label: 'Sad' },
  { value: 'neutral', label: 'Neutral' },
  { value: 'happy', label: 'Happy' },
  { value: 'laughing', label: 'Laughing' },
];

const MOOD_OPTION = [
  'relative flex size-9 cursor-pointer items-center justify-center rounded-full bg-card text-muted-foreground shadow-[0_1px_2px_rgb(0_0_0/0.04)] hairline-ring ring-border transition-[box-shadow,color] duration-150',
  'has-data-checked:text-primary-ink has-data-checked:shadow-[0_1px_2px_rgb(0_0_0/0.04),0_6px_16px_-8px_color-mix(in_oklab,var(--primary)_35%,transparent)] has-data-checked:ring-primary/45',
  'has-focus-visible:ring-[3px] has-focus-visible:ring-ring/25',
].join(' ');

const ROUND_EYES = (
  <>
    <circle cx='9' cy='10' r='1' fill='currentColor' stroke='none' />
    <circle cx='15' cy='10' r='1' fill='currentColor' stroke='none' />
  </>
);

const FACE_FEATURES: Record<Mood, React.ReactNode> = {
  angry: (
    <>
      <path d='M7.75 7.75 10.25 9M16.25 7.75 13.75 9' />
      {ROUND_EYES}
      <path d='M8.75 16.5c1.75-1.6 4.75-1.6 6.5 0' />
    </>
  ),
  sad: (
    <>
      {ROUND_EYES}
      <path d='M8.75 16.25c1.75-1.75 4.75-1.75 6.5 0' />
    </>
  ),
  neutral: (
    <>
      {ROUND_EYES}
      <path d='M9 15.25h6' />
    </>
  ),
  happy: (
    <>
      {ROUND_EYES}
      <path d='M8.5 14.25c1.75 2 5.25 2 7 0' />
    </>
  ),
  laughing: (
    <>
      <path d='M7.75 10.25c.6-.8 1.9-.8 2.5 0M13.75 10.25c.6-.8 1.9-.8 2.5 0' />
      <path d='M8 13.5h8a4 4 0 0 1-8 0Z' />
    </>
  ),
};

function MoodFace({ mood }: { mood: Mood }) {
  return (
    <svg
      width={20}
      height={20}
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth={1.75}
      strokeLinecap='round'
      strokeLinejoin='round'
      aria-hidden='true'
    >
      <circle cx='12' cy='12' r='9.25' />
      {FACE_FEATURES[mood]}
    </svg>
  );
}

export default function Radio17() {
  const captionId = useId();

  return (
    <div className='flex flex-col gap-3'>
      <span
        id={captionId}
        className='text-foreground text-[13px] leading-none font-medium'
      >
        How did it go?
      </span>
      <RadioGroup
        defaultValue='neutral'
        aria-labelledby={captionId}
        className='flex gap-1.5'
      >
        {MOODS.map((mood) => (
          <label key={mood.value} className={MOOD_OPTION}>
            <RadioGroupItem value={mood.value} className='sr-only' />
            <MoodFace mood={mood.value} />
            <span className='sr-only'>{mood.label}</span>
          </label>
        ))}
      </RadioGroup>
    </div>
  );
}
