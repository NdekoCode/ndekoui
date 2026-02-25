import { TextShimmerWave } from '@/components/core/text-shimmer-wave';

export function TextShimmerWaveBasic() {
  return (
    <TextShimmerWave className='text-[13px]' duration={1}>
      Syncing your changes...
    </TextShimmerWave>
  );
}
