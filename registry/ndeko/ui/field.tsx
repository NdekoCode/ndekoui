'use client';

import { Field as FieldPrimitive } from '@base-ui/react/field';

import { cn } from '@/registry/ndeko/lib/utils';
import { LABEL_RECIPE } from '@/registry/ndeko/ui/label';

type WithClassName<Props> = Omit<Props, 'className'> & { className?: string };

function Field({
  className,
  ...props
}: WithClassName<FieldPrimitive.Root.Props>) {
  return (
    <FieldPrimitive.Root
      data-slot='field'
      className={cn('group flex flex-col gap-1.5', className)}
      {...props}
    />
  );
}

function FieldLabel({
  className,
  ...props
}: WithClassName<FieldPrimitive.Label.Props>) {
  return (
    <FieldPrimitive.Label
      data-slot='field-label'
      className={cn(LABEL_RECIPE, className)}
      {...props}
    />
  );
}

function FieldDescription({
  className,
  ...props
}: WithClassName<FieldPrimitive.Description.Props>) {
  return (
    <FieldPrimitive.Description
      data-slot='field-description'
      className={cn('text-muted-foreground text-xs', className)}
      {...props}
    />
  );
}

function FieldError({
  className,
  ...props
}: WithClassName<FieldPrimitive.Error.Props>) {
  return (
    <FieldPrimitive.Error
      data-slot='field-error'
      className={cn(
        'text-destructive-ink text-xs',
        'transition-[opacity,translate] duration-200 ease-(--ease-out-strong) data-ending-style:opacity-0 data-ending-style:duration-150 data-starting-style:-translate-y-0.5 data-starting-style:opacity-0',
        className
      )}
      {...props}
    />
  );
}

export { Field, FieldDescription, FieldError, FieldLabel };
