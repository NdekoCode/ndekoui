import { MagicCard } from '@/components/core/magic-card';
import { ShieldCheckIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';

export function MagicCardNeutral() {
  return (
    <div className='w-full max-w-sm p-6'>
      <MagicCard tint='neutral' proximity={160} className='p-5'>
        <span className='keycap-3d text-muted-foreground flex size-9 items-center justify-center rounded-lg'>
          <ShieldCheckIcon className='size-4' />
        </span>
        <h3 className='mt-4 text-sm font-medium'>Two-step sign in</h3>
        <p className='text-muted-foreground mt-1 text-[13px]'>
          Ask for a code from an authenticator app each time someone signs in
          from a new device
        </p>
        <Button variant='outline' size='sm' className='mt-4'>
          Turn on
        </Button>
      </MagicCard>
    </div>
  );
}
