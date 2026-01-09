import { Label } from '@/registry/ndeko/ui/label';
import { Slider } from '@/registry/ndeko/ui/slider';

export default function Slider22() {
  return (
    <div className='flex w-full max-w-xs flex-col gap-3'>
      <Label>Gain</Label>
      <div className='flex h-40 justify-center'>
        <Slider
          defaultValue={5}
          max={10}
          orientation='vertical'
          thumbLabels={['Gain']}
        />
      </div>
    </div>
  );
}
