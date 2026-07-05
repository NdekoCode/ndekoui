'use client';

import { useLayoutEffect, useRef } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { seriesColorOf } from '@/registry/ndeko/lib/agent-run';
import {
  CheckIcon,
  LockIcon,
  MousePointerIcon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Badge } from '@/registry/ndeko/ui/badge';
import { LetterTile } from '@/registry/ndeko/ui/letter-tile';
import { StatusOrb } from '@/registry/ndeko/ui/status-orb';

import {
  ADDON_PRICE,
  DOMAINS,
  formatPrice,
  OPERATOR,
  PAGE_URL,
  PRICE_FORMAT,
  SITE,
  totalOf,
  type Period,
  type PointerTarget,
} from './data';
import type { Frame } from './session';

const DRAWN_BUTTON =
  'bg-primary text-primary-foreground inline-flex h-7 items-center rounded-full px-3 font-medium';

type FormHandlers = {
  /** True while the person has the controls of the live frame. */
  canAct: boolean;
  isAddonPressed: boolean;
  onToggleAddon: () => void;
  onPeriodChange: (period: Period) => void;
};

function ListPage() {
  return (
    <div className='flex flex-col gap-3'>
      <h3 className='text-sm font-semibold'>Domains</h3>
      <ul className='flex flex-col'>
        {DOMAINS.map((domain) => (
          <li
            key={domain.name}
            data-target={targetOfDomain(domain.isDue)}
            className='odd:bg-foreground/[0.03] flex h-9 items-center justify-between gap-2 rounded-md px-2'
          >
            <span className='truncate font-medium'>{domain.name}</span>
            {domain.isDue && <Badge variant='warning'>{domain.note}</Badge>}
            {!domain.isDue && (
              <span className='text-muted-foreground'>{domain.note}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function targetOfDomain(isDue: boolean): PointerTarget | undefined {
  if (isDue) {
    return 'row';
  }
  return undefined;
}

function DomainPage() {
  return (
    <div className='flex flex-col items-start gap-3'>
      <h3 className='text-sm font-semibold'>tallis.example</h3>
      <p className='text-muted-foreground'>
        Registered until 12 November 2026. Renewal is not automatic.
      </p>
      <span data-target='renew' className={DRAWN_BUTTON}>
        Renew
      </span>
    </div>
  );
}

function periodToneOf(isSelected: boolean) {
  if (isSelected) {
    return 'bg-card hairline-ring ring-foreground/15 shadow-[0_1px_2px_rgb(0_0_0/0.06)] dark:bg-foreground/[0.1]';
  }
  return 'text-muted-foreground';
}

function boxToneOf(isChecked: boolean) {
  if (isChecked) {
    return 'bg-primary text-primary-foreground';
  }
  return 'hairline-ring ring-foreground/30';
}

function pressedOf(isPressed: boolean) {
  if (isPressed) {
    return 'scale-[0.96] bg-foreground/[0.08]';
  }
  return undefined;
}

const PERIODS: { period: Period; label: string }[] = [
  { period: 1, label: '1 year' },
  { period: 2, label: '2 years' },
];

function RenewPage({
  frame,
  canAct,
  isAddonPressed,
  onToggleAddon,
  onPeriodChange,
}: FormHandlers & { frame: Frame }) {
  const total = totalOf(frame.period, frame.hasAddon);

  return (
    <div className='flex flex-col gap-3'>
      <h3 className='text-sm font-semibold'>Renew tallis.example</h3>
      <div
        role='group'
        aria-label='Period'
        data-target='period'
        className='bg-foreground/[0.05] flex w-fit gap-0.5 rounded-lg p-0.5'
      >
        {PERIODS.map((option) => (
          <button
            key={option.period}
            type='button'
            aria-pressed={frame.period === option.period}
            disabled={!canAct}
            onClick={() => onPeriodChange(option.period)}
            className={cn(
              'focus-visible:ring-ring/25 h-6 rounded-md px-2.5 transition-colors duration-150 outline-none focus-visible:ring-[3px] enabled:cursor-pointer',
              periodToneOf(frame.period === option.period)
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
      <button
        type='button'
        role='checkbox'
        aria-checked={frame.hasAddon}
        disabled={!canAct}
        onClick={onToggleAddon}
        className={cn(
          'focus-visible:ring-ring/25 enabled:hover:bg-foreground/[0.04] -mx-1.5 flex h-8 w-fit items-center gap-2 rounded-md px-1.5 transition-[background-color,scale] duration-150 outline-none focus-visible:ring-[3px] enabled:cursor-pointer',
          pressedOf(isAddonPressed)
        )}
      >
        <span
          className={cn(
            'flex size-4 items-center justify-center rounded-[5px] transition-colors duration-150',
            boxToneOf(frame.hasAddon)
          )}
        >
          {frame.hasAddon && <CheckIcon className='size-3' strokeWidth={2.5} />}
        </span>
        Privacy protection, {formatPrice(ADDON_PRICE)} a year
      </button>
      <div className='flex items-end justify-between gap-3'>
        <div className='flex flex-col'>
          <span className='text-muted-foreground'>Total, illustrative</span>
          <MotionNumber
            value={total}
            locale='en-IE'
            format={PRICE_FORMAT}
            className='text-2xl leading-none font-semibold'
          />
        </div>
        <span data-target='pay' className={DRAWN_BUTTON}>
          Pay
        </span>
      </div>
    </div>
  );
}

function DonePage() {
  return (
    <div className='m-auto flex flex-col items-center gap-3 text-center'>
      <StatusOrb tone='success' />
      <h3 className='text-sm font-semibold'>Renewed until 12 November 2027</h3>
      <p className='text-muted-foreground'>
        A receipt was sent to the account email.
      </p>
    </div>
  );
}

function waitingToneOf(isWaiting: boolean) {
  if (isWaiting) {
    return 'opacity-40';
  }
  return 'opacity-100';
}

function pointerWordOf(isWaiting: boolean) {
  if (isWaiting) {
    return `${OPERATOR.name} waits`;
  }
  return OPERATOR.name;
}

type BrowserFrameProps = FormHandlers & {
  frame: Frame;
  /** The agent's pointer dims while it waits for the person. */
  isAgentWaiting: boolean;
};

export function BrowserFrame({
  frame,
  isAgentWaiting,
  ...form
}: BrowserFrameProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef<HTMLSpanElement>(null);
  const gemStyle = {
    '--gem': seriesColorOf(OPERATOR.series),
  } as React.CSSProperties;
  const pointerStyle = { color: seriesColorOf(OPERATOR.series) };
  const target = frame.pointer;
  const frameId = frame.id;

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const pointer = pointerRef.current;
    if (!viewport || !pointer) {
      return;
    }
    const place = () => {
      const element = viewport.querySelector(`[data-target='${target}']`);
      if (!element) {
        pointer.style.opacity = '0';
        return;
      }
      const bounds = viewport.getBoundingClientRect();
      const box = element.getBoundingClientRect();
      const x = box.left - bounds.left + box.width * 0.6;
      const y = box.top - bounds.top + box.height * 0.55;
      pointer.style.translate = `${x}px ${y}px`;
      pointer.style.opacity = '';
    };
    place();
    const observer = new ResizeObserver(place);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [target, frameId]);

  return (
    <div className='bg-card hairline-ring ring-border dark:bg-foreground/[0.03] overflow-hidden rounded-xl shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
      <div className='bg-foreground/[0.03] flex h-10 items-center gap-2 px-3'>
        <LetterTile initial={SITE.initial} />
        <div className='bg-card dark:bg-foreground/[0.05] flex h-6 min-w-0 flex-1 items-center gap-1.5 rounded-full px-2.5 text-xs'>
          <LockIcon className='text-muted-foreground size-3 shrink-0' />
          <span className='truncate'>{PAGE_URL[frame.page]}</span>
        </div>
      </div>
      <div
        ref={viewportRef}
        aria-label={`Controlled browser, ${SITE.name}`}
        className='relative flex min-h-[15.5rem] flex-col overflow-hidden p-4 text-xs'
      >
        {frame.page === 'blank' && (
          <p className='text-muted-foreground m-auto'>Opening the browser</p>
        )}
        {frame.page === 'list' && <ListPage />}
        {frame.page === 'domain' && <DomainPage />}
        {frame.page === 'renew' && <RenewPage frame={frame} {...form} />}
        {frame.page === 'done' && <DonePage />}
        <span
          ref={pointerRef}
          aria-hidden='true'
          className={cn(
            'pointer-events-none absolute top-0 left-0 flex items-start transition-[translate,opacity] duration-500 ease-(--ease-in-out-strong) motion-reduce:transition-none',
            waitingToneOf(isAgentWaiting)
          )}
        >
          <MousePointerIcon
            style={pointerStyle}
            className='size-4 fill-current'
          />
          <span
            style={gemStyle}
            className='gem-plate mt-3 rounded-full px-1.5 py-0.5 text-[10px] font-medium whitespace-nowrap'
          >
            {pointerWordOf(isAgentWaiting)}
          </span>
        </span>
      </div>
    </div>
  );
}
