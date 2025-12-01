'use client';

import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';
import {
  Children,
  createContext,
  useCallback,
  useContext,
  useState,
} from 'react';

import { cn } from '@/registry/ndeko/lib/utils';

type TimelineContextValue = {
  activeStep: number;
  setActiveStep: (step: number) => void;
};

const TimelineContext = createContext<TimelineContextValue | undefined>(
  undefined
);

function useTimeline() {
  const context = useContext(TimelineContext);
  if (!context) {
    throw new Error('useTimeline must be used within a Timeline');
  }
  return context;
}

type TimelineProps = React.ComponentProps<'div'> & {
  defaultValue?: number;
  value?: number;
  onValueChange?: (value: number) => void;
  orientation?: 'horizontal' | 'vertical';
};

function Timeline({
  defaultValue = 1,
  value,
  onValueChange,
  orientation = 'vertical',
  className,
  ...props
}: TimelineProps) {
  const [internalStep, setInternalStep] = useState(defaultValue);
  const isControlled = value !== undefined;
  const activeStep = value ?? internalStep;

  const setActiveStep = useCallback(
    (step: number) => {
      if (!isControlled) {
        setInternalStep(step);
      }
      onValueChange?.(step);
    },
    [isControlled, onValueChange]
  );

  return (
    <TimelineContext.Provider value={{ activeStep, setActiveStep }}>
      <div
        data-slot='timeline'
        data-orientation={orientation}
        className={cn(
          'group/timeline flex data-[orientation=horizontal]:w-full data-[orientation=horizontal]:flex-row data-[orientation=vertical]:flex-col',
          className
        )}
        {...props}
      />
    </TimelineContext.Provider>
  );
}

function TimelineContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='timeline-content'
      className={cn('text-muted-foreground text-[13px]', className)}
      {...props}
    />
  );
}

function TimelineDate({
  className,
  render,
  ...props
}: useRender.ComponentProps<'time'>) {
  const defaultProps = {
    'data-slot': 'timeline-date',
    className: cn(
      'mb-1 block text-xs font-medium tabular-nums text-muted-foreground group-data-[orientation=vertical]/timeline:max-sm:h-4',
      className
    ),
  };

  return useRender({
    defaultTagName: 'time',
    render,
    props: mergeProps<'time'>(defaultProps, props),
  });
}

function TimelineHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div data-slot='timeline-header' className={cn(className)} {...props} />
  );
}

const INDICATOR = [
  'border-foreground/15 bg-card absolute size-4 rounded-full border-2',
  'transition-[background-color,border-color,color,scale] duration-200 ease-(--ease-out-strong)',
  'group-data-completed/timeline-item:border-primary group-data-completed/timeline-item:duration-300',
  'group-data-[orientation=horizontal]/timeline:-top-6 group-data-[orientation=horizontal]/timeline:left-0 group-data-[orientation=horizontal]/timeline:-translate-y-1/2',
  'group-data-[orientation=vertical]/timeline:top-0 group-data-[orientation=vertical]/timeline:-left-6 group-data-[orientation=vertical]/timeline:-translate-x-1/2',
].join(' ');

const EMPTY_DOT =
  'scale-75 group-data-completed/timeline-item:bg-primary group-data-completed/timeline-item:scale-100';

function hasNoContent(children: React.ReactNode) {
  const contentNodes = Children.toArray(children);
  return contentNodes.length === 0;
}

/**
 * Without children it is a dot: a neutral ring ahead, the brand fill growing into place once its event is done.
 * With children (an icon, an avatar) it is a frame and the content decides its fill.
 */
function TimelineIndicator({
  className,
  children,
  ...props
}: React.ComponentProps<'div'>) {
  const isEmptyDot = hasNoContent(children);

  return (
    <div
      data-slot='timeline-indicator'
      aria-hidden='true'
      className={cn(INDICATOR, isEmptyDot && EMPTY_DOT, className)}
      {...props}
    >
      {children}
    </div>
  );
}

type TimelineItemProps = React.ComponentProps<'div'> & {
  step: number;
};

function TimelineItem({ step, className, ...props }: TimelineItemProps) {
  const { activeStep } = useTimeline();
  const isCompleted = step <= activeStep;

  return (
    <div
      data-slot='timeline-item'
      data-completed={isCompleted || undefined}
      className={cn(
        'group/timeline-item has-[+[data-completed]]:[&_[data-slot=timeline-separator]]:bg-primary relative flex flex-1 flex-col gap-0.5',
        'group-data-[orientation=horizontal]/timeline:mt-8 group-data-[orientation=horizontal]/timeline:not-last:pe-8',
        'group-data-[orientation=vertical]/timeline:ms-8 group-data-[orientation=vertical]/timeline:not-last:pb-12',
        className
      )}
      {...props}
    />
  );
}

function TimelineSeparator({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='timeline-separator'
      aria-hidden='true'
      className={cn(
        'bg-foreground/10 absolute self-start rounded-full transition-colors duration-300 group-last/timeline-item:hidden',
        'group-data-[orientation=horizontal]/timeline:-top-6 group-data-[orientation=horizontal]/timeline:h-0.5 group-data-[orientation=horizontal]/timeline:w-[calc(100%-1rem-0.25rem)] group-data-[orientation=horizontal]/timeline:translate-x-4.5 group-data-[orientation=horizontal]/timeline:-translate-y-1/2',
        'group-data-[orientation=vertical]/timeline:-left-6 group-data-[orientation=vertical]/timeline:h-[calc(100%-1rem-0.25rem)] group-data-[orientation=vertical]/timeline:w-0.5 group-data-[orientation=vertical]/timeline:-translate-x-1/2 group-data-[orientation=vertical]/timeline:translate-y-4.5',
        className
      )}
      {...props}
    />
  );
}

function TimelineTitle({ className, ...props }: React.ComponentProps<'h3'>) {
  return (
    <h3
      data-slot='timeline-title'
      className={cn('text-foreground text-[13px] font-medium', className)}
      {...props}
    />
  );
}

export {
  Timeline,
  TimelineContent,
  TimelineDate,
  TimelineHeader,
  TimelineIndicator,
  TimelineItem,
  TimelineSeparator,
  TimelineTitle,
  useTimeline,
};
