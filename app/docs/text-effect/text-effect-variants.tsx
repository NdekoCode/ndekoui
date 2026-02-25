'use client';
import { useState } from 'react';
import type { TargetAndTransition } from 'motion/react';
import { TextEffect } from '@/components/core/text-effect';

const TEXT_COLOR_TOKENS = [
  'var(--primary-ink)',
  'var(--info-foreground)',
  'var(--success-foreground)',
  'var(--warning-foreground)',
  'var(--destructive-ink)',
];

function pickTextColor() {
  const index = Math.floor(Math.random() * TEXT_COLOR_TOKENS.length);
  return TEXT_COLOR_TOKENS[index];
}

function hiddenWordState(): TargetAndTransition {
  return {
    opacity: 0,
    y: Math.random() * 100 - 50,
    rotate: Math.random() * 90 - 45,
    scale: 0.3,
    color: pickTextColor(),
  };
}

export function TextEffectWithCustomVariants() {
  const [visibleColor] = useState(pickTextColor);

  const fancyVariants = {
    container: {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: 0.05,
        },
      },
    },
    item: {
      hidden: hiddenWordState,
      visible: {
        opacity: 1,
        y: 0,
        rotate: 0,
        scale: 1,
        color: visibleColor,
        transition: {
          type: 'spring' as const,
          damping: 12,
          stiffness: 200,
        },
      },
    },
  };

  return (
    <TextEffect per='word' variants={fancyVariants}>
      Animate your ideas with ndekoui
    </TextEffect>
  );
}
