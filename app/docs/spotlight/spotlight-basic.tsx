import { Spotlight } from '@/components/core/spotlight';
import { NdekoUILLogo } from '@/components/website/icons/ndekoui-logo';

export function SpotlightBasic() {
  return (
    <div className='relative aspect-video h-[200px] rounded-sm border border-zinc-100 bg-white dark:border-zinc-800 dark:bg-black'>
      <Spotlight
        className='bg-zinc-700 blur-2xl'
        size={64}
        springOptions={{
          bounce: 0.3,
          duration: 0.1,
        }}
      />
      <div className='absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-sm bg-white p-2 dark:bg-black'>
        <NdekoUILLogo />
      </div>
    </div>
  );
}
