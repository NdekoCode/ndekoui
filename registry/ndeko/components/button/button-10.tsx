import { ArrowRightIcon, MailIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';

export default function Button10() {
  return (
    <Button variant='secondary'>
      <MailIcon className='-ms-1 opacity-60' />
      Email
      <ArrowRightIcon className='-me-1 opacity-60 transition-transform group-hover/button:translate-x-0.5' />
    </Button>
  );
}
