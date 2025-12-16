import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  CircleIcon,
} from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';

export default function Button53() {
  return (
    <div className='inline-grid w-fit grid-cols-3 gap-1'>
      <Button
        variant='outline'
        size='icon'
        aria-label='Pan camera up'
        className='col-start-2'
      >
        <ChevronUpIcon />
      </Button>
      <Button
        variant='outline'
        size='icon'
        aria-label='Pan camera left'
        className='col-start-1'
      >
        <ChevronLeftIcon />
      </Button>
      <div className='flex items-center justify-center' aria-hidden='true'>
        <CircleIcon className='opacity-60' />
      </div>
      <Button variant='outline' size='icon' aria-label='Pan camera right'>
        <ChevronRightIcon />
      </Button>
      <Button
        variant='outline'
        size='icon'
        aria-label='Pan camera down'
        className='col-start-2'
      >
        <ChevronDownIcon />
      </Button>
    </div>
  );
}
