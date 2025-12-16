import {
  FlipHorizontalIcon,
  FlipVerticalIcon,
} from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';

const SEGMENT =
  'rounded-none first:rounded-s-full last:rounded-e-full focus-visible:z-10';

export default function Button31() {
  return (
    <div className='inline-flex -space-x-px'>
      <Button
        variant='outline'
        size='icon'
        aria-label='Flip horizontal'
        className={SEGMENT}
      >
        <FlipHorizontalIcon />
      </Button>
      <Button
        variant='outline'
        size='icon'
        aria-label='Flip vertical'
        className={SEGMENT}
      >
        <FlipVerticalIcon />
      </Button>
    </div>
  );
}
