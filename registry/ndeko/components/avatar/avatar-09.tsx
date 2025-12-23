import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/registry/ndeko/ui/avatar';
import { Badge } from '@/registry/ndeko/ui/badge';

export default function Avatar09() {
  return (
    <div className='relative inline-flex'>
      <Avatar>
        <AvatarImage src='/avatars/avatar-07.svg' alt='Kelly King' />
        <AvatarFallback>KK</AvatarFallback>
      </Avatar>
      <Badge className='bg-primary text-primary-foreground ring-card absolute -top-1.5 left-full min-w-5 -translate-x-3.5 px-1 tabular-nums ring-2'>
        6<span className='sr-only'> unread messages</span>
      </Badge>
    </div>
  );
}
