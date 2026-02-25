import { TextScramble } from '@/components/core/text-scramble';

export function TextScrambleCustomCharacterDuration() {
  return (
    <TextScramble
      className='text-foreground font-mono text-sm'
      duration={1.2}
      characterSet='. '
    >
      Syncing your workspace...
    </TextScramble>
  );
}
