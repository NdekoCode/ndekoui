'use client';

import { MotionNumber } from '@/components/core/motion-number';
import { CheckIcon, TriangleAlertIcon } from '@/registry/ndeko/lib/icons';
import { Segments, type Segment } from '@/registry/ndeko/ui/segments';

import { ORDER } from './data';
import type { PageVersion } from './session';

const VERSIONS: Segment<PageVersion>[] = [
  { value: 'before', label: 'Before' },
  { value: 'after', label: 'After' },
];

const MONEY: Intl.NumberFormatOptions = { style: 'currency', currency: 'USD' };

const MONEY_FORMAT = new Intl.NumberFormat('en-US', MONEY);

const SUBTOTAL = MONEY_FORMAT.format(ORDER.subtotal);

const DISCOUNT = MONEY_FORMAT.format(ORDER.discount);

const WRONG_TOTAL = MONEY_FORMAT.format(ORDER.totalBefore);

const RIGHT_TOTAL = MONEY_FORMAT.format(ORDER.totalAfter);

function totalOf(version: PageVersion) {
  if (version === 'after') {
    return ORDER.totalAfter;
  }
  return ORDER.totalBefore;
}

type SummaryRowProps = {
  label: string;
  value: string;
};

function SummaryRow({ label, value }: SummaryRowProps) {
  return (
    <div className='flex items-baseline justify-between gap-3'>
      <dt className='text-muted-foreground min-w-0 truncate'>{label}</dt>
      <dd className='shrink-0 tabular-nums'>{value}</dd>
    </div>
  );
}

/** The checkout page of the invented shop, drawn in HTML: nothing in it can be pressed. */
function OrderSummary({ version }: { version: PageVersion }) {
  return (
    <div
      role='group'
      aria-label='Checkout page, order summary'
      className='bg-card hairline-ring ring-border dark:bg-foreground/[0.04] flex w-full max-w-sm flex-col gap-3 self-center rounded-xl p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'
    >
      <p className='text-sm font-medium'>Order summary</p>
      <dl className='flex flex-col gap-2 text-[13px]'>
        <SummaryRow label={ORDER.item} value={SUBTOTAL} />
        <SummaryRow label={`Code ${ORDER.code}`} value={`-${DISCOUNT}`} />
        <SummaryRow label='Shipping' value='Free' />
      </dl>
      <div className='bg-foreground/[0.04] flex items-baseline justify-between gap-3 rounded-lg px-3 py-2'>
        <span className='text-[13px] font-medium'>Total</span>
        <MotionNumber
          value={totalOf(version)}
          format={MONEY}
          className='text-2xl leading-8 font-semibold'
        />
      </div>
      <span
        aria-hidden='true'
        className='bg-primary text-primary-foreground pointer-events-none flex h-8 items-center justify-center rounded-full text-[13px] font-medium select-none'
      >
        Pay now
      </span>
    </div>
  );
}

function VersionNote({ version }: { version: PageVersion }) {
  if (version === 'after') {
    return (
      <p className='text-success-foreground flex items-start gap-1.5 text-xs leading-5 transition-opacity duration-300 starting:opacity-0'>
        <CheckIcon className='mt-0.5 size-3.5 shrink-0' />
        {SUBTOTAL} less {DISCOUNT} is {RIGHT_TOTAL}, and the page says so
      </p>
    );
  }
  return (
    <p className='text-warning-foreground flex items-start gap-1.5 text-xs leading-5 transition-opacity duration-300 starting:opacity-0'>
      <TriangleAlertIcon className='mt-0.5 size-3.5 shrink-0' />
      {SUBTOTAL} less {DISCOUNT} is {RIGHT_TOTAL}. The page says {WRONG_TOTAL}
    </p>
  );
}

type PreviewViewProps = {
  version: PageVersion;
  canCompare: boolean;
  onVersionChange: (version: PageVersion) => void;
};

/** The fixed page exists once the tests pass. Until then there is nothing to compare with, so the switch stays away. */
export function PreviewView({
  version,
  canCompare,
  onVersionChange,
}: PreviewViewProps) {
  return (
    <div className='flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto'>
      <div className='flex min-h-7 flex-wrap items-center gap-x-3 gap-y-2'>
        {canCompare && (
          <Segments
            label='Version of the page'
            value={version}
            segments={VERSIONS}
            onValueChange={onVersionChange}
          />
        )}
        <p className='text-muted-foreground text-xs'>
          {canCompare && 'Checkout, order summary'}
          {!canCompare &&
            'The page as it is today. The fixed one shows once the tests pass'}
        </p>
      </div>
      <OrderSummary version={version} />
      <VersionNote key={version} version={version} />
    </div>
  );
}
