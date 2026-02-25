import { GlowEffect } from '@/components/core/glow-effect';
import { ArrowRightIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';

const TOKEN_COLORS = ['var(--primary)', 'var(--success)', 'var(--warning)'];

export function GlowEffectButton() {
  return (
    <div className='relative'>
      <GlowEffect
        colors={TOKEN_COLORS}
        mode='colorShift'
        blur='soft'
        duration={3}
        scale={0.9}
      />
      <Button>
        Browse the components <ArrowRightIcon />
      </Button>
    </div>
  );
}
