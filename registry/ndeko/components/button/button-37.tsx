import { SquareArrowOutUpRightIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';

const SEGMENT =
  'rounded-none first:rounded-s-full last:rounded-e-full focus-visible:z-10';

export default function Button37() {
  return (
    <div className='inline-flex -space-x-px'>
      <Button variant='outline' className={SEGMENT}>
        Preview
      </Button>
      <Button
        variant='outline'
        size='icon'
        aria-label='Open link'
        className={SEGMENT}
      >
        <SquareArrowOutUpRightIcon />
      </Button>
    </div>
  );
}
