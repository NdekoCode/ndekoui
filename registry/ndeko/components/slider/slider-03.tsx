import { Label } from '@/registry/ndeko/ui/label';
import { Slider } from '@/registry/ndeko/ui/slider';

export default function Slider03() {
  return (
    <div className='flex w-full max-w-xs flex-col gap-3'>
      <Label>Grid spacing</Label>
      <Slider
        defaultValue={20}
        max={100}
        step={10}
        thumbLabels={['Grid spacing']}
        className='**:data-index:rounded-[5px]'
      />
    </div>
  );
}
