import { StatusOrb } from '@/registry/ndeko/ui/status-orb';

export default function Alert06() {
  return (
    <div
      role='status'
      className='bg-success/10 text-success-foreground hairline-ring ring-success/25 flex items-start gap-3 rounded-xl px-4 py-2.5'
    >
      <StatusOrb tone='success' size='sm' />
      <p className='py-0.5 text-[13px] leading-5'>
        Your changes have been saved.
      </p>
    </div>
  );
}
