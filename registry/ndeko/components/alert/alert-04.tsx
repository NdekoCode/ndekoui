import { StatusOrb } from '@/registry/ndeko/ui/status-orb';

export default function Alert04() {
  return (
    <div
      role='alert'
      className='bg-destructive/10 text-destructive-ink hairline-ring ring-destructive/25 flex items-start gap-3 rounded-xl px-4 py-2.5'
    >
      <StatusOrb tone='error' size='sm' />
      <p className='py-0.5 text-[13px] leading-5'>
        The export failed. Try again in a few minutes.
      </p>
    </div>
  );
}
