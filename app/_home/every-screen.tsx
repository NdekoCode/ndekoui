import { Iphone } from '@/components/core/iphone';
import { Safari } from '@/components/core/safari';

import { LiveFrame } from './live-frame';

const TEMPLATE_PATH = '/view/templates/marketing/marketing-01';

const DESKTOP_WIDTH = 1280;
const DESKTOP_HEIGHT = 800;
const PHONE_WIDTH = 390;
const PHONE_HEIGHT = 844;

/** One template, live, on a wide screen and on a phone at the same time. */
export function EveryScreen() {
  return (
    <div className='relative mx-auto w-full max-w-5xl pb-10 md:pr-16'>
      <Safari
        url='ui.ndekocode.dev/templates'
        mode='simple'
        label='The Loomboard template on a wide screen'
        className='shadow-[0_32px_80px_-32px_rgb(30_27_75/0.35)]'
      >
        <LiveFrame
          src={TEMPLATE_PATH}
          title='Loomboard template, wide screen'
          frameWidth={DESKTOP_WIDTH}
          frameHeight={DESKTOP_HEIGHT}
          className='aspect-[16/10]'
        />
      </Safari>
      <div className='absolute -right-2 -bottom-4 hidden w-[24%] max-w-60 md:block'>
        <div className='motion-safe:animate-float'>
          <Iphone label='The Loomboard template on a phone'>
            <LiveFrame
              src={TEMPLATE_PATH}
              title='Loomboard template, phone'
              frameWidth={PHONE_WIDTH}
              frameHeight={PHONE_HEIGHT}
              className='absolute inset-0'
            />
          </Iphone>
        </div>
      </div>
    </div>
  );
}
