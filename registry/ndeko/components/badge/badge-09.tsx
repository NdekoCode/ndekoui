import { Badge } from '@/registry/ndeko/ui/badge';

export default function Badge09() {
  return (
    <Badge variant='outline' className='gap-1.5'>
      <span className='bg-warning size-1.5 rounded-full' aria-hidden='true' />
      Pending
    </Badge>
  );
}
