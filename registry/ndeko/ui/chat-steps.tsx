// Adapted from prompt-kit (MIT, Copyright (c) 2025 Julien Thibeaut).
'use client';

import { ChevronDownIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/registry/ndeko/ui/collapsible';

type StepsProps = React.ComponentProps<typeof Collapsible>;

function Steps({ defaultOpen = true, ...props }: StepsProps) {
  return <Collapsible data-slot='steps' defaultOpen={defaultOpen} {...props} />;
}

const CHEVRON =
  'ease-(--ease-out-strong) size-3.5 transition-[rotate,opacity] duration-200 group-data-panel-open/steps:rotate-180';

type StepsTriggerProps = Omit<
  React.ComponentProps<typeof CollapsibleTrigger>,
  'className'
> & {
  className?: string;
  /** Shown before the label; it gives way to the chevron while the pointer is over the row. */
  leftIcon?: React.ReactNode;
  swapIconOnHover?: boolean;
};

function StepsTrigger({
  children,
  className,
  leftIcon,
  swapIconOnHover = true,
  ...props
}: StepsTriggerProps) {
  const hasLeftIcon = leftIcon !== undefined;
  const isSwappingIcon = hasLeftIcon && swapIconOnHover;

  return (
    <CollapsibleTrigger
      data-slot='steps-trigger'
      className={cn(
        'group/steps text-muted-foreground hover:text-foreground focus-visible:ring-ring/25 flex w-full cursor-pointer items-center gap-2 rounded-md text-start text-[13px] transition-colors outline-none focus-visible:ring-[3px]',
        className
      )}
      {...props}
    >
      {hasLeftIcon && (
        <span className='relative inline-flex size-4 shrink-0 items-center justify-center [&_svg]:size-4'>
          <span
            className={cn(
              'inline-flex transition-opacity duration-150',
              isSwappingIcon && 'group-hover/steps:opacity-0'
            )}
          >
            {leftIcon}
          </span>
          {isSwappingIcon && (
            <ChevronDownIcon
              className={cn(
                CHEVRON,
                'absolute opacity-0 group-hover/steps:opacity-100'
              )}
            />
          )}
        </span>
      )}
      <span className='min-w-0'>{children}</span>
      {!hasLeftIcon && <ChevronDownIcon className={CHEVRON} />}
    </CollapsibleTrigger>
  );
}

type StepsBarProps = React.ComponentProps<'div'>;

function StepsBar({ className, ...props }: StepsBarProps) {
  return (
    <div
      data-slot='steps-bar'
      aria-hidden='true'
      className={cn('bg-border ms-[7.5px] h-full w-px', className)}
      {...props}
    />
  );
}

type StepsContentProps = Omit<
  React.ComponentProps<typeof CollapsibleContent>,
  'className'
> & {
  className?: string;
  /** Replaces the line drawn beside the steps. */
  bar?: React.ReactNode;
};

function StepsContent({
  children,
  className,
  bar,
  ...props
}: StepsContentProps) {
  const sideBar = bar ?? <StepsBar />;

  return (
    <CollapsibleContent
      data-slot='steps-content'
      className={className}
      {...props}
    >
      <div className='mt-2.5 grid max-w-full min-w-0 grid-cols-[min-content_minmax(0,1fr)] items-start gap-x-3'>
        <div className='min-w-0 self-stretch'>{sideBar}</div>
        <div className='min-w-0 space-y-2'>{children}</div>
      </div>
    </CollapsibleContent>
  );
}

type StepsItemProps = React.ComponentProps<'div'>;

function StepsItem({ className, ...props }: StepsItemProps) {
  return (
    <div
      data-slot='steps-item'
      className={cn(
        'text-muted-foreground text-[13px] leading-relaxed',
        className
      )}
      {...props}
    />
  );
}

export { Steps, StepsBar, StepsContent, StepsItem, StepsTrigger };
