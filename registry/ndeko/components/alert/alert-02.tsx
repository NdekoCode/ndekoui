import { StatusOrb } from '@/registry/ndeko/ui/status-orb';

export default function Alert02() {
  return (
    <div
      role='alert'
      className='bg-warning/10 text-warning-foreground hairline-ring ring-warning/25 flex items-start gap-3 rounded-xl px-4 py-2.5'
    >
      <StatusOrb tone='warning' size='sm' />
      <p className='py-0.5 text-[13px] leading-5'>
        Some details are missing from your profile.
      </p>
    </div>
  );
}
