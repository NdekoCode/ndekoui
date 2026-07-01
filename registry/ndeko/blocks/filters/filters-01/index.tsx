'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { FileTextIcon, XIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';
import { Chip } from '@/registry/ndeko/ui/chip';
import { Tabs, TabsList, TabsTab } from '@/registry/ndeko/ui/tabs';

import { AmountFilter } from './amount-filter';
import {
  INVOICES,
  STATUS_DETAILS,
  STATUS_FILTERS,
  WORKSPACE,
  type AmountRange,
  type Invoice,
  type StatusFilter,
} from './data';
import {
  CURRENCY_FORMAT,
  CURRENCY_LOCALE,
  FULL_RANGE,
  emptyLineOf,
  formatAmount,
  invoiceCountLabel,
  invoicesInRange,
  matchesStatus,
  totalOf,
} from './invoice-model';
import { useHeightPresence } from './motion-parts';

const LIST_SURFACE =
  'bg-card hairline-ring ring-border rounded-xl shadow-[0_1px_2px_rgb(0_0_0/0.04)] dark:bg-foreground/[0.03]';

function isStatusFilter(value: unknown): value is StatusFilter {
  return STATUS_FILTERS.some((filter) => filter.id === value);
}

function InvoiceRow({ invoice }: { invoice: Invoice }) {
  const status = STATUS_DETAILS[invoice.status];

  return (
    <div className='flex h-14 items-center gap-3 px-4'>
      <span className='keycap-3d text-muted-foreground hidden size-8 shrink-0 items-center justify-center rounded-lg sm:flex'>
        <FileTextIcon />
      </span>
      <div className='min-w-0 flex-1'>
        <p className='truncate text-[13px] font-medium'>{invoice.client}</p>
        <p className='text-muted-foreground truncate text-xs tabular-nums'>
          {invoice.number} · {invoice.issuedOn}
        </p>
      </div>
      <div className='flex flex-col items-end gap-1 sm:flex-row-reverse sm:items-center sm:gap-4'>
        <span className='text-[13px] font-medium tabular-nums sm:w-20 sm:text-right'>
          {formatAmount(invoice.amount)}
        </span>
        <Chip color={status.color}>{status.label}</Chip>
      </div>
    </div>
  );
}

type NoMatchProps = {
  status: StatusFilter;
  range: AmountRange;
  onReset: () => void;
};

function NoMatch({ status, range, onReset }: NoMatchProps) {
  return (
    <div className='flex flex-col items-center px-6 py-10 text-center'>
      <span className='keycap-3d text-muted-foreground flex size-9 items-center justify-center rounded-lg'>
        <FileTextIcon />
      </span>
      <p className='mt-4 text-sm font-medium'>Nothing matches these filters</p>
      <p className='text-muted-foreground mt-1 max-w-sm text-[13px] text-balance'>
        {emptyLineOf(status, range)}
      </p>
      <Button variant='outline' onClick={onReset} className='mt-4'>
        <XIcon />
        Reset filters
      </Button>
    </div>
  );
}

export default function Filters01() {
  const [status, setStatus] = useState<StatusFilter>('all');
  const [range, setRange] = useState<AmountRange>(FULL_RANGE);
  const heightPresence = useHeightPresence();
  const statusInvoices = INVOICES.filter((invoice) =>
    matchesStatus(invoice, status)
  );
  const shown = invoicesInRange(statusInvoices, range);
  const shownCount = shown.length;
  const shownTotal = totalOf(shown);
  const hasMatches = shownCount > 0;

  function pickStatus(value: unknown) {
    if (isStatusFilter(value)) {
      setStatus(value);
    }
  }

  function resetFilters() {
    setStatus('all');
    setRange(FULL_RANGE);
  }

  return (
    <div className='bg-background text-foreground min-h-dvh w-full'>
      <div className='mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-6 md:px-6 md:py-10'>
        <header className='flex flex-wrap items-end justify-between gap-x-4 gap-y-1'>
          <div className='flex flex-col gap-0.5'>
            <h1 className='text-lg font-semibold text-balance'>
              {WORKSPACE.title}
            </h1>
            <p className='text-muted-foreground text-xs'>
              {WORKSPACE.period} · Illustrative figures
            </p>
          </div>
          <p className='text-muted-foreground text-[13px]'>
            <MotionNumber
              value={shownCount}
              className='text-foreground font-medium'
            />{' '}
            {invoiceCountLabel(shownCount)} ·{' '}
            <MotionNumber
              value={shownTotal}
              locale={CURRENCY_LOCALE}
              format={CURRENCY_FORMAT}
              className='text-foreground font-medium'
            />
          </p>
        </header>
        <div className='flex flex-wrap items-center gap-2'>
          <Tabs value={status} onValueChange={pickStatus}>
            <TabsList variant='segmented' aria-label='Status'>
              {STATUS_FILTERS.map((filter) => (
                <TabsTab key={filter.id} value={filter.id}>
                  {filter.label}
                </TabsTab>
              ))}
            </TabsList>
          </Tabs>
          <AmountFilter
            invoices={statusInvoices}
            value={range}
            onValueChange={setRange}
          />
        </div>
        <section aria-label='Matching invoices' className={LIST_SURFACE}>
          <ul className='max-h-[30rem] overflow-y-auto'>
            <AnimatePresence initial={false}>
              {shown.map((invoice) => (
                <motion.li
                  key={invoice.id}
                  {...heightPresence}
                  className='overflow-hidden'
                >
                  <InvoiceRow invoice={invoice} />
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
          <AnimatePresence initial={false}>
            {!hasMatches && (
              <motion.div
                key='no-match'
                {...heightPresence}
                className='overflow-hidden'
              >
                <NoMatch status={status} range={range} onReset={resetFilters} />
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </div>
    </div>
  );
}
