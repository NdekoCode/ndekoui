import { Avatar } from '@/registry/ndeko/ui/avatar';
import { Badge } from '@/registry/ndeko/ui/badge';

export default function Avatar10() {
  return (
    <div className='relative inline-flex'>
      <Avatar
        className='rounded-md'
        seed='Kelly King'
        role='img'
        aria-label='Kelly King'
      />
      <Badge className='bg-primary text-primary-foreground ring-card absolute -top-2 left-full min-w-5 -translate-x-3 px-1 tabular-nums ring-2'>
        6<span className='sr-only'> unread messages</span>
      </Badge>
    </div>
  );
}
