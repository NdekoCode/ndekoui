'use client';

import { Accordion as AccordionPrimitive } from '@base-ui/react/accordion';

import { ChevronDownIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';

type WithClassName<Props> = Omit<Props, 'className'> & { className?: string };

function Accordion({
  className,
  ...props
}: WithClassName<AccordionPrimitive.Root.Props>) {
  return (
    <AccordionPrimitive.Root
      data-slot='accordion'
      className={cn('flex w-full flex-col', className)}
      {...props}
    />
  );
}

function AccordionItem({
  className,
  ...props
}: WithClassName<AccordionPrimitive.Item.Props>) {
  return (
    <AccordionPrimitive.Item
      data-slot='accordion-item'
      className={cn('hairline-b border-border last:border-b-0', className)}
      {...props}
    />
  );
}

function AccordionTrigger({
  className,
  children,
  ...props
}: WithClassName<AccordionPrimitive.Trigger.Props>) {
  return (
    <AccordionPrimitive.Header className='flex'>
      <AccordionPrimitive.Trigger
        data-slot='accordion-trigger'
        className={cn(
          'group/accordion-trigger text-foreground flex flex-1 cursor-pointer items-center justify-between gap-4 rounded-md py-3 text-left text-[13px] font-medium transition-colors outline-none',
          'focus-visible:ring-ring/25 focus-visible:ring-[3px] data-disabled:pointer-events-none data-disabled:opacity-50',
          className
        )}
        {...props}
      >
        {children}
        <ChevronDownIcon className='text-muted-foreground size-4 shrink-0 transition-transform duration-200 ease-(--ease-out-strong) group-data-panel-open/accordion-trigger:rotate-180' />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

function AccordionContent({
  className,
  children,
  ...props
}: WithClassName<AccordionPrimitive.Panel.Props>) {
  return (
    <AccordionPrimitive.Panel
      data-slot='accordion-content'
      className='text-muted-foreground h-(--accordion-panel-height) overflow-hidden text-[13px] transition-[height] duration-200 ease-(--ease-out-strong) data-ending-style:h-0 data-starting-style:h-0'
      {...props}
    >
      <div className={cn('pb-3', className)}>{children}</div>
    </AccordionPrimitive.Panel>
  );
}

export {
  Accordion,
  AccordionContent,
  AccordionContent as AccordionPanel,
  AccordionItem,
  AccordionTrigger,
};
