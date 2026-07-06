'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useId } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { pressedQuietOf } from '@/registry/ndeko/lib/demonstration';
import {
  ChevronDownIcon,
  HourglassIcon,
  KeyIcon,
} from '@/registry/ndeko/lib/icons';
import { rowPresenceOf } from '@/registry/ndeko/lib/motion-presets';
import { cn } from '@/registry/ndeko/lib/utils';
import { Avatar } from '@/registry/ndeko/ui/avatar';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Chip } from '@/registry/ndeko/ui/chip';

import {
  ENVIRONMENT_LABEL,
  IDLE_AFTER_DAYS,
  SCOPES,
  type ApiKey,
  type Environment,
} from './data';
import { HoldButton } from './hold-button';
import { maskedKeyOf } from './session';

export const MONEY_FORMAT: Intl.NumberFormatOptions = {
  style: 'currency',
  currency: 'USD',
};

const COUNT = new Intl.NumberFormat('en-US');

const ENVIRONMENT_COLOR: Record<Environment, string> = {
  live: 'var(--success)',
  test: 'var(--info)',
};

function isIdle(key: ApiKey) {
  if (key.idleDays === null) {
    return false;
  }
  return key.idleDays >= IDLE_AFTER_DAYS;
}

function controlsOf(isOpen: boolean, id: string) {
  if (isOpen) {
    return id;
  }
  return undefined;
}

function chevronTurnOf(isOpen: boolean) {
  if (isOpen) {
    return 'rotate-180';
  }
  return undefined;
}

function totalOf(values: number[]) {
  let total = 0;
  for (const value of values) {
    total += value;
  }
  return total;
}

function requestsLineOf(total: number) {
  if (total === 1) {
    return '1 request';
  }
  return `${COUNT.format(total)} requests`;
}

/** A day without requests keeps a sliver, so the fourteen days stay countable. */
const LOWEST_BAR_PERCENT = 6;

const BAR_STAGGER_MS = 18;

/** Each bar grows from the floor when the row opens, a beat after the one before it. */
function barStyleOf(count: number, highest: number, index: number) {
  const share = count / highest;
  const sharePercent = share * 100;
  const percent = Math.max(sharePercent, LOWEST_BAR_PERCENT);
  const delay = index * BAR_STAGGER_MS;
  return { height: `${percent}%`, transitionDelay: `${delay}ms` };
}

function UsageBars({ requests }: { requests: number[] }) {
  const highest = Math.max(...requests);
  const total = totalOf(requests);
  const hasRequests = highest > 0;
  const summary = `${requestsLineOf(total)} over the last 14 days, ${COUNT.format(highest)} on the busiest day`;

  if (!hasRequests) {
    return (
      <p className='bg-foreground/[0.03] text-muted-foreground flex h-10 items-center justify-center rounded-md text-xs'>
        No requests in the last 14 days
      </p>
    );
  }

  return (
    <div role='img' aria-label={summary} className='flex h-10 items-end gap-1'>
      {requests.map((count, index) => (
        <span
          key={`day-${index}`}
          style={barStyleOf(count, highest, index)}
          className='bg-primary w-full max-w-4 origin-bottom scale-y-100 rounded-t-[3px] transition-[scale] duration-300 ease-(--ease-out-strong) starting:scale-y-0'
        />
      ))}
    </div>
  );
}

type KeyDetailsProps = {
  apiKey: ApiKey;
  isDemoHolding: boolean;
  onRevoke: (id: string) => void;
};

function KeyDetails({ apiKey, isDemoHolding, onRevoke }: KeyDetailsProps) {
  const scopes = SCOPES[apiKey.access];
  const total = totalOf(apiKey.requests);
  const showsIdleNote = isIdle(apiKey);

  return (
    <div className='flex flex-col gap-4 px-4 pt-1 pb-4 @xl:ps-[3.75rem]'>
      <dl className='grid gap-x-6 gap-y-3 @xl:grid-cols-2'>
        <div className='flex flex-col gap-1.5'>
          <dt className='text-muted-foreground text-xs'>Scopes</dt>
          <dd className='flex flex-wrap gap-1'>
            {scopes.map((scope) => (
              <Badge
                key={scope}
                variant='secondary'
                className='font-mono text-[11px] font-normal'
              >
                {scope}
              </Badge>
            ))}
          </dd>
        </div>
        <div className='flex flex-col gap-1.5'>
          <dt className='text-muted-foreground text-xs'>Created</dt>
          <dd className='flex min-w-0 items-center gap-2 text-[13px]'>
            <Avatar seed={apiKey.createdBy} className='size-5' />
            <span className='truncate'>
              {apiKey.createdBy}, {apiKey.createdOn}
            </span>
          </dd>
        </div>
      </dl>
      <div className='flex flex-col gap-2'>
        <p className='text-muted-foreground flex items-baseline justify-between gap-3 text-xs'>
          <span>Requests, last 14 days</span>
          <span className='tabular-nums'>{requestsLineOf(total)}</span>
        </p>
        <UsageBars requests={apiKey.requests} />
      </div>
      {showsIdleNote && (
        <p className='text-warning-foreground text-xs text-pretty'>
          {`No request since ${apiKey.lastUsed}. If nothing needs it any more, revoke it.`}
        </p>
      )}
      <div className='flex flex-wrap items-center justify-between gap-x-4 gap-y-2'>
        <p className='text-muted-foreground min-w-0 flex-1 basis-48 text-xs text-pretty'>
          Apps that use this key stop working at once
        </p>
        <HoldButton
          label='Hold to revoke'
          hint={`Press and hold for two seconds to revoke ${apiKey.name}`}
          isDemoHolding={isDemoHolding}
          onComplete={() => onRevoke(apiKey.id)}
        />
      </div>
    </div>
  );
}

type KeyRowProps = {
  apiKey: ApiKey;
  isOpen: boolean;
  isPressed: boolean;
  isDemoHolding: boolean;
  onToggle: (id: string) => void;
  onRevoke: (id: string) => void;
};

function KeyRow({
  apiKey,
  isOpen,
  isPressed,
  isDemoHolding,
  onToggle,
  onRevoke,
}: KeyRowProps) {
  const detailsId = useId();
  const shouldReduceMotion = usePrefersReducedMotion();
  const presence = rowPresenceOf(shouldReduceMotion);
  const showsIdle = isIdle(apiKey);
  const spend = apiKey.spendCents / 100;
  const masked = maskedKeyOf(apiKey.environment, apiKey.tail);

  return (
    <div className='flex flex-col'>
      <button
        type='button'
        data-row-toggle={apiKey.id}
        aria-expanded={isOpen}
        aria-controls={controlsOf(isOpen, detailsId)}
        onClick={() => onToggle(apiKey.id)}
        className='hover:bg-foreground/[0.025] focus-visible:ring-ring/25 grid w-full cursor-pointer grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-x-3 px-4 py-3 text-start transition-colors duration-150 outline-none focus-visible:ring-[3px] focus-visible:ring-inset'
      >
        <span className='keycap-3d text-muted-foreground flex size-8 items-center justify-center rounded-lg'>
          <KeyIcon className='size-4' />
        </span>
        <span className='flex min-w-0 flex-col gap-1'>
          <span className='flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1'>
            <span className='min-w-0 truncate text-[13px] font-medium'>
              {apiKey.name}
            </span>
            <Chip color={ENVIRONMENT_COLOR[apiKey.environment]}>
              {ENVIRONMENT_LABEL[apiKey.environment]}
            </Chip>
            {showsIdle && (
              <Badge variant='warning'>
                <HourglassIcon />
                {`Idle for ${apiKey.idleDays} days`}
              </Badge>
            )}
          </span>
          <span className='text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs'>
            <code className='font-mono'>{masked}</code>
            <span aria-hidden='true'>·</span>
            <span>Created {apiKey.createdOn}</span>
            <span aria-hidden='true'>·</span>
            <span>Last used {apiKey.lastUsed}</span>
          </span>
        </span>
        <span className='flex items-center gap-2'>
          <span className='flex flex-col items-end'>
            <MotionNumber
              value={spend}
              format={MONEY_FORMAT}
              className='text-[13px] font-medium'
            />
            <span className='text-muted-foreground text-xs'>this month</span>
          </span>
          <span
            className={cn(
              'flex size-7 items-center justify-center rounded-md transition-[background-color,scale] duration-150 ease-(--ease-out-strong)',
              pressedQuietOf(isPressed)
            )}
          >
            <ChevronDownIcon
              className={cn(
                'text-muted-foreground size-4 transition-[rotate] duration-200 ease-(--ease-out-strong)',
                chevronTurnOf(isOpen)
              )}
            />
          </span>
        </span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key='details'
            id={detailsId}
            className='overflow-hidden'
            {...presence}
          >
            <KeyDetails
              apiKey={apiKey}
              isDemoHolding={isDemoHolding}
              onRevoke={onRevoke}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

type KeyListProps = {
  keys: ApiKey[];
  openId: string | null;
  pressed: string | null;
  /** The key whose Revoke the demonstration holds, while it plays. */
  demoHoldingId: string | null;
  onToggle: (id: string) => void;
  onRevoke: (id: string) => void;
};

/** A key made here grows in at the top; a revoked one folds away faster than it came. */
export function KeyList({
  keys,
  openId,
  pressed,
  demoHoldingId,
  onToggle,
  onRevoke,
}: KeyListProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const presence = rowPresenceOf(shouldReduceMotion);

  return (
    <ul className='hairline-divide-y divide-border flex flex-col'>
      <AnimatePresence initial={false}>
        {keys.map((apiKey) => (
          <motion.li key={apiKey.id} className='overflow-hidden' {...presence}>
            <KeyRow
              apiKey={apiKey}
              isOpen={openId === apiKey.id}
              isPressed={pressed === `row-${apiKey.id}`}
              isDemoHolding={demoHoldingId === apiKey.id}
              onToggle={onToggle}
              onRevoke={onRevoke}
            />
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}
