import { cn } from '@/lib/utils';

export type LockScreenTone = 'light' | 'dark';

const TONE_CLASS: Record<LockScreenTone, string> = {
  light: 'text-white',
  dark: 'text-black/75',
};

/* Sized in container units so the clock scales with the phone, which is a size container. */
export function AndroidLockScreen({ tone }: { tone: LockScreenTone }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-[3cqw] pt-[8cqw] transition-colors duration-200 select-none',
        TONE_CLASS[tone]
      )}
    >
      <span className='flex flex-col items-center text-[27cqw] leading-[0.92] font-semibold tabular-nums'>
        <span>09</span>
        <span>41</span>
      </span>
      <span className='text-[4cqw] font-medium'>Thu 5 Nov</span>
    </div>
  );
}
