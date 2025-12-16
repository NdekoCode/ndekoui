import { LoaderIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';

export default function Button13() {
  return (
    <Button disabled>
      <LoaderIcon className='-ms-1 animate-spin' />
      Saving
    </Button>
  );
}
