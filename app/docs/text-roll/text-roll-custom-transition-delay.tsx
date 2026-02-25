'use client';
import { TextRoll } from '@/components/core/text-roll';

export function TextRollCustomTransitionDelay() {
  return (
    <TextRoll
      className='text-foreground overflow-clip text-4xl'
      variants={{
        enter: {
          initial: { y: 0 },
          animate: { y: 40 },
        },
        exit: {
          initial: { y: -40 },
          animate: { y: 0 },
        },
      }}
      duration={0.3}
      getEnterDelay={(i) => i * 0.05}
      getExitDelay={(i) => i * 0.05 + 0.05}
      transition={{
        ease: [0.175, 0.885, 0.32, 1.1],
      }}
    >
      ndekoui
    </TextRoll>
  );
}
