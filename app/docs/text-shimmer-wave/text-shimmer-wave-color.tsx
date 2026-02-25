import { TextShimmerWave } from '@/components/core/text-shimmer-wave';

export function TextShimmerWaveColor() {
  return (
    <TextShimmerWave
      className='[--base-color:var(--info-foreground)] [--base-gradient-color:var(--info)] dark:[--base-color:var(--info-foreground)] dark:[--base-gradient-color:var(--info)]'
      duration={1}
      spread={1}
      zDistance={1}
      scaleDistance={1.1}
      rotateYDistance={20}
    >
      Creating the perfect dish...
    </TextShimmerWave>
  );
}
