import { ChevronDownIcon, PinIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';

const SEGMENT =
  'rounded-none first:rounded-s-full last:rounded-e-full focus-visible:z-10';

export default function Button38() {
  return (
    <div className='inline-flex -space-x-px'>
      <Button size='icon' aria-label='Options' className={SEGMENT}>
        <ChevronDownIcon />
      </Button>
      <Button className={SEGMENT}>
        <PinIcon className='-ms-1 opacity-60' />
        Pinned
      </Button>
    </div>
  );
}
