import { StatusOrb } from '@/registry/ndeko/ui/status-orb';

export default function Alert05() {
  return (
    <div
      role='status'
      className='bg-card hairline-ring ring-border flex items-start gap-3 rounded-xl px-4 py-2.5 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'
    >
      <StatusOrb tone='success' size='sm' />
      <p className='py-0.5 text-[13px] leading-5'>
        Your changes have been saved.
      </p>
    </div>
  );
}
