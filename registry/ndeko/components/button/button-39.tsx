import { ChevronDownIcon, GitForkIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';

const SEGMENT =
  'rounded-none first:rounded-s-full last:rounded-e-full focus-visible:z-10';

export default function Button39() {
  return (
    <div className='inline-flex -space-x-px'>
      <Button className={SEGMENT}>
        <GitForkIcon className='opacity-60' />
        Fork
        <span className='bg-primary-foreground/15 text-primary-foreground ms-1 -me-1 inline-flex h-5 min-w-5 items-center justify-center rounded-[5px] px-1 text-[11px] font-medium tabular-nums'>
          18
        </span>
      </Button>
      <Button size='icon' aria-label='Options' className={SEGMENT}>
        <ChevronDownIcon />
      </Button>
    </div>
  );
}
