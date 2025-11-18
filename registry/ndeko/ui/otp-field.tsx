'use client';

import { OTPField as OTPFieldPrimitive } from '@base-ui/react/otp-field';

import { CONTROL_RECIPE } from '@/registry/ndeko/lib/recipes';
import { cn } from '@/registry/ndeko/lib/utils';

type WithClassName<Props> = Omit<Props, 'className'> & { className?: string };

function OTPField({
  className,
  ...props
}: WithClassName<OTPFieldPrimitive.Root.Props>) {
  return (
    <OTPFieldPrimitive.Root
      data-slot='otp-field'
      className={cn('flex items-center gap-2', className)}
      {...props}
    />
  );
}

function OTPFieldInput({
  className,
  ...props
}: WithClassName<OTPFieldPrimitive.Input.Props>) {
  return (
    <OTPFieldPrimitive.Input
      data-slot='otp-field-input'
      className={cn(
        CONTROL_RECIPE,
        'size-10 p-0 text-center text-base font-medium tabular-nums md:text-base',
        className
      )}
      {...props}
    />
  );
}

function OTPFieldSeparator({
  className,
  ...props
}: WithClassName<OTPFieldPrimitive.Separator.Props>) {
  return (
    <OTPFieldPrimitive.Separator
      data-slot='otp-field-separator'
      className={cn('bg-foreground/20 h-0.5 w-2 rounded-full', className)}
      {...props}
    />
  );
}

export { OTPField, OTPFieldInput, OTPFieldSeparator };
