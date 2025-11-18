'use client';

import { Switch as SwitchPrimitive } from '@base-ui/react/switch';

import { cn } from '@/registry/ndeko/lib/utils';

type SwitchProps = Omit<SwitchPrimitive.Root.Props, 'className'> & {
  className?: string;
};

const THUMB = [
  'pointer-events-none block h-4 w-4 rounded-full bg-white shadow-[0_1px_2px_rgb(0_0_0/0.2),0_0_0_var(--hairline)_rgb(0_0_0/0.04)]',
  'transition-[translate,width] duration-200 ease-(--ease-out-strong)',
  'group-active/switch:w-5 data-checked:translate-x-3 group-active/switch:data-checked:translate-x-2',
  'rtl:data-checked:-translate-x-3 rtl:group-active/switch:data-checked:-translate-x-2',
].join(' ');

function Switch({ className, ...props }: SwitchProps) {
  return (
    <SwitchPrimitive.Root
      data-slot='switch'
      className={cn(
        'group/switch peer bg-foreground/15 inline-flex h-5 w-8 shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors duration-200 outline-none',
        'focus-visible:ring-ring/25 data-checked:bg-primary dark:bg-foreground/20 dark:data-checked:bg-primary focus-visible:ring-[3px] data-disabled:cursor-not-allowed data-disabled:opacity-50',
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb data-slot='switch-thumb' className={THUMB} />
    </SwitchPrimitive.Root>
  );
}

export { Switch, type SwitchProps };
