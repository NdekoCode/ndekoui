import { Badge } from '@/registry/ndeko/ui/badge';

export default function Badge08() {
  return (
    <Badge variant='outline' className='gap-1.5'>
      <span className='bg-success size-1.5 rounded-full' aria-hidden='true' />
      Active
    </Badge>
  );
}
