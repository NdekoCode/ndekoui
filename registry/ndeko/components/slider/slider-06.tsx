import { Label } from '@/registry/ndeko/ui/label';
import { Slider } from '@/registry/ndeko/ui/slider';

const GIGABYTES = { style: 'unit', unit: 'gigabyte' } as const;

export default function Slider06() {
  return (
    <div className='flex w-full max-w-xs flex-col gap-3'>
      <Label>Storage limit</Label>
      <div className='flex flex-col gap-2'>
        <Slider
          defaultValue={15}
          min={5}
          max={35}
          format={GIGABYTES}
          thumbLabels={['Storage limit']}
        />
        <span
          className='text-muted-foreground flex w-full items-center justify-between gap-1 text-xs font-medium tabular-nums'
          aria-hidden='true'
        >
          <span>5 GB</span>
          <span>20 GB</span>
          <span>35 GB</span>
        </span>
      </div>
    </div>
  );
}
