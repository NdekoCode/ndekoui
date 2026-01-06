import { Switch as SwitchPrimitive } from '@base-ui/react/switch';
import { useId } from 'react';

import { Label } from '@/registry/ndeko/ui/label';

const TRACK = [
  'group/switch relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center outline-none',
  'before:absolute before:inset-x-0 before:top-1/2 before:h-3 before:-translate-y-1/2 before:rounded-full before:bg-foreground/20 before:transition-colors before:duration-200',
  'data-checked:before:bg-primary data-disabled:cursor-not-allowed data-disabled:opacity-50',
].join(' ');

const THUMB = [
  'pointer-events-none relative block size-5 rounded-full bg-white shadow-[0_1px_2px_rgb(0_0_0/0.2),0_1px_3px_rgb(0_0_0/0.12)] hairline-ring ring-black/10',
  'transition-[translate,box-shadow] duration-200 ease-(--ease-standard) data-checked:translate-x-4',
  'group-focus-visible/switch:ring-[3px] group-focus-visible/switch:ring-ring/25',
].join(' ');

export default function Switch06() {
  const id = useId();

  return (
    <div className='inline-flex items-center gap-2'>
      <SwitchPrimitive.Root id={id} className={TRACK}>
        <SwitchPrimitive.Thumb className={THUMB} />
      </SwitchPrimitive.Root>
      <Label htmlFor={id} className='sr-only'>
        Show weekends
      </Label>
    </div>
  );
}
