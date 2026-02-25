import { GlowEffect } from '@/components/core/glow-effect';
import { NdekoUILLogo } from '@/components/website/icons/ndekoui-logo';

export function GlowEffectCardBackground() {
  return (
    <div className='relative h-44 w-64'>
      <GlowEffect
        colors={['var(--info)', 'var(--success)', 'var(--warning)']}
        mode='static'
        blur='medium'
      />
      <div className='bg-card text-foreground hairline-ring ring-border relative flex h-44 w-64 flex-col rounded-xl p-4'>
        <span className='text-sm font-medium'>Ndeko UI</span>
        <span className='text-muted-foreground text-xs'>Motion components</span>
        <NdekoUILLogo className='absolute right-4 bottom-4 size-8' />
      </div>
    </div>
  );
}
