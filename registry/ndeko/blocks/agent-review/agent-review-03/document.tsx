'use client';

import { cn } from '@/registry/ndeko/lib/utils';

import { fieldOf, LINE_ITEMS, type FieldId, type PageNumber } from './data';

export type PointHandlers = {
  activeId: FieldId | null;
  /** The fields read so far: their boxes are marked on the page. */
  readIds: ReadonlySet<FieldId>;
  onPoint: (id: FieldId | null) => void;
  onPick: (id: FieldId) => void;
};

function boxToneOf(isActive: boolean, isRead: boolean) {
  if (isActive) {
    return 'bg-primary/15 ring-primary/60';
  }
  if (isRead) {
    return 'bg-primary/[0.06] ring-primary/25';
  }
  return 'ring-transparent';
}

type BoxProps = PointHandlers & {
  id: FieldId;
  className?: string;
};

/** A value on the page. It lights with its row in the list, whichever of the two is pointed at. */
function Box({ id, activeId, readIds, onPoint, onPick, className }: BoxProps) {
  const field = fieldOf(id);
  const isActive = activeId === id;
  const isRead = readIds.has(id);

  return (
    <button
      type='button'
      data-box={id}
      aria-label={`${field.label}: ${field.printed}`}
      onMouseEnter={() => onPoint(id)}
      onMouseLeave={() => onPoint(null)}
      onFocus={() => onPoint(id)}
      onBlur={() => onPoint(null)}
      onClick={() => onPick(id)}
      className={cn(
        'hairline-ring focus-visible:ring-ring -mx-1 cursor-pointer rounded-sm px-1 text-start font-medium transition-[background-color,box-shadow] duration-200 outline-none focus-visible:ring-2',
        boxToneOf(isActive, isRead),
        className
      )}
    >
      {field.printed}
    </button>
  );
}

function Caption({ children }: { children: React.ReactNode }) {
  return <span className='text-muted-foreground'>{children}</span>;
}

function FirstPage(handlers: PointHandlers) {
  return (
    <div className='flex flex-col gap-5'>
      <div className='flex items-start justify-between gap-3'>
        <div className='flex flex-col'>
          <span className='text-base font-semibold'>Purchase order</span>
          <Caption>Tallis Studio</Caption>
        </div>
        <div className='flex flex-col items-end'>
          <Caption>Number</Caption>
          <Box id='po_number' {...handlers} />
        </div>
      </div>
      <div className='flex flex-col'>
        <Caption>Order date</Caption>
        <span>
          <Box id='order_date' {...handlers} />
        </span>
      </div>
      <div className='grid grid-cols-2 gap-4'>
        <div className='flex flex-col'>
          <Caption>Supplier</Caption>
          <span>
            <Box id='supplier' {...handlers} />
          </span>
          <span>22 Dock Road, Rotterdam</span>
        </div>
        <div className='flex flex-col'>
          <Caption>Bill to</Caption>
          <span>
            <Box id='bill_to' {...handlers} />
          </span>
          <span>Lisbon</span>
        </div>
      </div>
      <div className='flex flex-col'>
        <Caption>Ship to</Caption>
        <span>Warehouse 3, same address</span>
      </div>
    </div>
  );
}

function SecondPage(handlers: PointHandlers) {
  return (
    <div className='flex flex-col gap-5'>
      <table className='w-full text-start'>
        <thead>
          <tr className='text-muted-foreground'>
            <th className='pb-1 text-start font-normal'>Item</th>
            <th className='w-10 pb-1 text-end font-normal'>Qty</th>
            <th className='w-20 pb-1 text-end font-normal'>Amount</th>
          </tr>
        </thead>
        <tbody>
          {LINE_ITEMS.map((item) => (
            <tr key={item.name} className='hairline-t border-border'>
              <td className='py-1.5 pe-2'>{item.name}</td>
              <td className='py-1.5 text-end tabular-nums'>{item.quantity}</td>
              <td className='py-1.5 text-end tabular-nums'>{item.amount}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className='flex items-center justify-end gap-3'>
        <Caption>Total</Caption>
        <Box id='currency' {...handlers} />
        <Box id='total' {...handlers} className='text-sm tabular-nums' />
      </div>
      <div className='grid grid-cols-2 gap-4'>
        <div className='relative flex flex-col'>
          <Caption>Payment terms</Caption>
          <span>
            <Box id='payment_terms' {...handlers} />
          </span>
          <span
            aria-label='Handwritten note: Net 45'
            className='text-info-foreground absolute start-14 top-7 -rotate-6 font-medium'
          >
            Net 45?
          </span>
        </div>
        <div className='relative flex flex-col'>
          <Caption>Delivery date</Caption>
          <span>
            <Box id='delivery_date' {...handlers} />
          </span>
          <span
            aria-label='Stamp: Received'
            className='text-destructive-ink/70 border-destructive-ink/50 absolute start-12 top-3 rotate-[-8deg] rounded-sm border px-1.5 py-0.5 font-semibold'
          >
            Received
          </span>
        </div>
      </div>
    </div>
  );
}

type DocumentPageProps = PointHandlers & {
  page: PageNumber;
};

export function DocumentPage({ page, ...handlers }: DocumentPageProps) {
  return (
    <div className='bg-card hairline-ring ring-border dark:bg-foreground/[0.04] min-h-[19rem] rounded-lg p-5 text-xs leading-relaxed shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
      {page === 1 && <FirstPage {...handlers} />}
      {page === 2 && <SecondPage {...handlers} />}
    </div>
  );
}
