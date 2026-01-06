import { Switch as SwitchPrimitive } from '@base-ui/react/switch';
import { useId } from 'react';

import { Label } from '@/registry/ndeko/ui/label';

const TRACK = [
  'relative inline-flex h-6 w-10 shrink-0 cursor-pointer items-center rounded-full bg-card hairline-ring ring-foreground/30 outline-none transition-[background-color,box-shadow] duration-200',
  'data-checked:bg-primary data-checked:ring-(--ring-color) [--ring-color:color-mix(in_oklab,black_15%,var(--primary))] dark:[--ring-color:color-mix(in_oklab,white_15%,var(--primary))]',
  'focus-visible:ring-[3px] focus-visible:ring-ring/25 focus-visible:data-checked:ring-ring/25',
  'data-disabled:cursor-not-allowed data-disabled:opacity-50',
].join(' ');

const THUMB = [
  'pointer-events-none absolute top-1/2 left-0 block size-5 -translate-y-1/2 translate-x-0.5 scale-60 rounded-full bg-foreground/45',
  'transition-[translate,scale,background-color] duration-200 ease-(--ease-out-strong)',
  'data-checked:translate-x-4.5 data-checked:scale-100 data-checked:bg-white',
].join(' ');

export default function Switch07() {
  const id = useId();

  return (
    <div className='inline-flex items-center gap-2'>
      <SwitchPrimitive.Root id={id} className={TRACK}>
        <SwitchPrimitive.Thumb className={THUMB} />
      </SwitchPrimitive.Root>
      <Label htmlFor={id} className='sr-only'>
        Show week numbers
      </Label>
    </div>
  );
}
