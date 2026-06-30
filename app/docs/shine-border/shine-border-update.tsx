import { ShineBorder } from '@/components/core/shine-border';
import { RocketIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';

export function ShineBorderUpdate() {
  return (
    <div className='bg-card hairline-ring ring-border relative w-full max-w-sm rounded-xl p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
      <div className='flex items-start gap-3'>
        <span className='gem-plate flex size-9 shrink-0 items-center justify-center rounded-lg [--gem:var(--primary)]'>
          <RocketIcon className='size-4' />
        </span>
        <div className='min-w-0'>
          <p className='text-sm font-medium'>Version 4.2 is ready</p>
          <p className='text-muted-foreground mt-0.5 text-xs'>
            Restart the app to get offline mode and faster search
          </p>
        </div>
      </div>
      <div className='mt-4 flex justify-end gap-2'>
        <Button variant='ghost' size='sm'>
          Later
        </Button>
        <Button size='sm'>Restart now</Button>
      </div>
      <ShineBorder />
    </div>
  );
}
