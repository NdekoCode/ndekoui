import { Spotlight } from '@/components/core/spotlight';
import { NdekoUILLogo } from '@/components/website/icons/ndekoui-logo';

export function SpotlightBasic() {
  return (
    <div className='hairline-ring ring-border bg-card relative aspect-video h-[200px] rounded-xl'>
      <Spotlight
        className='bg-foreground/40 blur-2xl'
        size={64}
        springOptions={{
          bounce: 0.3,
          duration: 0.1,
        }}
      />
      <div className='bg-card absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-lg p-2'>
        <NdekoUILLogo />
      </div>
    </div>
  );
}
