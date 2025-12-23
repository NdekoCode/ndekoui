import { Badge } from '@/registry/ndeko/ui/badge';

export default function Badge10() {
  return (
    <Badge variant='outline' className='gap-1.5'>
      <span
        className='bg-destructive size-1.5 rounded-full'
        aria-hidden='true'
      />
      Failed
    </Badge>
  );
}
