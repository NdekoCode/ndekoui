import { Safari } from '@/components/core/safari';
import Dashboards01 from '@/registry/ndeko/blocks/dashboards/dashboards-01';

export function SafariBlock() {
  return (
    <div className='w-full max-w-3xl px-4 py-10'>
      <Safari
        url='app.tidewell.studio/overview'
        mode='simple'
        aspectRatio={16 / 10}
        label='The Tidewell Studio overview in a browser'
      >
        <Dashboards01 />
      </Safari>
    </div>
  );
}
