import { TextShimmer } from '@/components/core/text-shimmer';

export function TextShimmerBasic() {
  return (
    <TextShimmer className='text-[13px]' duration={1}>
      Syncing your changes...
    </TextShimmer>
  );
}
