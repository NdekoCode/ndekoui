'use client';
import { TextScramble } from '@/components/core/text-scramble';
import { useState } from 'react';

export function TextScrambleCustomTrigger() {
  const [isTrigger, setIsTrigger] = useState(false);

  return (
    <a
      href='#'
      className='text-muted-foreground hover:text-foreground transition-colors'
    >
      <TextScramble
        className='text-sm'
        as='span'
        speed={0.01}
        trigger={isTrigger}
        onHoverStart={() => setIsTrigger(true)}
        onScrambleComplete={() => setIsTrigger(false)}
      >
        The Harbor Lane Trio: Morning tide
      </TextScramble>
    </a>
  );
}
