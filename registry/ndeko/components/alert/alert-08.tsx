import { StatusOrb } from '@/registry/ndeko/ui/status-orb';

export default function Alert08() {
  return (
    <div
      role='status'
      className='bg-info/10 text-info-foreground hairline-ring ring-info/25 flex items-start gap-3 rounded-xl px-4 py-2.5'
    >
      <StatusOrb tone='info' size='sm' />
      <p className='py-0.5 text-[13px] leading-5'>
        Invoices are now sent on the first day of each month.
      </p>
    </div>
  );
}
