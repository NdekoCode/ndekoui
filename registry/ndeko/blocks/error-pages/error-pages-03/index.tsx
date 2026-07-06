'use client';

import { useEffect, useId } from 'react';

import { useKeptHeight } from '@/registry/ndeko/hooks/use-kept-height';
import { useSession } from '@/registry/ndeko/hooks/use-session';
import { spokenUnless } from '@/registry/ndeko/lib/demonstration';
import { ArrowUpRightIcon } from '@/registry/ndeko/lib/icons';
import { FOCUS_RING } from '@/registry/ndeko/lib/recipes';
import { cn } from '@/registry/ndeko/lib/utils';
import { Badge } from '@/registry/ndeko/ui/badge';
import { CompanyMark } from '@/registry/ndeko/ui/company-mark';
import { ClockGate } from '@/registry/ndeko/ui/live-duration';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';
import { Wash } from '@/registry/ndeko/ui/wash';

import {
  SERVICES,
  SITE,
  type AffectedService,
  type ServiceStatus,
} from './data';
import { MaintenanceClock } from './maintenance-clock';
import { NotifyForm } from './notify-form';
import {
  errorOf,
  INITIAL,
  LOOP_AFTER_MS,
  reducer,
  RESTING,
  SAVE_MS,
  SCRIPT,
} from './session';

const SESSION = {
  reducer,
  initial: INITIAL,
  resting: RESTING,
  script: SCRIPT,
  loopAfter: LOOP_AFTER_MS,
};

const STATUS_LABEL: Record<ServiceStatus, string> = {
  paused: 'Paused',
  readOnly: 'Read only',
  working: 'Working',
};

const STATUS_VARIANT: Record<ServiceStatus, 'warning' | 'info' | 'success'> = {
  paused: 'warning',
  readOnly: 'info',
  working: 'success',
};

const CARD =
  'bg-card hairline-ring ring-border dark:bg-foreground/[0.03] rounded-xl shadow-[0_1px_2px_rgb(0_0_0/0.04)]';

function ServiceRow({ service }: { service: AffectedService }) {
  return (
    <li className='flex items-center gap-3 rounded-lg px-3 py-2.5'>
      <div className='flex min-w-0 flex-1 flex-col'>
        <p className='text-[13px] font-medium'>{service.name}</p>
        <p className='text-muted-foreground text-xs text-pretty'>
          {service.note}
        </p>
      </div>
      <Badge variant={STATUS_VARIANT[service.status]}>
        {STATUS_LABEL[service.status]}
      </Badge>
    </li>
  );
}

export default function ErrorPages03() {
  const {
    ref,
    isInView,
    isAutoplaying,
    state,
    act,
    pressed,
    isFinished,
    restart,
  } = useSession(SESSION);
  const affectedId = useId();
  const isSaving = state.status === 'saving';
  const message = spokenUnless(isAutoplaying, state.spoken);
  const canReplay = isFinished && !isAutoplaying;
  useKeptHeight(ref);

  function focusLater(selector: string) {
    requestAnimationFrame(() => {
      const target = ref.current?.querySelector<HTMLElement>(selector);
      target?.focus();
    });
  }

  /** The address is saved on its own once sent. A focus held by the form follows it to the message. */
  useEffect(() => {
    if (!isSaving) {
      return;
    }
    const timer = setTimeout(() => {
      const form = ref.current?.querySelector('form');
      const active = document.activeElement;
      const hadFocus = form?.contains(active) ?? false;
      act({ type: 'saved' });
      if (!hadFocus) {
        return;
      }
      requestAnimationFrame(() => {
        const done =
          ref.current?.querySelector<HTMLElement>('[data-notify-done]');
        done?.focus();
      });
    }, SAVE_MS);
    return () => clearTimeout(timer);
  }, [isSaving, act, ref]);

  /** A refused address sends the person back to the field, where the reason is read with it. */
  function submit() {
    const isRefused = errorOf(state.email) !== null;
    act({ type: 'submitted' });
    if (isRefused) {
      focusLater('[data-notify-field]');
    }
  }

  function edit() {
    act({ type: 'edited' });
    focusLater('[data-notify-field]');
  }

  return (
    <ClockGate isActive={isInView}>
      <div
        ref={ref}
        className='bg-background text-foreground @container flex min-h-dvh w-full flex-col'
      >
        <header className='flex min-h-16 items-center gap-3 px-4 @2xl:px-8'>
          <a
            href={SITE.homeHref}
            className={cn(
              'flex items-center gap-2 rounded-md text-sm font-semibold',
              FOCUS_RING
            )}
          >
            <CompanyMark seed={SITE.name} size='lg' />
            {SITE.name}
          </a>
          <span className='flex-1' />
          <ReplayButton isShown={canReplay} onReplay={restart} label='Replay' />
        </header>

        <main className='flex flex-1 flex-col items-center px-4 pt-4 pb-16 @2xl:pt-10'>
          <div className='flex w-full max-w-xl flex-col gap-6'>
            <div className='flex flex-col gap-3'>
              <p className='text-info-foreground flex items-center gap-2 text-xs font-medium'>
                <span
                  aria-hidden='true'
                  className={cn(
                    'bg-info size-2 animate-pulse rounded-full',
                    !isInView && '[animation-play-state:paused]!'
                  )}
                />
                Maintenance in progress
              </p>
              <h1 className='text-2xl font-semibold text-balance @sm:text-3xl'>
                We are moving Quayside to a faster database
              </h1>
              <p className='text-muted-foreground text-sm text-pretty'>
                Booking is paused while every clinic calendar is copied and
                checked. Nothing is lost, and reminders still go out on time.
              </p>
            </div>

            <section
              aria-label='Time left'
              className={cn(CARD, 'relative isolate p-5')}
            >
              <Wash color='var(--info)' />
              <MaintenanceClock />
            </section>

            <section
              aria-labelledby={affectedId}
              className='flex flex-col gap-2'
            >
              <div className='flex items-baseline justify-between gap-3 px-1'>
                <h2 id={affectedId} className='text-[13px] font-medium'>
                  What is affected
                </h2>
                <a
                  href={SITE.statusHref}
                  target='_blank'
                  rel='noreferrer'
                  className={cn(
                    'text-primary-ink inline-flex items-center gap-1 rounded-sm text-xs font-medium underline-offset-4 hover:underline',
                    FOCUS_RING
                  )}
                >
                  Status page
                  <ArrowUpRightIcon className='size-3.5' />
                </a>
              </div>
              <ul className={cn(CARD, 'flex flex-col p-1')}>
                {SERVICES.map((service) => (
                  <ServiceRow key={service.id} service={service} />
                ))}
              </ul>
            </section>

            <section aria-label='Notify me' className={cn(CARD, 'p-5')}>
              <NotifyForm
                state={state}
                pressed={pressed}
                onType={(value) => act({ type: 'typed', value })}
                onSubmit={submit}
                onEdit={edit}
              />
            </section>
          </div>
        </main>
        <LiveRegion message={message} />
      </div>
    </ClockGate>
  );
}
