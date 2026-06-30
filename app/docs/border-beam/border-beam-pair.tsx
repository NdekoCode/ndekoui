import { BorderBeam } from '@/components/core/border-beam';

export function BorderBeamPair() {
  return (
    <div className='bg-card hairline-ring ring-border relative w-full max-w-md rounded-2xl p-5 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
      <p className='text-muted-foreground text-xs'>Drafting a reply</p>
      <div className='mt-3 flex flex-col gap-2' aria-hidden='true'>
        <span className='bg-foreground/10 h-2 w-11/12 rounded-full' />
        <span className='bg-foreground/10 h-2 w-4/5 rounded-full' />
        <span className='bg-foreground/10 h-2 w-2/3 rounded-full' />
      </div>
      <BorderBeam count={2} length={0.18} duration={8} width={1} reverse />
    </div>
  );
}
