import { ChevronDownIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';

export default function Button11() {
  return (
    <Button>
      Export
      <ChevronDownIcon className='-me-1 opacity-60' />
    </Button>
  );
}
