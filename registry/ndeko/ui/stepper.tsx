'use client';

import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';
import { createContext, useCallback, useContext, useState } from 'react';

import { CheckIcon, LoaderCircleIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';

type StepperOrientation = 'horizontal' | 'vertical';

type StepState = 'active' | 'completed' | 'inactive';

type StepperContextValue = {
  activeStep: number;
  setActiveStep: (step: number) => void;
  orientation: StepperOrientation;
};

type StepItemContextValue = {
  step: number;
  state: StepState;
  isDisabled: boolean;
  isLoading: boolean;
};

const StepperContext = createContext<StepperContextValue | undefined>(
  undefined
);
const StepItemContext = createContext<StepItemContextValue | undefined>(
  undefined
);

function useStepper() {
  const context = useContext(StepperContext);
  if (!context) {
    throw new Error('useStepper must be used within a Stepper');
  }
  return context;
}

function useStepItem() {
  const context = useContext(StepItemContext);
  if (!context) {
    throw new Error('useStepItem must be used within a StepperItem');
  }
  return context;
}

type StepperProps = React.ComponentProps<'div'> & {
  defaultValue?: number;
  value?: number;
  onValueChange?: (value: number) => void;
  orientation?: StepperOrientation;
};

function Stepper({
  defaultValue = 0,
  value,
  onValueChange,
  orientation = 'horizontal',
  className,
  ...props
}: StepperProps) {
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
    <StepperContext.Provider value={{ activeStep, setActiveStep, orientation }}>
      <div
        data-slot='stepper'
        data-orientation={orientation}
        className={cn(
          'group/stepper inline-flex data-[orientation=horizontal]:w-full data-[orientation=horizontal]:flex-row data-[orientation=vertical]:flex-col',
          className
        )}
        {...props}
      />
    </StepperContext.Provider>
  );
}

function stateOfStep(step: number, activeStep: number, completed: boolean) {
  const isBefore = step < activeStep;
  if (completed || isBefore) {
    return 'completed' as const;
  }
  if (step === activeStep) {
    return 'active' as const;
  }
  return 'inactive' as const;
}

type StepperItemProps = React.ComponentProps<'div'> & {
  step: number;
  completed?: boolean;
  disabled?: boolean;
  loading?: boolean;
};

function StepperItem({
  step,
  completed = false,
  disabled = false,
  loading = false,
  className,
  children,
  ...props
}: StepperItemProps) {
  const { activeStep } = useStepper();
  const state = stateOfStep(step, activeStep, completed);
  const isActive = step === activeStep;
  const isLoading = loading && isActive;

  return (
    <StepItemContext.Provider
      value={{ step, state, isDisabled: disabled, isLoading }}
    >
      <div
        data-slot='stepper-item'
        data-state={state}
        data-loading={isLoading || undefined}
        className={cn(
          'group/step flex items-center group-data-[orientation=horizontal]/stepper:flex-row group-data-[orientation=vertical]/stepper:flex-col',
          className
        )}
        {...props}
      >
        {children}
      </div>
    </StepItemContext.Provider>
  );
}

function StepperTrigger({
  className,
  render,
  ...props
}: useRender.ComponentProps<'button'>) {
  const { setActiveStep } = useStepper();
  const { step, isDisabled } = useStepItem();
  const defaultProps = {
    'data-slot': 'stepper-trigger',
    type: 'button' as const,
    disabled: isDisabled,
    onClick: () => setActiveStep(step),
    className: cn(
      'inline-flex items-center gap-3 rounded-full text-left outline-none focus-visible:z-10 focus-visible:ring-[3px] focus-visible:ring-ring/25 disabled:pointer-events-none disabled:opacity-50',
      'transition-[scale] duration-150 ease-(--ease-out-strong) active:scale-[0.97]',
      className
    ),
  };

  return useRender({
    defaultTagName: 'button',
    render,
    props: mergeProps<'button'>(defaultProps, props),
  });
}

const STEP_SWAP =
  'transition-[scale,opacity,filter] duration-200 ease-(--ease-out-strong)';

const STEP_NUMBER = [
  STEP_SWAP,
  'group-data-loading/step:scale-60 group-data-loading/step:opacity-0 group-data-loading/step:blur-[2px]',
  'group-data-[state=completed]/step:scale-60 group-data-[state=completed]/step:opacity-0 group-data-[state=completed]/step:blur-[2px]',
].join(' ');

const STEP_CHECK = [
  STEP_SWAP,
  'absolute size-3.5 scale-60 opacity-0 blur-[2px]',
  'group-data-[state=completed]/step:scale-100 group-data-[state=completed]/step:opacity-100 group-data-[state=completed]/step:blur-none',
].join(' ');

const INDICATOR = [
  'relative flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium tabular-nums',
  'bg-foreground/[0.06] text-muted-foreground transition-colors duration-200',
  'data-[state=active]:bg-primary data-[state=active]:text-primary-foreground',
  'data-[state=completed]:bg-primary data-[state=completed]:text-primary-foreground',
].join(' ');

function StepperIndicator({
  className,
  children,
  ...props
}: React.ComponentProps<'span'>) {
  const { state, step, isLoading } = useStepItem();
  const hasCustomContent = children !== undefined;

  return (
    <span
      data-slot='stepper-indicator'
      data-state={state}
      className={cn(INDICATOR, className)}
      {...props}
    >
      {hasCustomContent && children}
      {!hasCustomContent && (
        <>
          <span className={STEP_NUMBER}>{step}</span>
          <CheckIcon strokeWidth={2.5} className={STEP_CHECK} />
          {isLoading && (
            <LoaderCircleIcon className='absolute size-3.5 animate-spin' />
          )}
        </>
      )}
    </span>
  );
}

function StepperTitle({ className, ...props }: React.ComponentProps<'h3'>) {
  return (
    <h3
      data-slot='stepper-title'
      className={cn('text-[13px] font-medium', className)}
      {...props}
    />
  );
}

function StepperDescription({
  className,
  ...props
}: React.ComponentProps<'p'>) {
  return (
    <p
      data-slot='stepper-description'
      className={cn('text-muted-foreground text-xs', className)}
      {...props}
    />
  );
}

const SEPARATOR = [
  'bg-foreground/10 relative m-0.5 rounded-full transition-colors duration-300',
  'group-data-[orientation=horizontal]/stepper:h-0.5 group-data-[orientation=horizontal]/stepper:w-full group-data-[orientation=horizontal]/stepper:flex-1',
  'group-data-[orientation=vertical]/stepper:h-12 group-data-[orientation=vertical]/stepper:w-0.5',
].join(' ');

const SEPARATOR_FILL = [
  'after:bg-primary after:absolute after:inset-0 after:rounded-full after:transition-[scale] after:duration-200 after:ease-(--ease-out-strong)',
  'group-data-[state=completed]/step:after:duration-300',
  'group-data-[orientation=horizontal]/stepper:after:origin-left group-data-[orientation=horizontal]/stepper:rtl:after:origin-right',
  'group-data-[orientation=horizontal]/stepper:after:scale-x-0 group-data-[orientation=horizontal]/stepper:group-data-[state=completed]/step:after:scale-x-100',
  'group-data-[orientation=vertical]/stepper:after:origin-top',
  'group-data-[orientation=vertical]/stepper:after:scale-y-0 group-data-[orientation=vertical]/stepper:group-data-[state=completed]/step:after:scale-y-100',
].join(' ');

function StepperSeparator({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='stepper-separator'
      className={cn(SEPARATOR, SEPARATOR_FILL, className)}
      {...props}
    />
  );
}

export {
  Stepper,
  StepperDescription,
  StepperIndicator,
  StepperItem,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
  useStepItem,
  useStepper,
};
