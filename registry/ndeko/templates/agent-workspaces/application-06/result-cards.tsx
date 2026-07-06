'use client';

import { FileSpreadsheetIcon, ShareIcon } from '@/registry/ndeko/lib/icons';
import { Avatar } from '@/registry/ndeko/ui/avatar';
import { Badge } from '@/registry/ndeko/ui/badge';

import {
  FINANCE_TEAM,
  UNPAID,
  UNPAID_TOTAL,
  type Invoice,
  type ResultKind,
} from './data';

const CARD =
  'bg-card hairline-ring ring-border dark:bg-foreground/[0.04] mt-2 overflow-hidden rounded-xl shadow-[0_1px_2px_rgb(0_0_0/0.04)] transition-[opacity,scale] duration-300 ease-(--ease-out-strong) starting:scale-[1.02] starting:opacity-0';

const USD = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

function InvoiceRow({ invoice }: { invoice: Invoice }) {
  return (
    <li className='flex items-center gap-2.5 py-1.5'>
      <Avatar seed={invoice.customer} className='size-6' />
      <span className='flex min-w-0 flex-1 flex-col leading-tight'>
        <span className='truncate text-[13px]'>{invoice.customer}</span>
        <span className='text-muted-foreground truncate text-xs'>
          {invoice.depot}, {invoice.daysLate} days late
        </span>
      </span>
      <span className='shrink-0 text-[13px] font-medium tabular-nums'>
        {USD.format(invoice.amountUsd)}
      </span>
    </li>
  );
}

function InvoicesCard() {
  const hidden = UNPAID_TOTAL.count - UNPAID.length;

  return (
    <section aria-label='Unpaid invoices' className={CARD}>
      <header className='flex items-center gap-2.5 p-3 pb-1.5'>
        <span
          aria-hidden='true'
          className='keycap-3d text-muted-foreground inline-flex size-7 shrink-0 items-center justify-center rounded-md'
        >
          <FileSpreadsheetIcon className='size-3.5' />
        </span>
        <div className='flex min-w-0 flex-1 flex-col leading-tight'>
          <h3 className='truncate text-sm font-medium'>
            Unpaid invoices, March
          </h3>
          <span className='text-muted-foreground truncate text-xs'>
            Kinshasa and Goma
          </span>
        </div>
        <Badge variant='secondary'>Illustrative</Badge>
      </header>
      <ul aria-label='Largest unpaid invoices' className='flex flex-col px-3'>
        {UNPAID.map((invoice) => (
          <InvoiceRow key={invoice.id} invoice={invoice} />
        ))}
      </ul>
      <p className='bg-foreground/[0.04] mt-1.5 flex items-center justify-between gap-2 px-3 py-2 text-xs'>
        <span className='text-muted-foreground'>{hidden} more invoices</span>
        <span className='tabular-nums'>
          {UNPAID_TOTAL.count} unpaid,{' '}
          <span className='font-medium'>{USD.format(UNPAID_TOTAL.usd)}</span>
        </span>
      </p>
    </section>
  );
}

function SharedCard() {
  return (
    <section aria-label='Shared list' className={CARD}>
      <header className='flex items-center gap-2.5 p-3 pb-1.5'>
        <span
          aria-hidden='true'
          className='keycap-3d text-muted-foreground inline-flex size-7 shrink-0 items-center justify-center rounded-md'
        >
          <ShareIcon className='size-3.5' />
        </span>
        <div className='flex min-w-0 flex-1 flex-col leading-tight'>
          <h3 className='truncate font-mono text-[13px] font-medium'>
            unpaid-march.xlsx
          </h3>
          <span className='text-muted-foreground truncate text-xs'>
            Shared with the finance team
          </span>
        </div>
        <Badge variant='success'>Can comment</Badge>
      </header>
      <ul aria-label='People with access' className='flex flex-col px-3 pb-2'>
        {FINANCE_TEAM.map((person) => (
          <li key={person.name} className='flex items-center gap-2.5 py-1.5'>
            <Avatar seed={person.name} className='size-6' />
            <span className='min-w-0 flex-1 truncate text-[13px]'>
              {person.name}
            </span>
            <span className='text-muted-foreground shrink-0 text-xs'>
              {person.role}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

type ResultCardProps = {
  kind: ResultKind;
};

export function ResultCard({ kind }: ResultCardProps) {
  if (kind === 'invoices') {
    return <InvoicesCard />;
  }
  return <SharedCard />;
}
