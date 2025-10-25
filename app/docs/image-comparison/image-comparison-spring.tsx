import {
    ImageComparison, ImageComparisonImage, ImageComparisonSlider
} from '@/components/core/image-comparison';

export function ImageComparisonSpring() {
  return (
    <ImageComparison
      className='aspect-16/10 w-full rounded-lg border border-zinc-200 dark:border-zinc-800'
      enableHover
      springOptions={{
        bounce: 0.3,
      }}
    >
      <ImageComparisonImage
        src='/mp_dark.png'
        alt='Ndeko UI  Dark'
        position='left'
      />
      <ImageComparisonImage
        src='/mp_light.png'
        alt='Ndeko UI  Light'
        position='right'
      />
      <ImageComparisonSlider className='backdrop-blur-xs w-0.5 bg-white/30' />
    </ImageComparison>
  );
}
