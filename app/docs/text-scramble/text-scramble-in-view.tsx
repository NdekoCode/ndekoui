import { TextScramble } from '@/components/core/text-scramble';

export function TextScrambleInView() {
  return (
    <div className='bg-card hairline-ring ring-border flex w-full max-w-xs flex-col gap-1 rounded-xl px-4 py-3 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
      <TextScramble
        className='text-foreground font-mono text-sm'
        startOnView
        stableWidth
        characterSet='0123456789ABCDEF'
      >
        Release 4.2 is live
      </TextScramble>
      <TextScramble
        className='text-muted-foreground font-mono text-xs'
        startOnView
        stableWidth
        delay={0.4}
        characterSet='0123456789ABCDEF'
      >
        128 checks passed in 42 s
      </TextScramble>
    </div>
  );
}
