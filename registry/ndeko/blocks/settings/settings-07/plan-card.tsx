'use client';

import { Radio as RadioPrimitive } from '@base-ui/react/radio';
import { RadioGroup as RadioGroupPrimitive } from '@base-ui/react/radio-group';
import { motion } from 'motion/react';
import { useId } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import {
  pressedQuietOf,
  pressedSolidOf,
} from '@/registry/ndeko/lib/demonstration';
import { springOf } from '@/registry/ndeko/lib/motion-presets';
import { cn } from '@/registry/ndeko/lib/utils';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Button } from '@/registry/ndeko/ui/button';
import { Fold, Swap } from '@/registry/ndeko/ui/chat-motion';
import { MorphButton, type MorphState } from '@/registry/ndeko/ui/morph-button';
import { Wash } from '@/registry/ndeko/ui/wash';

import {
  PLANS,
  RENEWAL_DATE,
  RENEWAL_DAY,
  type Plan,
  type PlanId,
} from './data';
import { isTooSmall, planOf, type BillingState } from './session';
import { SURFACE } from './settings-frame';

export const WHOLE_DOLLARS: Intl.NumberFormatOptions = {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
};

const DOLLARS = new Intl.NumberFormat('en-US', WHOLE_DOLLARS);

type PlanStatus = {
  key: string;
  label: string;
  variant: 'success' | 'warning';
};

function statusOf(state: BillingState): PlanStatus {
  if (state.isCancelling) {
    return {
      key: 'cancelling',
      label: `Cancels on ${RENEWAL_DAY}`,
      variant: 'warning',
    };
  }
  return { key: 'active', label: 'Active', variant: 'success' };
}

function renewalLineOf(state: BillingState, plan: Plan) {
  const isFree = plan.price === 0;
  if (isFree) {
    return `${plan.seats} seats, free, nothing to renew`;
  }
  if (state.isCancelling) {
    return `Ends on ${RENEWAL_DATE}, then moves to Starter. Nothing more is charged`;
  }
  return `${plan.seats} seats · Renews on ${RENEWAL_DATE}`;
}

function priceLineOf(plan: Plan) {
  if (plan.price === 0) {
    return 'Free';
  }
  return `${DOLLARS.format(plan.price)} a month`;
}

function switchLabelsOf(picked: Plan): Record<MorphState, string> {
  return {
    idle: `Switch to ${picked.name}`,
    busy: 'Switching',
    done: 'Switched',
  };
}

function switchStateOf(isSwitching: boolean): MorphState {
  if (isSwitching) {
    return 'busy';
  }
  return 'idle';
}

function tooSmallLineOf(seatsUsed: number) {
  return `${seatsUsed} seats in use`;
}

type PlanChooserProps = {
  state: BillingState;
  onPick: (planId: PlanId) => void;
  onSwitch: () => void;
  onClose: () => void;
};

/** One highlight travels to the plan picked; a plan too small for the team stays in place, dimmed. */
function PlanChooser({ state, onPick, onSwitch, onClose }: PlanChooserProps) {
  const thumbId = useId();
  const shouldReduceMotion = usePrefersReducedMotion();
  const travel = springOf(shouldReduceMotion);
  const picked = planOf(state.pickedPlanId);
  const isSamePlan = state.pickedPlanId === state.planId;
  const seatsUsed = state.used.seats;

  function pick(value: unknown) {
    const plan = PLANS.find((candidate) => candidate.id === value);
    if (plan) {
      onPick(plan.id);
    }
  }

  function closeOnEscape(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'Escape') {
      return;
    }
    event.preventDefault();
    onClose();
  }

  return (
    <div
      onKeyDown={closeOnEscape}
      className='bg-card/70 dark:bg-foreground/[0.03] flex flex-col gap-3 rounded-lg p-2'
    >
      <RadioGroupPrimitive
        value={state.pickedPlanId}
        onValueChange={pick}
        aria-label='Plans'
        className='flex flex-col gap-1'
      >
        {PLANS.map((plan) => {
          const isPicked = plan.id === state.pickedPlanId;
          const isCurrent = plan.id === state.planId;
          const isBlocked = isTooSmall(plan.id, seatsUsed);
          return (
            <RadioPrimitive.Root
              key={plan.id}
              value={plan.id}
              disabled={isBlocked}
              data-plan={plan.id}
              className='focus-visible:ring-ring/25 relative flex w-full cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-start outline-none focus-visible:ring-[3px] data-disabled:cursor-not-allowed data-disabled:opacity-50'
            >
              {isPicked && (
                <motion.span
                  aria-hidden='true'
                  layoutId={thumbId}
                  transition={travel}
                  className='bg-primary/[0.07] hairline-ring ring-primary/30 absolute inset-0 rounded-md'
                />
              )}
              <span className='relative flex min-w-0 flex-1 flex-col gap-0.5'>
                <span className='flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] font-medium'>
                  {plan.name}
                  {isCurrent && <Badge variant='secondary'>Current</Badge>}
                </span>
                <span className='text-muted-foreground text-xs text-pretty'>
                  {isBlocked && tooSmallLineOf(seatsUsed)}
                  {!isBlocked && `${plan.seats} seats. ${plan.line}`}
                </span>
              </span>
              <span className='relative shrink-0 text-[13px] tabular-nums'>
                {priceLineOf(plan)}
              </span>
            </RadioPrimitive.Root>
          );
        })}
      </RadioGroupPrimitive>
      <div className='flex flex-wrap items-center justify-end gap-2 px-1 pb-1'>
        <Button type='button' variant='ghost' size='sm' onClick={onClose}>
          Close
        </Button>
        <MorphButton
          type='button'
          size='sm'
          state={switchStateOf(state.isSwitchingPlan)}
          labels={switchLabelsOf(picked)}
          disabled={isSamePlan}
          onClick={onSwitch}
        />
      </div>
    </div>
  );
}

type CancelConfirmProps = {
  planName: string;
  pressed: string | null;
  onKeep: () => void;
  onConfirm: () => void;
};

function CancelConfirm({
  planName,
  pressed,
  onKeep,
  onConfirm,
}: CancelConfirmProps) {
  function keepOnEscape(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'Escape') {
      return;
    }
    event.preventDefault();
    onKeep();
  }

  return (
    <div
      role='group'
      aria-label={`Cancel the ${planName} plan`}
      onKeyDown={keepOnEscape}
      className='bg-destructive/[0.06] flex flex-col gap-3 rounded-lg p-3'
    >
      <p className='text-[13px] text-pretty'>
        <span className='font-medium'>{`Cancel the ${planName} plan?`}</span>{' '}
        {`It stays active until ${RENEWAL_DATE}, then the workspace moves to Starter and keeps 5 seats.`}
      </p>
      <div className='flex flex-wrap justify-end gap-2'>
        <Button
          type='button'
          variant='ghost'
          size='sm'
          data-keep-plan
          onClick={onKeep}
        >
          Keep the plan
        </Button>
        <Button
          type='button'
          variant='destructive'
          size='sm'
          onClick={onConfirm}
          className={pressedSolidOf(pressed === 'confirm-cancel')}
        >
          Cancel subscription
        </Button>
      </div>
    </div>
  );
}

function endLabelOf(isCancelling: boolean) {
  if (isCancelling) {
    return 'Resume subscription';
  }
  return 'Cancel subscription';
}

/** Only Cancel opens something: Resume acts at once. */
function endExpandedOf(isCancelling: boolean, isConfirming: boolean) {
  if (isCancelling) {
    return undefined;
  }
  return isConfirming;
}

/** Cancelling is quiet until it is pending; Resume is then the action the card asks for. */
function endLookOf(isCancelling: boolean, pressed: string | null) {
  if (isCancelling) {
    return cn('text-primary-ink', pressedQuietOf(pressed === 'resume'));
  }
  return cn('text-destructive-ink', pressedQuietOf(pressed === 'cancel'));
}

type PlanCardProps = {
  state: BillingState;
  pressed: string | null;
  onToggleChooser: () => void;
  onPick: (planId: PlanId) => void;
  onSwitch: () => void;
  onAskCancel: () => void;
  onKeep: () => void;
  onConfirmCancel: () => void;
  onResume: () => void;
};

/** The one featured surface of the page, so it wears the wash. */
export function PlanCard({
  state,
  pressed,
  onToggleChooser,
  onPick,
  onSwitch,
  onAskCancel,
  onKeep,
  onConfirmCancel,
  onResume,
}: PlanCardProps) {
  const titleId = useId();
  const plan = planOf(state.planId);
  const status = statusOf(state);
  const renewalLine = renewalLineOf(state, plan);
  const isPaid = plan.price > 0;
  const endLabel = endLabelOf(state.isCancelling);

  function pressEnd() {
    if (state.isCancelling) {
      onResume();
      return;
    }
    onAskCancel();
  }

  return (
    <section
      aria-labelledby={titleId}
      className={cn(
        SURFACE,
        'relative isolate flex flex-col gap-4 p-4 @xl:p-5'
      )}
    >
      <Wash />
      <div className='flex flex-wrap items-start gap-x-4 gap-y-3'>
        <div className='flex min-w-0 flex-1 basis-56 flex-col gap-1.5'>
          <div className='flex flex-wrap items-center gap-2'>
            <h3 id={titleId} className='flex text-sm font-medium'>
              <Swap swapKey={plan.name}>{`${plan.name} plan`}</Swap>
            </h3>
            <Badge variant={status.variant}>
              <AnimatedSize as='span' axis='width' contentClassName='flex'>
                <Swap swapKey={status.key}>{status.label}</Swap>
              </AnimatedSize>
            </Badge>
          </div>
          <p className='flex items-baseline gap-1.5'>
            <MotionNumber
              value={plan.price}
              format={WHOLE_DOLLARS}
              className='text-2xl leading-8 font-semibold'
            />
            <span className='text-muted-foreground text-xs'>a month</span>
          </p>
          <p className='text-muted-foreground flex text-xs text-pretty'>
            <Swap swapKey={renewalLine}>{renewalLine}</Swap>
          </p>
        </div>
        <Button
          type='button'
          variant='outline'
          size='sm'
          data-change-plan
          aria-expanded={state.isChoosingPlan}
          onClick={onToggleChooser}
        >
          Change plan
        </Button>
      </div>
      <Fold open={state.isChoosingPlan}>
        <PlanChooser
          state={state}
          onPick={onPick}
          onSwitch={onSwitch}
          onClose={onToggleChooser}
        />
      </Fold>
      {isPaid && (
        <div className='flex flex-col gap-3'>
          <div className='flex flex-wrap items-center justify-between gap-x-4 gap-y-2'>
            <p className='text-muted-foreground text-xs'>
              Prices are illustrative
            </p>
            <Button
              type='button'
              variant='ghost'
              size='sm'
              data-plan-end
              aria-expanded={endExpandedOf(
                state.isCancelling,
                state.isConfirmingCancel
              )}
              onClick={pressEnd}
              className={endLookOf(state.isCancelling, pressed)}
            >
              <AnimatedSize as='span' axis='width' contentClassName='flex'>
                <Swap swapKey={endLabel}>{endLabel}</Swap>
              </AnimatedSize>
            </Button>
          </div>
          <Fold open={state.isConfirmingCancel}>
            <CancelConfirm
              planName={plan.name}
              pressed={pressed}
              onKeep={onKeep}
              onConfirm={onConfirmCancel}
            />
          </Fold>
        </div>
      )}
    </section>
  );
}
