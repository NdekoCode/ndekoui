import { GlowEffect } from '@/components/core/glow-effect';
import { NdekoUILLogo } from '@/components/website/icons/ndekoui-logo';

export function GlowEffectCardBackground() {
  return (
    <div className='relative h-44 w-64'>
      <GlowEffect
        colors={['#0894FF', '#C959DD', '#FF2E54', '#FF9004']}
        mode='static'
        blur='medium'
      />
      <div className='relative h-44 w-64 rounded-lg bg-black p-2 text-white dark:bg-white dark:text-black'>
        <NdekoUILLogo className='absolute bottom-4 right-4 h-8 w-8' />
      </div>
    </div>
  );
}
