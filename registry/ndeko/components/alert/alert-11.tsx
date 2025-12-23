import { StatusOrb } from '@/registry/ndeko/ui/status-orb';

export default function Alert11() {
  return (
    <div
      role='alert'
      className='bg-card hairline-ring ring-border flex items-start gap-3 rounded-xl px-4 py-3 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'
    >
      <StatusOrb tone='error' size='sm' />
      <div className='flex grow flex-col gap-1 py-0.5 text-[13px] leading-5'>
        <p className='font-medium'>Password does not meet the requirements:</p>
        <ul className='text-muted-foreground list-inside list-disc'>
          <li>At least 8 characters</li>
          <li>At least one special character</li>
        </ul>
      </div>
    </div>
  );
}
