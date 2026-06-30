import { Safari } from '@/components/core/safari';

export function SafariDark() {
  return (
    <div className='w-full max-w-2xl px-4 py-10'>
      <div className='dark'>
        <Safari
          url='tidewell.studio/night-shift'
          imageSrc='/images/scenes/scene-07.svg'
          label='The Night shift page of Tidewell Studio in a dark browser'
        />
      </div>
    </div>
  );
}
