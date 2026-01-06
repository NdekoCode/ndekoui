import { Switch as SwitchPrimitive } from '@base-ui/react/switch';

import { MoonIcon, SunIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';

const TRACK = [
  'group/switch relative inline-grid h-8 shrink-0 cursor-pointer grid-cols-2 items-center rounded-full bg-foreground/[0.05] p-0.5 outline-none',
  'focus-visible:ring-[3px] focus-visible:ring-ring/25 data-disabled:cursor-not-allowed data-disabled:opacity-50',
].join(' ');

const THUMB = [
  'pointer-events-none absolute inset-y-0.5 start-0.5 w-[calc(50%-2px)] rounded-full bg-card shadow-[0_1px_2px_rgb(0_0_0/0.08)] hairline-ring ring-foreground/10',
  'transition-[translate] duration-300 ease-(--ease-out-quint) data-checked:translate-x-full',
  'dark:bg-foreground/[0.09] dark:ring-foreground/15',
].join(' ');

const OPTION =
  'pointer-events-none relative flex h-full w-9 items-center justify-center text-muted-foreground transition-colors duration-200';

export default function Switch12() {
  return (
    <SwitchPrimitive.Root
      defaultChecked
      aria-label='Dark mode'
      className={TRACK}
    >
      <SwitchPrimitive.Thumb className={THUMB} />
      <span
        className={cn(OPTION, 'group-data-unchecked/switch:text-foreground')}
      >
        <SunIcon />
      </span>
      <span className={cn(OPTION, 'group-data-checked/switch:text-foreground')}>
        <MoonIcon />
      </span>
    </SwitchPrimitive.Root>
  );
}
