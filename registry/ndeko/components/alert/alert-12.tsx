import { StatusOrb } from '@/registry/ndeko/ui/status-orb';

export default function Alert12() {
  return (
    <div
      role='alert'
      className='bg-destructive/10 text-destructive-ink hairline-ring ring-destructive/25 flex items-start gap-3 rounded-xl px-4 py-3'
    >
      <StatusOrb tone='error' size='sm' />
      <div className='flex grow flex-col gap-1 py-0.5 text-[13px] leading-5'>
        <p className='font-medium'>Password does not meet the requirements:</p>
        <ul className='list-inside list-disc opacity-80'>
          <li>At least 8 characters</li>
          <li>At least one special character</li>
        </ul>
      </div>
    </div>
  );
}
