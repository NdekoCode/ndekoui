import { PrinterIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';
import { Kbd } from '@/registry/ndeko/ui/kbd';

export default function Button16() {
  return (
    <Button variant='outline'>
      <PrinterIcon className='-ms-1 opacity-60' />
      Print
      <Kbd className='ms-1 -me-1'>⌘P</Kbd>
    </Button>
  );
}
