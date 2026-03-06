// Adapted from prompt-kit (MIT, Copyright (c) 2025 Julien Thibeaut).
'use client';

import { ChevronDownIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/registry/ndeko/ui/collapsible';

type ChainOfThoughtProps = React.ComponentProps<'div'>;

function ChainOfThought({ className, ...props }: ChainOfThoughtProps) {
  return (
    <div
      data-slot='chain-of-thought'
      className={cn('flex flex-col', className)}
      {...props}
    />
  );
}

type ChainOfThoughtStepProps = Omit<
  React.ComponentProps<typeof Collapsible>,
  'className'
> & {
  className?: string;
};

function ChainOfThoughtStep({
  className,
  children,
  ...props
}: ChainOfThoughtStepProps) {
  return (
    <Collapsible
      data-slot='chain-of-thought-step'
      className={cn('group/step', className)}
      {...props}
    >
      {children}
      <div
        aria-hidden='true'
        className='bg-border ms-[7.5px] h-4 w-px group-last/step:hidden'
      />
    </Collapsible>
  );
}

const CHEVRON =
  'ease-(--ease-out-strong) size-3.5 transition-[rotate,opacity] duration-200 group-data-panel-open/trigger:rotate-180';

type ChainOfThoughtTriggerProps = Omit<
  React.ComponentProps<typeof CollapsibleTrigger>,
  'className'
> & {
  className?: string;
  leftIcon?: React.ReactNode;
  /** Lets the chevron take the place of the icon while the pointer is over the row. */
  swapIconOnHover?: boolean;
};

function ChainOfThoughtTrigger({
  children,
  className,
  leftIcon,
  swapIconOnHover = true,
  ...props
}: ChainOfThoughtTriggerProps) {
  const hasLeftIcon = leftIcon !== undefined;
  const isSwappingIcon = hasLeftIcon && swapIconOnHover;

  return (
    <CollapsibleTrigger
      data-slot='chain-of-thought-trigger'
      className={cn(
        'group/trigger text-muted-foreground hover:text-foreground focus-visible:ring-ring/25 flex cursor-pointer items-center gap-2 rounded-md text-start text-[13px] transition-colors outline-none focus-visible:ring-[3px]',
        className
      )}
      {...props}
    >
      <span className='relative inline-flex size-4 shrink-0 items-center justify-center [&_svg]:size-4'>
        {hasLeftIcon && (
          <span
            className={cn(
              'inline-flex transition-opacity duration-150',
              isSwappingIcon && 'group-hover/trigger:opacity-0'
            )}
          >
            {leftIcon}
          </span>
        )}
        {isSwappingIcon && (
          <ChevronDownIcon
            className={cn(
              CHEVRON,
              'absolute opacity-0 group-hover/trigger:opacity-100'
            )}
          />
        )}
        {!hasLeftIcon && (
          <span className='bg-muted-foreground/60 size-1.5 rounded-full' />
        )}
      </span>
      <span className='min-w-0'>{children}</span>
      {!hasLeftIcon && <ChevronDownIcon className={CHEVRON} />}
    </CollapsibleTrigger>
  );
}

type ChainOfThoughtContentProps = Omit<
  React.ComponentProps<typeof CollapsibleContent>,
  'className'
> & {
  className?: string;
};

function ChainOfThoughtContent({
  children,
  className,
  ...props
}: ChainOfThoughtContentProps) {
  return (
    <CollapsibleContent
      data-slot='chain-of-thought-content'
      className={className}
      {...props}
    >
      <div className='grid grid-cols-[min-content_minmax(0,1fr)] gap-x-3'>
        <div className='bg-border ms-[7.5px] h-full w-px group-last/step:bg-transparent' />
        <div className='mt-2 min-w-0 space-y-2'>{children}</div>
      </div>
    </CollapsibleContent>
  );
}

type ChainOfThoughtItemProps = React.ComponentProps<'div'>;

function ChainOfThoughtItem({ className, ...props }: ChainOfThoughtItemProps) {
  return (
    <div
      data-slot='chain-of-thought-item'
      className={cn(
        'text-muted-foreground text-[13px] leading-relaxed',
        className
      )}
      {...props}
    />
  );
}

export {
  ChainOfThought,
  ChainOfThoughtContent,
  ChainOfThoughtItem,
  ChainOfThoughtStep,
  ChainOfThoughtTrigger,
};
