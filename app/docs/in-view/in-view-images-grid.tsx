'use client';
import { motion } from 'motion/react';
import { InView } from '@/components/core/in-view';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import {
  CompassIcon,
  FeatherIcon,
  ImageIcon,
  MoonIcon,
  SunIcon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';

const TONES = [
  { tile: 'bg-primary/10', gem: '[--gem:var(--primary)]' },
  { tile: 'bg-success/10', gem: '[--gem:var(--success)]' },
  { tile: 'bg-warning/10', gem: '[--gem:var(--warning)]' },
  { tile: 'bg-info/10', gem: '[--gem:var(--info)]' },
  { tile: 'bg-foreground/[0.04]', gem: '[--gem:var(--muted-foreground)]' },
];

const SHOTS = [
  { label: 'Shoreline', icon: SunIcon, ratio: 'aspect-[3/4]' },
  { label: 'Ceramics', icon: ImageIcon, ratio: 'aspect-square' },
  { label: 'Night ferry', icon: MoonIcon, ratio: 'aspect-[4/5]' },
  { label: 'Orchard', icon: FeatherIcon, ratio: 'aspect-[3/2]' },
  { label: 'Old map', icon: CompassIcon, ratio: 'aspect-[3/4]' },
  { label: 'Studio wall', icon: ImageIcon, ratio: 'aspect-[3/2]' },
  { label: 'Market day', icon: SunIcon, ratio: 'aspect-square' },
  { label: 'Window light', icon: MoonIcon, ratio: 'aspect-[4/5]' },
  { label: 'Paper cuts', icon: FeatherIcon, ratio: 'aspect-[3/4]' },
  { label: 'Harbour', icon: CompassIcon, ratio: 'aspect-square' },
];

function itemVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return {
      hidden: { opacity: 0 },
      visible: { opacity: 1 },
    };
  }
  return {
    hidden: { opacity: 0, scale: 0.8, filter: 'blur(10px)' },
    visible: {
      opacity: 1,
      scale: 1,
      filter: 'blur(0px)',
    },
  };
}

export function InViewImagesGrid() {
  const shouldReduceMotion = usePrefersReducedMotion();
  const itemVariants = itemVariantsOf(shouldReduceMotion);

  return (
    <div className='h-full w-full overflow-auto'>
      <div className='text-muted-foreground mb-20 py-12 text-center text-[13px]'>
        Scroll down
      </div>
      <div className='flex h-[1200px] items-end justify-center pb-12'>
        <InView
          viewOptions={{ once: true, margin: '0px 0px -250px 0px' }}
          variants={{
            hidden: {
              opacity: 0,
            },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.09,
              },
            },
          }}
        >
          <div className='columns-2 gap-4 px-8 sm:columns-3'>
            {SHOTS.map((shot, index) => {
              const tone = TONES[index % TONES.length];
              const Glyph = shot.icon;

              return (
                <motion.div
                  variants={itemVariants}
                  key={shot.label}
                  className='mb-4'
                >
                  <div
                    className={cn(
                      'flex w-full flex-col justify-between rounded-lg p-3',
                      shot.ratio,
                      tone.tile
                    )}
                  >
                    <span
                      className={cn(
                        'gem-plate grid size-8 place-items-center rounded-md',
                        tone.gem
                      )}
                    >
                      <Glyph className='size-4' />
                    </span>
                    <span className='text-foreground text-[13px] font-medium'>
                      {shot.label}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </InView>
      </div>
    </div>
  );
}
