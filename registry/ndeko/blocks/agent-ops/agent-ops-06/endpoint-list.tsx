'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useId } from 'react';

import { CheckIcon, PlusIcon } from '@/registry/ndeko/lib/icons';
import { rowPresenceOf } from '@/registry/ndeko/lib/motion-presets';
import { cn } from '@/registry/ndeko/lib/utils';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Button } from '@/registry/ndeko/ui/button';
import { Fold } from '@/registry/ndeko/ui/chat-motion';
import { CopyButton } from '@/registry/ndeko/ui/copy-button';
import { Input } from '@/registry/ndeko/ui/input';
import { Label } from '@/registry/ndeko/ui/label';
import { Toggle } from '@/registry/ndeko/ui/toggle';

import { EVENT_NAMES, type Endpoint, type EventName } from './data';
import {
  healthOf,
  hoursOf,
  totalsOf,
  type FormState,
  type Health,
  type WebhookAction,
  type WebhookState,
} from './session';

const RATE_FORMAT = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export const HEALTH_WORD: Record<Health, string> = {
  healthy: 'Healthy',
  retrying: 'Retrying',
  failing: 'Failing',
};

/** Retrying is the one live state, so it is the one that breathes. */
export const HEALTH_DOT: Record<Health, string> = {
  healthy: 'bg-success',
  retrying: 'bg-info animate-pulse',
  failing: 'bg-destructive',
};

export function rateTextOf(rate: number) {
  return `${RATE_FORMAT.format(rate)}%`;
}

export function shortUrlOf(url: string) {
  return url.replace('https://', '');
}

function rowToneOf(isSelected: boolean) {
  if (isSelected) {
    return 'bg-foreground/[0.05]';
  }
  return 'hover:bg-foreground/[0.03]';
}

function pressedQuietOf(isPressed: boolean) {
  if (isPressed) {
    return 'scale-[0.985] bg-foreground/[0.07]';
  }
  return undefined;
}

function pressedSolidOf(isPressed: boolean) {
  if (isPressed) {
    return 'scale-[0.94] bg-primary/85';
  }
  return undefined;
}

/** The arrow keys walk the rows of a list. */
export function moveBetweenRows(event: React.KeyboardEvent<HTMLElement>) {
  const isDown = event.key === 'ArrowDown';
  const isUp = event.key === 'ArrowUp';
  if (!isDown && !isUp) {
    return;
  }
  const found = event.currentTarget.querySelectorAll<HTMLElement>('[data-row]');
  const rows = Array.from(found);
  const current = rows.findIndex((row) => row === document.activeElement);
  if (current === -1) {
    return;
  }
  let next = current - 1;
  if (isDown) {
    next = current + 1;
  }
  const target = rows[next];
  if (target) {
    event.preventDefault();
    target.focus();
  }
}

type EndpointRowProps = {
  endpoint: Endpoint;
  state: WebhookState;
  isPressed: boolean;
  onSelect: (id: string) => void;
};

function EndpointRow({
  endpoint,
  state,
  isPressed,
  onSelect,
}: EndpointRowProps) {
  const health = healthOf(state, endpoint.id);
  const hours = hoursOf(state, endpoint);
  const totals = totalsOf(hours);
  const hasTraffic = totals.ok + totals.failed > 0;
  const isSelected = state.selectedId === endpoint.id;
  const shortUrl = shortUrlOf(endpoint.url);

  return (
    <button
      type='button'
      data-row
      data-endpoint={endpoint.id}
      aria-pressed={isSelected}
      onClick={() => onSelect(endpoint.id)}
      className={cn(
        'focus-visible:ring-ring/25 flex w-full cursor-pointer flex-col gap-2 rounded-lg px-2.5 py-2.5 text-start transition-[background-color,scale] duration-150 outline-none focus-visible:ring-[3px] focus-visible:ring-inset',
        rowToneOf(isSelected),
        pressedQuietOf(isPressed)
      )}
    >
      <span className='flex items-center gap-2'>
        <span
          aria-hidden='true'
          className={cn(
            'size-2 shrink-0 rounded-full transition-colors duration-300',
            HEALTH_DOT[health]
          )}
        />
        <code className='min-w-0 flex-1 truncate font-mono text-xs'>
          {shortUrl}
        </code>
        <span className='sr-only'>{HEALTH_WORD[health]}</span>
        {hasTraffic && (
          <span className='text-muted-foreground shrink-0 text-xs tabular-nums'>
            {rateTextOf(totals.rate)}
          </span>
        )}
        {!hasTraffic && (
          <span className='text-muted-foreground shrink-0 text-xs'>
            No delivery yet
          </span>
        )}
      </span>
      <span className='flex flex-wrap gap-1 ps-4'>
        {endpoint.events.map((event) => (
          <Badge
            key={event}
            variant='secondary'
            className='font-mono text-[11px]'
          >
            {event}
          </Badge>
        ))}
      </span>
    </button>
  );
}

type EndpointFormProps = {
  form: FormState;
  pressed: string | null;
  onAction: (action: WebhookAction) => void;
  onClose: () => void;
};

function EndpointForm({ form, pressed, onAction, onClose }: EndpointFormProps) {
  const urlId = useId();
  const errorId = useId();
  const hasError = form.error !== null;

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onAction({ type: 'created' });
  }

  function toggle(event: EventName) {
    onAction({ type: 'eventToggled', event });
  }

  return (
    <form noValidate onSubmit={submit} className='flex flex-col gap-3'>
      <div className='flex flex-col gap-1.5'>
        <Label htmlFor={urlId}>Endpoint URL</Label>
        <Input
          id={urlId}
          data-form-first
          type='url'
          inputMode='url'
          autoComplete='off'
          autoCapitalize='off'
          spellCheck={false}
          placeholder='https://example.com/hooks'
          value={form.url}
          aria-invalid={hasError}
          aria-describedby={errorId}
          onChange={(event) =>
            onAction({ type: 'urlTyped', text: event.target.value })
          }
          className='font-mono'
        />
      </div>
      <div className='flex flex-col gap-1.5'>
        <span className='text-[13px] leading-none font-medium'>Events</span>
        <div role='group' aria-label='Events' className='flex flex-wrap gap-1'>
          {EVENT_NAMES.map((event) => {
            const isOn = form.events.includes(event);
            return (
              <Toggle
                key={event}
                size='sm'
                variant='outline'
                pressed={isOn}
                onPressedChange={() => toggle(event)}
                className='gap-1 rounded-full px-2.5 font-mono text-xs'
              >
                {isOn && <CheckIcon className='size-3' />}
                {event}
              </Toggle>
            );
          })}
        </div>
      </div>
      <p id={errorId} aria-live='polite' className='empty:hidden'>
        {hasError && (
          <span className='text-destructive-ink text-xs'>{form.error}</span>
        )}
      </p>
      <div className='flex items-center justify-end gap-2'>
        <Button type='button' variant='ghost' size='sm' onClick={onClose}>
          Cancel
        </Button>
        <Button
          type='submit'
          size='sm'
          className={pressedSolidOf(pressed === 'create')}
        >
          Create endpoint
        </Button>
      </div>
    </form>
  );
}

type CreatedNoticeProps = {
  secret: string;
  onDone: () => void;
};

/** The one time the secret of a new endpoint is on screen. */
function CreatedNotice({ secret, onDone }: CreatedNoticeProps) {
  return (
    <div className='flex flex-col gap-2.5 transition-opacity duration-300 starting:opacity-0'>
      <p className='flex items-center gap-1.5 text-[13px] font-medium'>
        <CheckIcon className='text-success-foreground size-4 shrink-0' />
        Endpoint created
      </p>
      <p className='text-muted-foreground text-xs'>
        Its signing secret is shown once. Copy it before you close this.
      </p>
      <div className='bg-card hairline-ring ring-foreground/12 dark:bg-foreground/[0.04] flex h-8 items-center gap-1 rounded-md ps-2.5 pe-1'>
        <code className='min-w-0 flex-1 truncate font-mono text-xs'>
          {secret}
        </code>
        <CopyButton text={secret} label='Copy the signing secret' />
      </div>
      <Button
        type='button'
        variant='outline'
        size='sm'
        onClick={onDone}
        className='self-end'
      >
        Done
      </Button>
    </div>
  );
}

export type EndpointListProps = {
  state: WebhookState;
  pressed: string | null;
  onAction: (action: WebhookAction) => void;
  onSelect: (id: string) => void;
  onOpenForm: () => void;
  onCloseForm: () => void;
};

export function EndpointList({
  state,
  pressed,
  onAction,
  onSelect,
  onOpenForm,
  onCloseForm,
}: EndpointListProps) {
  const shouldReduceMotion = useReducedMotion();
  const rowPresence = rowPresenceOf(shouldReduceMotion);
  const form = state.form;
  const isFormOpen = form.phase !== 'closed';
  let createdSecret: string | null = null;
  if (form.phase === 'created') {
    createdSecret = form.secret;
  }

  return (
    <section aria-label='Endpoints' className='flex flex-col gap-3'>
      <header className='flex flex-wrap items-center gap-x-3 gap-y-2'>
        <div className='flex min-w-0 flex-1 flex-col gap-0.5'>
          <h1 className='text-lg font-semibold text-balance'>Webhooks</h1>
          <p className='text-muted-foreground text-xs'>
            Where agent events are sent
          </p>
        </div>
        <Button
          type='button'
          size='sm'
          data-add-endpoint
          aria-expanded={isFormOpen}
          disabled={isFormOpen}
          onClick={onOpenForm}
          className={pressedSolidOf(pressed === 'add')}
        >
          <PlusIcon />
          Add endpoint
        </Button>
      </header>

      <Fold open={isFormOpen}>
        <div className='bg-foreground/[0.03] dark:bg-foreground/[0.05] rounded-xl p-3'>
          {createdSecret === null && (
            <EndpointForm
              form={form}
              pressed={pressed}
              onAction={onAction}
              onClose={onCloseForm}
            />
          )}
          {createdSecret !== null && (
            <CreatedNotice secret={createdSecret} onDone={onCloseForm} />
          )}
        </div>
      </Fold>

      <div className='bg-card hairline-ring ring-border dark:bg-foreground/[0.03] rounded-xl p-1 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
        <ul className='flex flex-col gap-0.5' onKeyDown={moveBetweenRows}>
          <AnimatePresence initial={false}>
            {state.endpoints.map((endpoint) => (
              <motion.li
                key={endpoint.id}
                className='overflow-hidden'
                {...rowPresence}
              >
                <EndpointRow
                  endpoint={endpoint}
                  state={state}
                  isPressed={pressed === `endpoint-${endpoint.id}`}
                  onSelect={onSelect}
                />
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      </div>
    </section>
  );
}
