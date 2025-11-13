'use client';

import { Separator as SeparatorPrimitive } from '@base-ui/react/separator';

import { cn } from '@/registry/ndeko/lib/utils';

type SeparatorProps = Omit<SeparatorPrimitive.Props, 'className'> & {
  className?: string;
};

function Separator({
  className,
  orientation = 'horizontal',
  ...props
}: SeparatorProps) {
  return (
    <SeparatorPrimitive
      data-slot='separator'
      orientation={orientation}
      className={cn(
        'bg-border shrink-0 data-[orientation=horizontal]:h-(--hairline) data-[orientation=horizontal]:w-full data-[orientation=vertical]:w-(--hairline) data-[orientation=vertical]:self-stretch',
        className
      )}
      {...props}
    />
  );
}

export { Separator };
