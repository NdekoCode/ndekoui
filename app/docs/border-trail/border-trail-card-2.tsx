'use client';
import { useState } from 'react';
import { BorderTrail } from '@/components/core/border-trail';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';

export function BorderTrailCard2() {
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  const handleAnimationComplete = () => {
    setIsLoading(false);
    setTimeout(() => setIsVisible(false), 300);
  };

  const handleLoad = () => {
    setIsLoading(true);
    setIsVisible(true);
  };

  return (
    <div className='bg-card hairline-ring ring-border relative h-[200px] w-[300px] rounded-xl px-4 py-3 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
      {isVisible && (
        <BorderTrail
          className={cn(
            'from-success/20 via-success to-success/20 bg-linear-to-l transition-opacity duration-300',
            isLoading && 'opacity-100',
            !isLoading && 'opacity-0'
          )}
          size={120}
          transition={{
            ease: [0, 0.5, 0.8, 0.5],
            duration: 4,
            repeat: 2,
          }}
          onAnimationComplete={handleAnimationComplete}
        />
      )}
      <div className='flex h-full flex-col justify-between'>
        <div className='flex flex-col'>
          <span className='text-foreground text-sm font-medium'>
            Preview build
          </span>
          <span className='text-muted-foreground text-xs'>
            Branch feat/onboarding-checklist
          </span>
        </div>
        <div className='flex justify-end'>
          <Button variant='outline' size='sm' onClick={handleLoad}>
            Run checks
          </Button>
        </div>
      </div>
    </div>
  );
}
