'use client';
import { useState } from 'react';
import { TransitionPanel } from '@/components/core/transition-panel';
import { Button } from '@/registry/ndeko/ui/button';

const EASE_IN_OUT_STRONG = [0.77, 0, 0.175, 1] as const;

const ITEMS = [
  {
    title: 'Aesthetics',
    subtitle: 'Refining visual harmony',
    content:
      'Learn the principles of motion aesthetics that make an interface feel considered. Balance timing, easing and the flow of motion so every change reads as one gesture.',
  },
  {
    title: 'Art',
    subtitle: 'Narrative and expression',
    content:
      'See how motion can tell a short story or set a mood, so digital interactions feel more human and more expressive without getting in the way.',
  },
  {
    title: 'Technique',
    subtitle: 'Mastering motion tools',
    content:
      'Practise physics-based animation, 3D transforms and sequencing until they become part of your everyday design and implementation work.',
  },
];

function tabVariantOf(isActive: boolean) {
  if (isActive) {
    return 'secondary';
  }
  return 'ghost';
}

export function TabsTransitionPanel() {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div>
      <div className='mb-4 flex space-x-2'>
        {ITEMS.map((item, index) => {
          const isActive = activeIndex === index;

          return (
            <Button
              key={index}
              size='sm'
              variant={tabVariantOf(isActive)}
              aria-pressed={isActive}
              onClick={() => setActiveIndex(index)}
            >
              {item.title}
            </Button>
          );
        })}
      </div>
      <div className='overflow-hidden'>
        <TransitionPanel
          activeIndex={activeIndex}
          transition={{ duration: 0.2, ease: EASE_IN_OUT_STRONG }}
          variants={{
            enter: { opacity: 0, y: -50, filter: 'blur(4px)' },
            center: { opacity: 1, y: 0, filter: 'blur(0px)' },
            exit: { opacity: 0, y: 50, filter: 'blur(4px)' },
          }}
        >
          {ITEMS.map((item, index) => (
            <div key={index} className='py-2'>
              <h3 className='text-foreground mb-2 text-sm font-medium'>
                {item.subtitle}
              </h3>
              <p className='text-muted-foreground text-[13px]'>
                {item.content}
              </p>
            </div>
          ))}
        </TransitionPanel>
      </div>
    </div>
  );
}
