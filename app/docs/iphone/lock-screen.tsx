import { cn } from '@/lib/utils';

export type LockScreenTone = 'light' | 'dark';

const TONE_CLASS: Record<LockScreenTone, string> = {
  light: 'text-white',
  dark: 'text-black/75',
};

/* Sized in container units so the clock scales with the phone, which is a size container. */
export function IphoneLockScreen({ tone }: { tone: LockScreenTone }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center pt-[3cqw] transition-colors duration-200 select-none',
        TONE_CLASS[tone]
      )}
    >
      <span className='text-[4.6cqw] font-semibold'>Thursday 5 November</span>
      <span className='text-[22cqw] leading-none font-semibold tabular-nums'>
        9:41
      </span>
    </div>
  );
}
