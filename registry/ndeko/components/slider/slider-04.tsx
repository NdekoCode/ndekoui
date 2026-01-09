import { Label } from '@/registry/ndeko/ui/label';
import { Slider } from '@/registry/ndeko/ui/slider';

export default function Slider04() {
  return (
    <div className='flex w-full max-w-xs flex-col gap-3'>
      <Label>Saturation</Label>
      <Slider
        defaultValue={25}
        thumbLabels={['Saturation']}
        className='**:data-index:bg-primary'
      />
    </div>
  );
}
