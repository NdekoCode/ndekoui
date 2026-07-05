'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

import { MotionNumber } from '@/components/core/motion-number';
import { WordRoll } from '@/components/core/word-roll';
import {
  ArrowLeftIcon,
  CheckIcon,
  CircleCheckIcon,
  CircleXIcon,
  EyeIcon,
  EyeOffIcon,
  LoaderIcon,
} from '@/registry/ndeko/lib/icons';
import { rowPresenceOf } from '@/registry/ndeko/lib/motion-presets';
import { cn } from '@/registry/ndeko/lib/utils';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Button } from '@/registry/ndeko/ui/button';
import { Fold, Swap } from '@/registry/ndeko/ui/chat-motion';
import { CopyButton } from '@/registry/ndeko/ui/copy-button';
import { MorphButton, type MorphState } from '@/registry/ndeko/ui/morph-button';

import type { Delivery, DeliveryStatus, Endpoint, HourBucket } from './data';
import { HEALTH_DOT, HEALTH_WORD, moveBetweenRows } from './endpoint-list';
import { codeVariantOf, codeWordOf, Inspector } from './inspector';
import {
  deliveriesOf,
  healthOf,
  hoursOf,
  totalsOf,
  type DayTotals,
  type WebhookAction,
  type WebhookState,
} from './session';

const RATE_FORMAT: Intl.NumberFormatOptions = {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
};

const HEALTH_WORDS = Object.values(HEALTH_WORD);

const SECRET_PREFIX = 'whsec_';

const SHOWN_TAIL = 4;

const RETRY_STATE: Record<DeliveryStatus, MorphState> = {
  failed: 'idle',
  pending: 'busy',
  done: 'done',
};

const RETRY_LABELS: Record<MorphState, string> = {
  idle: 'Retry',
  busy: 'Retrying',
  done: 'Delivered',
};

/** whsec_ and the last four characters stay readable, so two secrets can be told apart. */
function maskedOf(secret: string) {
  const tail = secret.slice(-SHOWN_TAIL);
  return `${SECRET_PREFIX}••••••••••••${tail}`;
}

function shownSecretOf(secret: string, isShown: boolean) {
  if (isShown) {
    return secret;
  }
  return maskedOf(secret);
}

function revealLabelOf(isShown: boolean) {
  if (isShown) {
    return 'Hide the signing secret';
  }
  return 'Show the signing secret';
}

function deliveredWordOf(totals: DayTotals) {
  const total = totals.ok + totals.failed;
  if (total === 0) {
    return 'No delivery in the last 24 hours';
  }
  if (totals.failed === 0) {
    return `${total} delivered, none failed`;
  }
  return `${total} sent, ${totals.failed} failed`;
}

function maxTotalOf(hours: HourBucket[]) {
  let max = 1;
  for (const bucket of hours) {
    max = Math.max(max, bucket.ok + bucket.failed);
  }
  return max;
}

function barStyleOf(bucket: HourBucket, max: number) {
  const total = bucket.ok + bucket.failed;
  const share = Math.max(0.06, total / max);
  return { transform: `scaleY(${share})` };
}

function barToneOf(bucket: HourBucket) {
  if (bucket.failed > 0) {
    return 'bg-destructive';
  }
  return 'bg-foreground/25';
}

function rowToneOf(isOpen: boolean) {
  if (isOpen) {
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

function pressedButtonOf(isPressed: boolean) {
  if (isPressed) {
    return 'scale-[0.94] bg-foreground/[0.07]';
  }
  return undefined;
}

/** A delivery shows the retry control while it fails or once it has been sent again. */
function showsRetry(delivery: Delivery) {
  const wasSentAgain = delivery.attempt > 1;
  const isSettled = delivery.status === 'done';
  return wasSentAgain || !isSettled;
}

type HourStripProps = {
  hours: HourBucket[];
  summary: string;
};

/** One bar per hour, as tall as its traffic; an hour with a failure takes the failure colour. */
function HourStrip({ hours, summary }: HourStripProps) {
  const max = maxTotalOf(hours);

  return (
    <div className='flex flex-col gap-1.5'>
      <div
        role='img'
        aria-label={`Deliveries per hour over 24 hours. ${summary}`}
        className='flex h-10 items-end gap-[3px]'
      >
        {hours.map((bucket, hour) => (
          <span
            key={hour}
            style={barStyleOf(bucket, max)}
            className={cn(
              'h-full min-w-0 flex-1 origin-bottom rounded-t-[2px] transition-[transform,background-color] duration-300 ease-(--ease-out-strong)',
              barToneOf(bucket)
            )}
          />
        ))}
      </div>
      <div
        aria-hidden='true'
        className='text-muted-foreground flex justify-between text-[11px]'
      >
        <span>24 h ago</span>
        <span>Now</span>
      </div>
    </div>
  );
}

function DeliveryMark({ status }: { status: DeliveryStatus }) {
  return (
    <Swap swapKey={status} className='size-4 shrink-0'>
      {status === 'done' && (
        <CircleCheckIcon className='text-success-foreground size-4' />
      )}
      {status === 'failed' && (
        <CircleXIcon className='text-destructive-ink size-4' />
      )}
      {status === 'pending' && (
        <LoaderIcon className='text-muted-foreground size-4 animate-spin' />
      )}
    </Swap>
  );
}

type DeliveryRowProps = {
  delivery: Delivery;
  isOpen: boolean;
  hasRetryColumn: boolean;
  pressed: string | null;
  onOpen: (id: string) => void;
  onRetry: (id: string) => void;
};

function DeliveryRow({
  delivery,
  isOpen,
  hasRetryColumn,
  pressed,
  onOpen,
  onRetry,
}: DeliveryRowProps) {
  const codeWord = codeWordOf(delivery);

  return (
    <div className='flex items-center gap-1.5'>
      <button
        type='button'
        data-row
        aria-expanded={isOpen}
        onClick={() => onOpen(delivery.id)}
        className={cn(
          'focus-visible:ring-ring/25 flex h-10 min-w-0 flex-1 cursor-pointer items-center gap-2.5 rounded-lg px-2 text-start transition-[background-color,scale] duration-150 outline-none focus-visible:ring-[3px] focus-visible:ring-inset',
          rowToneOf(isOpen),
          pressedQuietOf(pressed === `delivery-${delivery.id}`)
        )}
      >
        <DeliveryMark status={delivery.status} />
        <code className='min-w-0 flex-1 truncate font-mono text-xs'>
          {delivery.event}
        </code>
        <Badge
          variant={codeVariantOf(delivery.status)}
          className='tabular-nums transition-colors duration-300'
        >
          <Swap swapKey={codeWord}>{codeWord}</Swap>
        </Badge>
        <span className='text-muted-foreground hidden w-16 shrink-0 text-end text-xs tabular-nums @sm:block'>
          {delivery.time}
        </span>
      </button>
      {hasRetryColumn && (
        <span className='flex w-[5.5rem] shrink-0 justify-end'>
          {showsRetry(delivery) && (
            <MorphButton
              type='button'
              size='sm'
              variant='outline'
              state={RETRY_STATE[delivery.status]}
              labels={RETRY_LABELS}
              onClick={() => onRetry(delivery.id)}
              className={pressedButtonOf(pressed === `retry-${delivery.id}`)}
            />
          )}
        </span>
      )}
    </div>
  );
}

type SecretRowProps = {
  endpoint: Endpoint;
  state: WebhookState;
  onAction: (action: WebhookAction) => void;
};

function SecretRow({ endpoint, state, onAction }: SecretRowProps) {
  const isShown = state.isSecretShown;
  const isAsking = state.rotate === 'asking';
  const isRotated = state.rotate === 'rotated';
  const shownSecret = shownSecretOf(endpoint.secret, isShown);

  return (
    <div className='flex flex-col gap-2'>
      <h3 className='text-muted-foreground text-xs'>Signing secret</h3>
      <div className='flex items-center gap-1'>
        <code className='bg-foreground/[0.04] dark:bg-foreground/[0.06] h-8 min-w-0 flex-1 truncate rounded-md px-2.5 font-mono text-xs leading-8'>
          {shownSecret}
        </code>
        <Button
          type='button'
          variant='ghost'
          size='icon'
          aria-pressed={isShown}
          aria-label={revealLabelOf(isShown)}
          onClick={() => onAction({ type: 'secretToggled' })}
          className='text-muted-foreground'
        >
          <Swap swapKey={String(isShown)}>
            {isShown && <EyeOffIcon />}
            {!isShown && <EyeIcon />}
          </Swap>
        </Button>
        <Button
          type='button'
          variant='outline'
          aria-expanded={isAsking}
          disabled={isRotated}
          onClick={() => onAction({ type: 'rotateAsked' })}
        >
          Rotate
        </Button>
      </div>
      <Fold open={isAsking}>
        <div className='bg-destructive/10 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg p-2.5'>
          <p className='min-w-48 flex-1 text-xs leading-5'>
            Rotate the secret? Deliveries signed with the old one are refused
            from that moment.
          </p>
          <div className='flex items-center gap-2'>
            <Button
              type='button'
              size='sm'
              variant='destructive'
              onClick={() => onAction({ type: 'rotated' })}
            >
              Rotate secret
            </Button>
            <Button
              type='button'
              size='sm'
              variant='ghost'
              onClick={() => onAction({ type: 'rotateCancelled' })}
            >
              Keep it
            </Button>
          </div>
        </div>
      </Fold>
      <Fold open={isRotated}>
        <div className='bg-foreground/[0.03] dark:bg-foreground/[0.05] flex flex-col gap-2.5 rounded-lg p-2.5'>
          <p className='flex items-center gap-1.5 text-xs'>
            <CheckIcon className='text-success-foreground size-3.5 shrink-0' />
            New secret, shown once. Copy it before you close this
          </p>
          <div className='bg-card hairline-ring ring-foreground/12 dark:bg-foreground/[0.04] flex h-8 items-center gap-1 rounded-md ps-2.5 pe-1'>
            <code className='min-w-0 flex-1 truncate font-mono text-xs'>
              {endpoint.secret}
            </code>
            <CopyButton
              text={endpoint.secret}
              label='Copy the new signing secret'
            />
          </div>
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={() => onAction({ type: 'rotateDone' })}
            className='self-end'
          >
            Done
          </Button>
        </div>
      </Fold>
    </div>
  );
}

export type EndpointDetailProps = {
  endpoint: Endpoint;
  state: WebhookState;
  pressed: string | null;
  onAction: (action: WebhookAction) => void;
  onBack: () => void;
  onRetry: (id: string) => void;
};

export function EndpointDetail({
  endpoint,
  state,
  pressed,
  onAction,
  onBack,
  onRetry,
}: EndpointDetailProps) {
  const shouldReduceMotion = useReducedMotion();
  const rowPresence = rowPresenceOf(shouldReduceMotion);
  const health = healthOf(state, endpoint.id);
  const hours = hoursOf(state, endpoint);
  const totals = totalsOf(hours);
  const deliveries = deliveriesOf(state, endpoint.id);
  const hasDeliveries = deliveries.length > 0;
  const hasRetryColumn = deliveries.some(showsRetry);
  const summary = deliveredWordOf(totals);
  const openDelivery = deliveries.find(
    (delivery) => delivery.id === state.openDeliveryId
  );

  return (
    <section
      aria-label='Endpoint'
      className='flex flex-col gap-4 transition-opacity duration-200 starting:opacity-0'
    >
      <Button
        type='button'
        variant='ghost'
        size='sm'
        data-back
        onClick={onBack}
        className={cn(
          'text-muted-foreground -ms-2 self-start @4xl:hidden',
          pressedButtonOf(pressed === 'back')
        )}
      >
        <ArrowLeftIcon />
        Endpoints
      </Button>

      <div className='bg-card hairline-ring ring-border dark:bg-foreground/[0.03] flex flex-col gap-5 rounded-xl p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
        <header className='flex flex-col gap-1.5'>
          <p className='flex items-center gap-2 text-xs'>
            <span
              aria-hidden='true'
              className={cn(
                'size-2 shrink-0 rounded-full transition-colors duration-300',
                HEALTH_DOT[health]
              )}
            />
            <WordRoll text={HEALTH_WORD[health]} labels={HEALTH_WORDS} />
          </p>
          <h2 className='font-mono text-[13px] font-medium break-all'>
            {endpoint.url}
          </h2>
        </header>

        <div className='flex flex-col gap-3'>
          <div className='flex flex-wrap items-baseline gap-x-2.5 gap-y-1'>
            <MotionNumber
              value={totals.rate}
              format={RATE_FORMAT}
              suffix='%'
              className='text-2xl leading-8 font-semibold'
            />
            <span className='text-muted-foreground text-xs'>
              answered with a success in 24 hours
            </span>
            <Badge variant='secondary' className='ms-auto'>
              Illustrative
            </Badge>
          </div>
          <HourStrip hours={hours} summary={summary} />
          <p className='text-muted-foreground text-xs tabular-nums'>
            {summary}
          </p>
        </div>

        <SecretRow endpoint={endpoint} state={state} onAction={onAction} />

        <div className='flex flex-col gap-2'>
          <h3 className='text-muted-foreground text-xs'>Recent deliveries</h3>
          {!hasDeliveries && (
            <p className='text-muted-foreground text-[13px]'>
              Nothing was sent here yet. The first event shows up in this list.
            </p>
          )}
          <ul className='-mx-2 flex flex-col' onKeyDown={moveBetweenRows}>
            {deliveries.map((delivery) => (
              <li key={delivery.id}>
                <DeliveryRow
                  delivery={delivery}
                  isOpen={state.openDeliveryId === delivery.id}
                  hasRetryColumn={hasRetryColumn}
                  pressed={pressed}
                  onOpen={(id) => onAction({ type: 'deliveryOpened', id })}
                  onRetry={onRetry}
                />
              </li>
            ))}
          </ul>
          <AnimatePresence initial={false}>
            {openDelivery && (
              <motion.div
                key='inspector'
                className='overflow-hidden'
                {...rowPresence}
              >
                <Inspector
                  delivery={openDelivery}
                  tab={state.tab}
                  onTabChange={(tab) => onAction({ type: 'tab', tab })}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
