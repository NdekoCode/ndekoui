import { SmoothScroll } from '@/components/core/smooth-scroll';

const ORDERS = [
  { id: '#2048', trader: 'Bakery on the corner', total: '€42.00' },
  { id: '#2047', trader: 'Fernhill farm shop', total: '€18.50' },
  { id: '#2046', trader: 'Second-hand books', total: '€9.00' },
  { id: '#2045', trader: 'Cheese and olives', total: '€27.80' },
  { id: '#2044', trader: 'Flower stall', total: '€15.00' },
  { id: '#2043', trader: 'Coffee cart', total: '€6.40' },
  { id: '#2042', trader: 'Ceramics by Ana', total: '€64.00' },
  { id: '#2041', trader: 'Honey from the hills', total: '€11.20' },
  { id: '#2040', trader: 'Bike repairs', total: '€25.00' },
  { id: '#2039', trader: 'Fish market', total: '€33.60' },
];

const NOTES = [
  'The list of orders below scrolls on its own, with the native feel of the system. The page around it is smoothed.',
  'When the list reaches its end, the wheel moves on to the page, as it would without smoothing.',
  'Anything marked with data-smooth-scroll-ignore keeps the native wheel too, which suits maps and canvases that zoom with it.',
];

export function SmoothScrollNested() {
  return (
    <SmoothScroll className='h-[420px] w-full px-6 py-10'>
      <div className='mx-auto flex max-w-md flex-col gap-4'>
        <h3 className='text-foreground text-xl font-semibold text-balance'>
          Saturday orders
        </h3>
        {NOTES.map((note) => (
          <p key={note} className='text-muted-foreground text-sm'>
            {note}
          </p>
        ))}
        <ul
          aria-label='Orders'
          className='bg-foreground/[0.04] h-48 overflow-y-auto rounded-xl px-1 py-1'
        >
          {ORDERS.map((order) => (
            <li
              key={order.id}
              className='flex items-center justify-between gap-3 rounded-md px-3 py-2 text-[13px]'
            >
              <span className='text-muted-foreground tabular-nums'>
                {order.id}
              </span>
              <span className='text-foreground flex-1 truncate'>
                {order.trader}
              </span>
              <span className='text-foreground tabular-nums'>
                {order.total}
              </span>
            </li>
          ))}
        </ul>
        <div
          data-smooth-scroll-ignore
          className='bg-foreground/[0.025] text-muted-foreground grid h-32 place-items-center rounded-xl text-xs'
        >
          The wheel here stays native
        </div>
        <p className='text-muted-foreground text-sm'>
          The rest of the page goes on below, smoothed again.
        </p>
        <div className='h-48' />
      </div>
    </SmoothScroll>
  );
}
