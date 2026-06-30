import { Lens } from '@/components/core/lens';

type Line = {
  label: string;
  amount: string;
};

const LINES: Line[] = [
  { label: 'Workspace seats, 12 at $8', amount: '$96.00' },
  { label: 'Extra storage, 200 GB', amount: '$14.00' },
  { label: 'Annual discount, 10%', amount: '-$11.00' },
  { label: 'Tax, 16%', amount: '$15.84' },
];

export function LensFinePrint() {
  return (
    <div className='w-full max-w-sm p-4'>
      <Lens
        zoom={2.2}
        size={140}
        alwaysVisible
        defaultPosition={{ x: 250, y: 92 }}
        label='Magnifier over the lines of an invoice'
        className='bg-card hairline-ring ring-border shadow-[0_1px_2px_rgb(0_0_0/0.04)]'
      >
        <div className='p-4'>
          <div className='flex items-baseline justify-between'>
            <h3 className='text-sm font-medium'>Invoice 2026-114</h3>
            <span className='text-muted-foreground text-[9px]'>
              Illustrative
            </span>
          </div>
          <ul className='mt-3 flex flex-col gap-1.5'>
            {LINES.map((line) => (
              <li
                key={line.label}
                className='text-muted-foreground flex justify-between gap-4 text-[9px] tabular-nums'
              >
                <span>{line.label}</span>
                <span className='text-foreground'>{line.amount}</span>
              </li>
            ))}
          </ul>
          <div className='mt-3 flex justify-between text-[11px] font-medium tabular-nums'>
            <span>Total due</span>
            <span>$114.84</span>
          </div>
        </div>
      </Lens>
    </div>
  );
}
