import { Label } from '@/registry/ndeko/ui/label';
import { Slider } from '@/registry/ndeko/ui/slider';

export default function Slider09() {
  return (
    <div className='flex w-full max-w-xs flex-col gap-3'>
      <Label>Image quality</Label>
      <div className='flex flex-col gap-2'>
        <span
          className='text-muted-foreground flex w-full items-center justify-between gap-2 text-xs font-medium'
          aria-hidden='true'
        >
          <span>Low</span>
          <span>High</span>
        </span>
        <Slider defaultValue={50} step={10} thumbLabels={['Image quality']} />
      </div>
    </div>
  );
}
