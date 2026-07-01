import { cn } from '@/registry/ndeko/lib/utils';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Chip } from '@/registry/ndeko/ui/chip';
import { StatusOrb } from '@/registry/ndeko/ui/status-orb';

import {
  INVOICE,
  type InvoiceLine,
  type MediaId,
  PAYMENTS,
  REMINDERS,
} from './data';

const AMOUNT_FORMAT = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const SURFACE =
  'bg-card hairline-ring ring-border dark:bg-foreground/[0.04] rounded-xl shadow-[0_1px_2px_rgb(0_0_0/0.04),0_12px_32px_-16px_rgb(0_0_0/0.12)]';

function amountOf(value: number) {
  return AMOUNT_FORMAT.format(value);
}

function lineTotalOf(line: InvoiceLine) {
  return line.hours * line.rate;
}

function invoiceTotalOf(lines: InvoiceLine[]) {
  let total = 0;
  for (const line of lines) {
    total += lineTotalOf(line);
  }
  return total;
}

function hoursLabelOf(hours: number) {
  if (hours === 1) {
    return '1 hour';
  }
  return `${hours} hours`;
}

function InvoiceMedia() {
  const total = invoiceTotalOf(INVOICE.lines);

  return (
    <div className={cn(SURFACE, 'flex w-full max-w-sm flex-col gap-4 p-5')}>
      <div className='flex items-start justify-between gap-3'>
        <div className='flex flex-col gap-0.5'>
          <p className='text-sm font-medium'>{INVOICE.client}</p>
          <p className='text-muted-foreground text-xs tabular-nums'>
            {INVOICE.number}, {INVOICE.period}
          </p>
        </div>
        <Badge variant='secondary' className='text-muted-foreground'>
          {INVOICE.status}
        </Badge>
      </div>
      <table className='w-full text-[13px]'>
        <caption className='sr-only'>Invoice lines</caption>
        <thead>
          <tr className='text-muted-foreground hairline-b border-border text-xs'>
            <th scope='col' className='pb-2 text-left font-medium'>
              Task
            </th>
            <th scope='col' className='pb-2 text-right font-medium'>
              Amount
            </th>
          </tr>
        </thead>
        <tbody>
          {INVOICE.lines.map((line) => {
            const lineTotal = lineTotalOf(line);

            return (
              <tr
                key={line.description}
                className='hairline-b border-border last:border-b-0'
              >
                <td className='py-2'>
                  <span className='block'>{line.description}</span>
                  <span className='text-muted-foreground text-xs tabular-nums'>
                    {hoursLabelOf(line.hours)} at {amountOf(line.rate)}
                  </span>
                </td>
                <td className='py-2 text-right align-top tabular-nums'>
                  {amountOf(lineTotal)}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className='hairline-t border-border'>
            <th scope='row' className='pt-3 text-left font-medium'>
              Total
            </th>
            <td className='pt-3 text-right font-semibold tabular-nums'>
              {amountOf(total)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function RemindersMedia() {
  return (
    <ol className={cn(SURFACE, 'flex w-full max-w-sm flex-col gap-1 p-2')}>
      {REMINDERS.map((reminder) => (
        <li key={reminder.title} className='flex items-center gap-3 p-2.5'>
          <span className='keycap-3d text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-lg'>
            <reminder.icon />
          </span>
          <div className='flex min-w-0 flex-1 flex-col'>
            <p className='truncate text-[13px] font-medium'>{reminder.title}</p>
            <p className='text-muted-foreground text-xs'>{reminder.date}</p>
          </div>
          <Chip color={reminder.color}>{reminder.status}</Chip>
        </li>
      ))}
    </ol>
  );
}

function PaymentsMedia() {
  const latest = PAYMENTS[0];

  return (
    <div className='relative w-full max-w-sm pt-10 sm:pt-0'>
      <ul className={cn(SURFACE, 'flex flex-col gap-1 p-2')}>
        {PAYMENTS.map((payment) => (
          <li
            key={payment.invoice}
            className='flex items-center justify-between gap-3 p-2.5'
          >
            <div className='flex min-w-0 flex-col'>
              <p className='truncate text-[13px] font-medium'>
                {payment.client}
              </p>
              <p className='text-muted-foreground text-xs tabular-nums'>
                {payment.invoice}
              </p>
            </div>
            <div className='flex shrink-0 flex-col items-end gap-1'>
              <span className='text-[13px] tabular-nums'>
                {amountOf(payment.amount)}
              </span>
              <Chip color={payment.color}>{payment.status}</Chip>
            </div>
          </li>
        ))}
      </ul>
      <div className='surface-raised absolute -top-2 right-0 flex items-center gap-2.5 rounded-xl py-2 ps-2 pe-3.5 sm:-top-6 sm:-right-4'>
        <StatusOrb tone='success' size='sm' className='[&>span]:animate-none' />
        <p className='text-[13px] font-medium tabular-nums'>
          {amountOf(latest.amount)} received
        </p>
      </div>
    </div>
  );
}

const MEDIA_BY_ID: Record<MediaId, () => React.ReactNode> = {
  invoice: InvoiceMedia,
  reminders: RemindersMedia,
  payments: PaymentsMedia,
};

export function FeatureMedia({ id }: { id: MediaId }) {
  const Media = MEDIA_BY_ID[id];

  return (
    <div
      aria-hidden='true'
      className='bg-foreground/[0.025] flex min-h-72 items-center justify-center rounded-2xl p-4 sm:p-10'
    >
      <Media />
    </div>
  );
}
