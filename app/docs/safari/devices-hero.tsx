import { Android } from '@/components/core/android';
import { Iphone } from '@/components/core/iphone';
import { Safari } from '@/components/core/safari';
import Dashboards01 from '@/registry/ndeko/blocks/dashboards/dashboards-01';

import { AndroidLockScreen } from '../android/lock-screen';
import { IphoneLockScreen } from '../iphone/lock-screen';

export function DevicesHero() {
  return (
    <div className='relative w-full max-w-3xl px-6 pt-10 pb-24 sm:px-12'>
      <Safari
        url='app.tidewell.studio/overview'
        aspectRatio={16 / 10}
        label='The Tidewell Studio overview in a browser'
      >
        <Dashboards01 />
      </Safari>
      <Android
        className='absolute bottom-8 left-0 w-[21%]'
        finish='white'
        imageSrc='/images/scenes/scene-02.svg'
        statusBar='dark'
        time=''
        label='Lock screen of a phone'
      >
        <AndroidLockScreen tone='dark' />
      </Android>
      <Iphone
        className='absolute right-0 bottom-0 w-[24%]'
        imageSrc='/images/scenes/scene-07.svg'
        statusBar='light'
        time=''
        label='Lock screen of a second phone'
      >
        <IphoneLockScreen tone='light' />
      </Iphone>
    </div>
  );
}
