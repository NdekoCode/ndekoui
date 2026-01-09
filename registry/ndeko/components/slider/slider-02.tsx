import { Label } from '@/registry/ndeko/ui/label';
import { Slider } from '@/registry/ndeko/ui/slider';

export default function Slider02() {
  return (
    <div className='flex w-full max-w-xs flex-col gap-3'>
      <Label className='opacity-50'>Brightness</Label>
      <Slider defaultValue={25} disabled thumbLabels={['Brightness']} />
    </div>
  );
}
