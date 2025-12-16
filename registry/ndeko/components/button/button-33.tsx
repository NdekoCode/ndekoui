import { EllipsisIcon, FilesIcon, FilmIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';

const SEGMENT =
  'rounded-none first:rounded-s-full last:rounded-e-full focus-visible:z-10';

export default function Button33() {
  return (
    <div className='inline-flex -space-x-px'>
      <Button variant='outline' className={SEGMENT}>
        <FilesIcon className='-ms-1 opacity-60' />
        Files
      </Button>
      <Button variant='outline' className={SEGMENT}>
        <FilmIcon className='-ms-1 opacity-60' />
        Media
      </Button>
      <Button
        variant='outline'
        size='icon'
        aria-label='More options'
        className={SEGMENT}
      >
        <EllipsisIcon />
      </Button>
    </div>
  );
}
