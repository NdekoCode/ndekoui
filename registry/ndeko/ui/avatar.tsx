'use client';

import { Avatar as AvatarPrimitive } from '@base-ui/react/avatar';

import { meshOf } from '@/registry/ndeko/lib/mesh';
import { cn } from '@/registry/ndeko/lib/utils';

type WithClassName<Props> = Omit<Props, 'className'> & { className?: string };

type RootStyle = AvatarPrimitive.Root.Props['style'];

type AvatarProps = WithClassName<AvatarPrimitive.Root.Props> & {
  /** A name or an address. Someone without a picture gets a gradient drawn from it, the same every time. */
  seed?: string;
};

function fillOf(seed: string | undefined) {
  if (seed === undefined) {
    return 'bg-muted';
  }
  return 'mesh-fill';
}

/** The gradient goes under the style of the caller, who can still override any property. */
function styleWithMesh(seed: string | undefined, style: RootStyle): RootStyle {
  if (seed === undefined) {
    return style;
  }
  const mesh = meshOf(seed);
  if (typeof style === 'function') {
    return (state) => ({ ...mesh, ...style(state) });
  }
  return { ...mesh, ...style };
}

function Avatar({ className, seed, style, ...props }: AvatarProps) {
  return (
    <AvatarPrimitive.Root
      data-slot='avatar'
      style={styleWithMesh(seed, style)}
      className={cn(
        'text-muted-foreground hairline-ring ring-foreground/10 relative inline-flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full align-middle text-xs font-medium select-none',
        fillOf(seed),
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
