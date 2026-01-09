import { Label } from '@/registry/ndeko/ui/label';
import { Slider } from '@/registry/ndeko/ui/slider';

export default function Slider11() {
  return (
    <div className='flex w-full max-w-xs flex-col gap-3'>
      <Label>Age range</Label>
      <Slider
        defaultValue={[20, 70]}
        step={10}
        thumbLabels={['Minimum age', 'Maximum age']}
      />
    </div>
  );
}
