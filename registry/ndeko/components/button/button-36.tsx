import { QrCodeIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';

const SEGMENT =
  'rounded-none first:rounded-s-full last:rounded-e-full focus-visible:z-10';

export default function Button36() {
  return (
    <div className='inline-flex -space-x-px'>
      <Button
        size='icon'
        aria-label='Sign in with a QR code'
        className={SEGMENT}
      >
        <QrCodeIcon />
      </Button>
      <Button className={SEGMENT}>Sign in</Button>
    </div>
  );
}
