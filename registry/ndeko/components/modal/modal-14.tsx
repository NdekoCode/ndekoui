'use client';

import { useState } from 'react';

import {
  CheckIcon,
  ClockIcon,
  DownloadIcon,
  BriefcaseIcon,
} from '@/registry/ndeko/lib/icons';
import { Chip } from '@/registry/ndeko/ui/chip';

import {
  ActionButton,
  useTimedAction,
  type ActionLabels,
} from './_parts/action-button';
import {
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalPreview,
  ModalTitle,
} from './_parts/modal-frame';
import { Swap } from './_parts/swap';

type TimeEntry = { id: string; task: string; date: string; minutes: number };

const ENTRIES: TimeEntry[] = [
  {
    id: 'entry-1',
    task: 'Design system audit',
    date: 'Mon 5 Oct',
    minutes: 270,
  },
  {
    id: 'entry-2',
    task: 'Onboarding screens',
    date: 'Wed 7 Oct',
    minutes: 90,
  },
  {
    id: 'entry-3',
    task: 'Review with the client',
    date: 'Fri 9 Oct',
    minutes: 120,
  },
];

const HOURLY_RATE = 62;

const FEE_PERCENT = 10;

const MINUTES_PER_HOUR = 60;

const CLIENT_GEM = { '--gem': 'var(--info)' } as React.CSSProperties;

const MONEY = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

const EXPORT_LABELS: ActionLabels = {
  idle: 'Export invoice',
  working: 'Exporting',
  done: 'Exported',
};

function durationOf(minutes: number) {
  const hours = Math.floor(minutes / MINUTES_PER_HOUR);
  const rest = minutes % MINUTES_PER_HOUR;
  const paddedRest = String(rest).padStart(2, '0');
  return `${hours}h ${paddedRest}m`;
}

function totalMinutesOf(entries: TimeEntry[]) {
  let total = 0;
  for (const entry of entries) {
    total += entry.minutes;
  }
  return total;
}

function paymentLabelsOf(isPaid: boolean): ActionLabels {
  if (isPaid) {
    return { idle: 'Mark as unpaid', working: 'Saving', done: 'Saved' };
  }
  return { idle: 'Mark as paid', working: 'Saving', done: 'Saved' };
}

function StatusChip({ isPaid }: { isPaid: boolean }) {
  const statusKey = String(isPaid);

  return (
    <Swap swapKey={statusKey}>
      {isPaid && (
        <Chip color='var(--success)'>
          <CheckIcon strokeWidth={2.5} />
          Paid
        </Chip>
      )}
      {!isPaid && (
        <Chip color='var(--warning)'>
          <ClockIcon strokeWidth={2.25} />
          Pending
        </Chip>
      )}
    </Swap>
  );
}

function EntriesTable({ totalMinutes }: { totalMinutes: number }) {
  return (
    <div className='bg-card hairline-ring ring-border overflow-hidden rounded-xl shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
      <table className='w-full text-[13px]'>
        <caption className='sr-only'>Time entries of the invoice</caption>
        <thead>
          <tr className='hairline-b border-border text-muted-foreground text-xs'>
            <th scope='col' className='px-3 py-2 text-left font-medium'>
              Task
            </th>
            <th scope='col' className='px-3 py-2 text-left font-medium'>
              Date
            </th>
            <th scope='col' className='px-3 py-2 text-right font-medium'>
              Time
            </th>
          </tr>
        </thead>
        <tbody>
          {ENTRIES.map((entry) => (
            <tr key={entry.id} className='hairline-b border-border'>
              <td className='w-full max-w-0 truncate px-3 py-2.5'>
                {entry.task}
              </td>
              <td className='text-muted-foreground px-3 py-2.5 whitespace-nowrap'>
                {entry.date}
              </td>
              <td className='px-3 py-2.5 text-right whitespace-nowrap tabular-nums'>
                {durationOf(entry.minutes)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th
              scope='row'
              colSpan={2}
              className='px-3 py-2.5 text-left font-medium'
            >
              Total
            </th>
            <td className='px-3 py-2.5 text-right font-medium whitespace-nowrap tabular-nums'>
              {durationOf(totalMinutes)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function PaymentRecordContent() {
  const [isPaid, setIsPaid] = useState(false);
  const payment = useTimedAction();
  const exporting = useTimedAction();
  const totalMinutes = totalMinutesOf(ENTRIES);
  const hours = totalMinutes / MINUTES_PER_HOUR;
  const earned = hours * HOURLY_RATE;
  const fee = (earned * FEE_PERCENT) / 100;
  const takeHome = earned - fee;
  const paymentLabels = paymentLabelsOf(isPaid);

  function togglePaid() {
    payment.run(() => {
      setIsPaid((previous) => !previous);
    });
  }

  function exportInvoice() {
    exporting.run(() => {});
  }

  return (
    <>
      <ModalHeader>
        <ModalTitle>Payment record</ModalTitle>
        <ModalDescription>Invoice INV-2026-118 · October 2026</ModalDescription>
      </ModalHeader>
      <dl className='grid grid-cols-2 gap-4'>
        <div className='flex min-w-0 flex-col gap-1'>
          <dt className='text-muted-foreground text-xs'>Client</dt>
          <dd className='flex min-w-0 items-center gap-2 text-[13px] font-medium'>
            <span
              style={CLIENT_GEM}
              className='gem-plate flex size-5 shrink-0 items-center justify-center rounded-[5px]'
            >
              <BriefcaseIcon className='size-3' strokeWidth={2.25} />
            </span>
            <span className='truncate'>Fernwick Studio</span>
          </dd>
        </div>
        <div className='flex min-w-0 flex-col gap-1'>
          <dt className='text-muted-foreground text-xs'>Job</dt>
          <dd className='truncate text-[13px] font-medium'>Product design</dd>
        </div>
      </dl>
      <div className='flex flex-wrap items-center gap-1.5'>
        <StatusChip isPaid={isPaid} />
        <Chip color='var(--info)'>{`Hourly · ${MONEY.format(HOURLY_RATE)}`}</Chip>
      </div>
      <EntriesTable totalMinutes={totalMinutes} />
      <dl className='flex flex-col gap-2 text-[13px]'>
        <div className='flex items-baseline justify-between gap-4'>
          <dt className='text-muted-foreground'>
            {`${hours} h × ${MONEY.format(HOURLY_RATE)}`}
          </dt>
          <dd className='tabular-nums'>{MONEY.format(earned)}</dd>
        </div>
        <div className='flex items-baseline justify-between gap-4'>
          <dt className='text-muted-foreground'>
            {`Platform fee, ${FEE_PERCENT}%`}
          </dt>
          <dd className='tabular-nums'>{`−${MONEY.format(fee)}`}</dd>
        </div>
        <div className='flex items-end justify-between gap-4 pt-2'>
          <dt className='flex flex-col gap-0.5'>
            <span className='font-medium'>Take-home</span>
            <span className='text-muted-foreground text-xs'>
              Illustrative figures
            </span>
          </dt>
          <dd className='text-2xl font-semibold tabular-nums'>
            {MONEY.format(takeHome)}
          </dd>
        </div>
      </dl>
      <ModalFooter>
        <ActionButton
          variant='outline'
          state={payment.state}
          labels={paymentLabels}
          onClick={togglePaid}
        />
        <ActionButton
          state={exporting.state}
          labels={EXPORT_LABELS}
          idleIcon={<DownloadIcon />}
          onClick={exportInvoice}
        />
      </ModalFooter>
    </>
  );
}

export default function Modal14() {
  return (
    <ModalPreview triggerLabel='Open payment record' size='md'>
      <PaymentRecordContent />
    </ModalPreview>
  );
}
