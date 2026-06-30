import { Safari } from '@/components/core/safari';

export function SafariPicture() {
  return (
    <div className='w-full max-w-2xl px-4 py-10'>
      <Safari
        url='https://tidewell.studio'
        imageSrc='/images/scenes/scene-04.svg'
        label='The Tidewell Studio home page in a browser'
      />
    </div>
  );
}
