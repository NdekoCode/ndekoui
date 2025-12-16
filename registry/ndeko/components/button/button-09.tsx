import { ArrowRightIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';

export default function Button09() {
  return (
    <Button>
      Continue
      <ArrowRightIcon className='-me-1 opacity-60 transition-transform group-hover/button:translate-x-0.5' />
    </Button>
  );
}
