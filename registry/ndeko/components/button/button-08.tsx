import { ArrowLeftIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';

export default function Button08() {
  return (
    <Button variant='ghost'>
      <ArrowLeftIcon className='-ms-1 opacity-60 transition-transform group-hover/button:-translate-x-0.5' />
      Back
    </Button>
  );
}
