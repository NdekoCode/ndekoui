import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/registry/ndeko/ui/avatar';

export default function Avatar04() {
  return (
    <Avatar className='rounded-md'>
      <AvatarImage src='/avatars/avatar-07.svg' alt='Kelly King' />
      <AvatarFallback>KK</AvatarFallback>
    </Avatar>
  );
}
