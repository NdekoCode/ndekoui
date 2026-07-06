'use client';

import { useId, useRef, useState } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import type { AutoplayStep } from '@/registry/ndeko/hooks/use-autoplay';
import { useTimeouts } from '@/registry/ndeko/hooks/use-timeouts';
import {
  hold,
  PRESS_LEAD_MS,
  pressedQuietOf,
  pressedSolidOf,
  spokenUnless,
  usePress,
} from '@/registry/ndeko/lib/demonstration';
import { CheckIcon, PencilIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Button } from '@/registry/ndeko/ui/button';
import { Swap } from '@/registry/ndeko/ui/chat-motion';
import { Checkbox } from '@/registry/ndeko/ui/checkbox';
import { CompanyMark } from '@/registry/ndeko/ui/company-mark';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { MorphButton, type MorphState } from '@/registry/ndeko/ui/morph-button';

import { SampleNote } from './_parts/sample-note';
import { TearLine, TICKET_OUTLINE, ticketMaskOf } from './_parts/ticket';
import { useCardDemo } from './_parts/use-card-demo';

export type ReceiptService = {
  id: string;
  name: string;
  detail: string;
  price: number;
};

/** A receipt is a draft until Start project is pressed, and confirmed once the start went through. */
export type ReceiptStatus = 'draft' | 'starting' | 'confirmed';

const HEAD_MASK = ticketMaskOf(['left bottom', 'right bottom']);

const LINES_MASK = ticketMaskOf([
  'left top',
  'right top',
  'left bottom',
  'right bottom',
]);

const FOOT_MASK = ticketMaskOf(['left top', 'right top'], true);

const TEAR = 'absolute inset-x-3 top-0';

/** Under 18rem the status goes under the reference, so the client and the reference keep the whole width. */
const HEAD = [
  'bg-card grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-3 rounded-t-xl px-5 pt-5 pb-4',
  '@2xs:grid-cols-[auto_minmax(0,1fr)_auto]',
].join(' ');

const HEAD_TEXT = 'col-start-2 truncate @max-2xs:whitespace-normal';

const STATUS_PLACE = [
  'col-start-2 row-start-3 mt-1.5 justify-self-start',
  '@2xs:col-start-3 @2xs:row-start-1 @2xs:mt-0',
].join(' ');

const LINE = [
  '-mx-2 flex items-start gap-3 rounded-lg px-2 py-1.5',
  'transition-[scale,background-color,opacity] duration-150 ease-(--ease-out-strong)',
].join(' ');

const LINE_OPEN = 'cursor-pointer hover:bg-foreground/[0.03]';

const START_LABELS: Record<MorphState, string> = {
  idle: 'Start project',
  busy: 'Starting',
  done: 'Project started',
};

const MORPH_STATES: Record<ReceiptStatus, MorphState> = {
  draft: 'idle',
  starting: 'busy',
  confirmed: 'done',
};

const LOCALE = 'en-US';

function moneyFormatOf(currency: string): Intl.NumberFormatOptions {
  return { style: 'currency', currency, maximumFractionDigits: 0 };
}

function selectedOf(
  services: ReceiptService[],
  selectedIds: readonly string[]
) {
  return services.filter((service) => selectedIds.includes(service.id));
}

function totalOf(services: ReceiptService[], selectedIds: readonly string[]) {
  let total = 0;
  for (const service of selectedOf(services, selectedIds)) {
    total += service.price;
  }
  return total;
}

function serviceWordOf(count: number) {
  if (count === 1) {
    return 'service';
  }
  return 'services';
}

function countLineOf(selectedCount: number, serviceCount: number) {
  if (selectedCount === 0) {
    return 'Pick a service to start';
  }
  const word = serviceWordOf(serviceCount);
  return `${selectedCount} of ${serviceCount} ${word}`;
}

function lineStateOf(isLocked: boolean) {
  if (isLocked) {
    return undefined;
  }
  return LINE_OPEN;
}

type ServiceLineProps = {
  service: ReceiptService;
  price: string;
  isSelected: boolean;
  isLocked: boolean;
  isPressed: boolean;
  onChange: (isSelected: boolean) => void;
};

function ServiceLine({
  service,
  price,
  isSelected,
  isLocked,
  isPressed,
  onChange,
}: ServiceLineProps) {
  const isLeftOut = isLocked && !isSelected;

  return (
    <li>
      <label
        className={cn(
          LINE,
          lineStateOf(isLocked),
          isLeftOut && 'opacity-50',
          pressedQuietOf(isPressed)
        )}
      >
        <Checkbox
          checked={isSelected}
          disabled={isLocked}
          onCheckedChange={onChange}
          className='mt-0.5 data-disabled:opacity-100'
        />
        <span className='min-w-0 flex-1'>
          <span className='block truncate text-[13px] font-medium'>
            {service.name}
          </span>
          <span className='text-muted-foreground block text-xs'>
            {service.detail}
          </span>
        </span>
        <span className='text-[13px] tabular-nums'>{price}</span>
      </label>
    </li>
  );
}

function StatusBadge({ status }: { status: ReceiptStatus }) {
  const isConfirmed = status === 'confirmed';

  return (
    <Swap swapKey={String(isConfirmed)}>
      {isConfirmed && (
        <Badge variant='success'>
          <CheckIcon />
          Confirmed
        </Badge>
      )}
      {!isConfirmed && <Badge variant='secondary'>Draft</Badge>}
    </Swap>
  );
}

export type ServiceReceiptProps = {
  client: string;
  /** What the receipt is for, with its number: "Quote 0482, website refresh". */
  reference: string;
  services: ReceiptService[];
  selectedIds: readonly string[];
  onSelectedChange: (serviceId: string, isSelected: boolean) => void;
  status: ReceiptStatus;
  onStart: () => void;
  /** Back to a draft, to change the selection after the start. */
  onEdit: () => void;
  currency?: string;
  /** Says the prices are made up. Leave it out for real prices. */
  note?: string;
  /** The service line a demonstration ticks, shown held down. */
  pressedServiceId?: string | null;
  /** Shows Start project held down, for a demonstration that presses it. */
  isStartPressed?: boolean;
  className?: string;
};

export function ServiceReceipt({
  client,
  reference,
  services,
  selectedIds,
  onSelectedChange,
  status,
  onStart,
  onEdit,
  currency = 'USD',
  note,
  pressedServiceId = null,
  isStartPressed = false,
  className,
}: ServiceReceiptProps) {
  const titleId = useId();
  const startRef = useRef<HTMLButtonElement>(null);
  const moneyFormat = moneyFormatOf(currency);
  const money = new Intl.NumberFormat(LOCALE, moneyFormat);
  const total = totalOf(services, selectedIds);
  const selectedCount = selectedOf(services, selectedIds).length;
  const hasSelection = selectedCount > 0;
  const isLocked = status !== 'draft';
  const isConfirmed = status === 'confirmed';

  /** Edit hides once the receipt is a draft again, so the focus moves first to Start project, which stays. */
  function editFromButton() {
    startRef.current?.focus();
    onEdit();
  }

  return (
    <section
      aria-labelledby={titleId}
      style={TICKET_OUTLINE}
      className={cn('@container flex w-full flex-col', className)}
    >
      <div style={HEAD_MASK} className={HEAD}>
        <CompanyMark seed={client} size='lg' className='row-span-2 mt-0.5' />
        <h3
          id={titleId}
          className={cn(HEAD_TEXT, 'row-start-1 text-sm font-medium')}
        >
          {client}
        </h3>
        <p
          className={cn(
            HEAD_TEXT,
            'text-muted-foreground row-start-2 text-xs @2xs:col-[2/4]'
          )}
        >
          {reference}
        </p>
        <span className={STATUS_PLACE}>
          <StatusBadge status={status} />
        </span>
      </div>
      <div className='relative'>
        <TearLine direction='row' className={TEAR} />
      </div>
      <div style={LINES_MASK} className='bg-card px-5 py-2'>
        <ul aria-label='Services' className='flex flex-col'>
          {services.map((service) => (
            <ServiceLine
              key={service.id}
              service={service}
              price={money.format(service.price)}
              isSelected={selectedIds.includes(service.id)}
              isLocked={isLocked}
              isPressed={service.id === pressedServiceId}
              onChange={(isSelected) =>
                onSelectedChange(service.id, isSelected)
              }
            />
          ))}
        </ul>
      </div>
      <div className='relative'>
        <TearLine direction='row' className={TEAR} />
      </div>
      <div style={FOOT_MASK} className='bg-card px-5 pt-4 pb-6'>
        <div className='flex items-end justify-between gap-3'>
          <div className='min-w-0'>
            <p className='text-[13px] font-medium'>Total</p>
            <p className='text-muted-foreground truncate text-xs tabular-nums'>
              {countLineOf(selectedCount, services.length)}
            </p>
          </div>
          <MotionNumber
            value={total}
            locale={LOCALE}
            format={moneyFormat}
            className='text-2xl font-semibold'
          />
        </div>
        <div className='mt-4 flex items-center justify-between gap-2'>
          <Button
            type='button'
            variant='ghost'
            size='sm'
            onClick={editFromButton}
            className={cn(
              'text-muted-foreground -ms-2',
              !isConfirmed && 'invisible'
            )}
          >
            <PencilIcon />
            <span className='@max-3xs:sr-only'>Edit</span>
          </Button>
          <MorphButton
            ref={startRef}
            type='button'
            state={MORPH_STATES[status]}
            labels={START_LABELS}
            disabled={!hasSelection}
            onClick={onStart}
            className={pressedSolidOf(isStartPressed)}
          />
        </div>
        {note && <SampleNote className='mt-3 block'>{note}</SampleNote>}
      </div>
    </section>
  );
}

const SERVICES: ReceiptService[] = [
  {
    id: 'design',
    name: 'Interface design',
    detail: 'Eight screens, light and dark',
    price: 2400,
  },
  {
    id: 'build',
    name: 'Front-end build',
    detail: 'Responsive, tested on phones',
    price: 3800,
  },
  {
    id: 'motion',
    name: 'Motion pass',
    detail: 'Transitions and micro-interactions',
    price: 900,
  },
  {
    id: 'copy',
    name: 'Copy review',
    detail: 'Every label, error and empty state',
    price: 600,
  },
];

const FIRST_SELECTION = ['design', 'build'];

const CLIENT = 'Halden Works';

const START_MS = 900;

/** Long enough for the start to go through and for the confirmed receipt to be read. */
const CONFIRMED_HOLD_MS = START_MS + 2200;

const DEMO_MONEY = new Intl.NumberFormat(LOCALE, moneyFormatOf('USD'));

function withService(
  selectedIds: string[],
  serviceId: string,
  isSelected: boolean
) {
  const others = selectedIds.filter((selectedId) => selectedId !== serviceId);
  if (isSelected) {
    return [...others, serviceId];
  }
  return others;
}

function announcementOf(status: ReceiptStatus, total: number, count: number) {
  const word = serviceWordOf(count);
  const amount = DEMO_MONEY.format(total);
  const summary = `${count} ${word}, total ${amount}`;
  if (status === 'confirmed') {
    return `Project started with ${summary}`;
  }
  return summary;
}

export default function Card02() {
  const [selectedIds, setSelectedIds] = useState(FIRST_SELECTION);
  const [status, setStatus] = useState<ReceiptStatus>('draft');
  const { schedule, clearAll } = useTimeouts();
  const line = usePress<string>();
  const start = usePress<'start'>();
  const total = totalOf(SERVICES, selectedIds);
  const announcement = announcementOf(status, total, selectedIds.length);

  function changeSelected(serviceId: string, isSelected: boolean) {
    setSelectedIds((current) => withService(current, serviceId, isSelected));
  }

  function startProject() {
    const isDraft = status === 'draft';
    const hasSelection = selectedIds.length > 0;
    const canStart = isDraft && hasSelection;
    if (!canStart) {
      return;
    }
    setStatus('starting');
    schedule(() => setStatus('confirmed'), START_MS);
  }

  function backToDraft() {
    clearAll();
    setStatus('draft');
  }

  function startOver() {
    backToDraft();
    setSelectedIds(FIRST_SELECTION);
  }

  const steps: AutoplayStep[] = [
    { after: 1400, run: () => line.press('motion') },
    { after: PRESS_LEAD_MS, run: () => changeSelected('motion', true) },
    { after: 1200, run: () => line.press('copy') },
    { after: PRESS_LEAD_MS, run: () => changeSelected('copy', true) },
    { after: 1300, run: () => line.press('design') },
    { after: PRESS_LEAD_MS, run: () => changeSelected('design', false) },
    { after: 1400, run: () => start.press('start') },
    { after: PRESS_LEAD_MS, run: startProject },
    { after: CONFIRMED_HOLD_MS, run: hold },
  ];
  const { ref, isAutoplaying } = useCardDemo(steps, {
    loopAfter: 1200,
    onReset: startOver,
  });

  return (
    <div ref={ref} className='min-h-[27rem] w-full max-w-[20rem]'>
      <ServiceReceipt
        client={CLIENT}
        reference='Quote 0482, website refresh'
        services={SERVICES}
        selectedIds={selectedIds}
        onSelectedChange={changeSelected}
        status={status}
        onStart={startProject}
        onEdit={backToDraft}
        note='Illustrative prices'
        pressedServiceId={line.pressed}
        isStartPressed={start.pressed === 'start'}
      />
      <LiveRegion message={spokenUnless(isAutoplaying, announcement)} />
    </div>
  );
}
