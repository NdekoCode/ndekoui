import { DownloadIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';

export default function Button07() {
  return (
    <Button variant='outline'>
      Export
      <DownloadIcon className='-me-1 opacity-60' />
    </Button>
  );
}
