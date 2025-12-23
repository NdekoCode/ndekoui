import { CheckIcon } from '@/registry/ndeko/lib/icons';
import { Badge } from '@/registry/ndeko/ui/badge';

export default function Badge07() {
  return (
    <Badge variant='outline'>
      <CheckIcon strokeWidth={2.5} className='text-success-foreground' />
      Verified
    </Badge>
  );
}
