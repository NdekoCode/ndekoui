'use client';
import { useState } from 'react';
import { motion } from 'motion/react';
import { GlowEffect } from '@/components/core/glow-effect';
import { TextMorph } from '@/components/core/text-morph';
import { Button } from '@/registry/ndeko/ui/button';

const EASE_OUT_STRONG = [0.23, 1, 0.32, 1] as const;

const TOKEN_COLORS = ['var(--primary)', 'var(--success)', 'var(--warning)'];

function opacityOf(isVisible: boolean) {
  if (isVisible) {
    return 1;
  }
  return 0;
}

function labelOf(isVisible: boolean) {
  if (isVisible) {
    return 'Publishing...';
  }
  return 'Publish';
}

export function GlowEffectCardMode() {
  const [isVisible, setIsVisible] = useState(false);

  const handleLoad = () => {
    if (isVisible) {
      setIsVisible(false);
      return;
    }

    setIsVisible(true);
  };

  return (
    <div className='relative h-[200px] w-[300px]'>
      <motion.div
        className='pointer-events-none absolute inset-0'
        animate={{
          opacity: opacityOf(isVisible),
        }}
        transition={{
          duration: 0.2,
          ease: EASE_OUT_STRONG,
        }}
      >
        <GlowEffect
          colors={TOKEN_COLORS}
          mode='colorShift'
          blur='medium'
          duration={4}
        />
      </motion.div>
      <div className='bg-card hairline-ring ring-border relative flex h-full flex-col justify-between rounded-xl px-4 py-3'>
        <div className='flex flex-col'>
          <span className='text-foreground text-sm font-medium'>
            Release notes 2.4
          </span>
          <span className='text-muted-foreground text-xs'>
            Draft, edited 4 minutes ago
          </span>
        </div>
        <div className='flex justify-end'>
          <Button variant='outline' size='sm' onClick={handleLoad}>
            <TextMorph as='span'>{labelOf(isVisible)}</TextMorph>
          </Button>
        </div>
      </div>
    </div>
  );
}
