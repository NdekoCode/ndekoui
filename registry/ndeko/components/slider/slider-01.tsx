import { Label } from '@/registry/ndeko/ui/label';
import { Slider } from '@/registry/ndeko/ui/slider';

export default function Slider01() {
  return (
    <div className='flex w-full max-w-xs flex-col gap-3'>
      <Label>Opacity</Label>
      <Slider defaultValue={25} thumbLabels={['Opacity']} />
    </div>
  );
}
