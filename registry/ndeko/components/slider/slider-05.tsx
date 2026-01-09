import { Label } from '@/registry/ndeko/ui/label';
import { Slider } from '@/registry/ndeko/ui/slider';

const NARROW_THUMB = [
  '**:data-index:h-6 **:data-index:w-2.5 **:data-index:rounded-full',
  '**:data-index:border-[3px] **:data-index:border-card **:data-index:bg-primary **:data-index:shadow-none',
].join(' ');

export default function Slider05() {
  return (
    <div className='flex w-full max-w-xs flex-col gap-3'>
      <Label>Blur radius</Label>
      <Slider
        defaultValue={25}
        thumbLabels={['Blur radius']}
        className={NARROW_THUMB}
      />
    </div>
  );
}
