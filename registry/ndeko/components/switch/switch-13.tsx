import { Switch as SwitchPrimitive } from '@base-ui/react/switch';

import { MoonIcon, SunIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';

const TRACK = [
  'group/switch relative inline-grid h-8 shrink-0 cursor-pointer grid-cols-2 items-center rounded-full bg-foreground/15 p-0.5 outline-none transition-colors duration-200',
  'data-checked:bg-primary focus-visible:ring-[3px] focus-visible:ring-ring/25 data-disabled:cursor-not-allowed data-disabled:opacity-50',
].join(' ');

const THUMB = [
  'pointer-events-none absolute inset-y-0.5 start-0.5 w-[calc(50%-2px)] rounded-full bg-white shadow-[0_1px_2px_rgb(0_0_0/0.2),0_0_0_var(--hairline)_rgb(0_0_0/0.04)]',
  'transition-[translate] duration-300 ease-(--ease-out-quint) data-checked:translate-x-full',
].join(' ');

const STATE_ICON =
  'pointer-events-none flex h-full w-9 items-center justify-center transition-opacity duration-200';

export default function Switch13() {
  return (
    <SwitchPrimitive.Root
      defaultChecked
      aria-label='Dark mode'
      className={TRACK}
    >
      <SwitchPrimitive.Thumb className={THUMB} />
      <span
        className={cn(
          STATE_ICON,
          'text-primary-foreground opacity-0 group-data-checked/switch:opacity-100'
        )}
      >
        <MoonIcon />
      </span>
      <span
        className={cn(
          STATE_ICON,
          'text-muted-foreground group-data-checked/switch:opacity-0'
        )}
      >
        <SunIcon />
      </span>
    </SwitchPrimitive.Root>
  );
}
