'use client';

import { Avatar as AvatarPrimitive } from '@base-ui/react/avatar';

import { cn } from '@/registry/ndeko/lib/utils';

type WithClassName<Props> = Omit<Props, 'className'> & { className?: string };

function Avatar({
  className,
  ...props
}: WithClassName<AvatarPrimitive.Root.Props>) {
  return (
    <AvatarPrimitive.Root
      data-slot='avatar'
      className={cn(
        'bg-muted text-muted-foreground hairline-ring ring-foreground/10 relative inline-flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full align-middle text-xs font-medium select-none',
        className
      )}
      {...props}
    />
  );
}

function AvatarImage({
  className,
  ...props
}: WithClassName<AvatarPrimitive.Image.Props>) {
  return (
    <AvatarPrimitive.Image
      data-slot='avatar-image'
      className={cn(
        'size-full object-cover transition-opacity duration-200 data-starting-style:opacity-0',
        className
      )}
      {...props}
    />
  );
}

function AvatarFallback({
  className,
  ...props
}: WithClassName<AvatarPrimitive.Fallback.Props>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot='avatar-fallback'
      className={cn(
        'bg-muted flex size-full items-center justify-center',
        className
      )}
      {...props}
    />
  );
}

export { Avatar, AvatarFallback, AvatarImage };
