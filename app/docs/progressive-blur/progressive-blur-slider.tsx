import { InfiniteSlider } from '@/components/core/infinite-slider';
import { ProgressiveBlur } from '@/components/core/progressive-blur';

const FIGURES = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export function ProgressiveBlurSlider() {
  return (
    <div className='relative h-[350px] w-full overflow-hidden'>
      <InfiniteSlider className='flex h-full w-full items-center'>
        {FIGURES.map((figure) => (
          <div
            key={figure}
            className='text-foreground w-32 text-center text-4xl font-medium tabular-nums'
          >
            {figure}
          </div>
        ))}
      </InfiniteSlider>
      <ProgressiveBlur
        className='pointer-events-none absolute top-0 left-0 h-full w-[200px]'
        direction='left'
        blurIntensity={1}
      />
      <ProgressiveBlur
        className='pointer-events-none absolute top-0 right-0 h-full w-[200px]'
        direction='right'
        blurIntensity={1}
      />
    </div>
  );
}
