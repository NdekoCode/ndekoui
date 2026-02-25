import { TextShimmer } from '@/components/core/text-shimmer';

export function TextShimmerColor() {
  return (
    <TextShimmer
      duration={1.2}
      className='text-xl font-medium [--base-color:var(--info-foreground)] [--base-gradient-color:color-mix(in_oklab,var(--info)_30%,white)] dark:[--base-color:var(--info-foreground)] dark:[--base-gradient-color:color-mix(in_oklab,var(--info-foreground)_40%,white)]'
    >
      Hi, how are you?
    </TextShimmer>
  );
}
