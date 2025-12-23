import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/registry/ndeko/ui/avatar';

export default function Avatar01() {
  return (
    <Avatar>
      <AvatarImage src='/avatars/avatar-07.svg' alt='Kelly King' />
      <AvatarFallback>KK</AvatarFallback>
    </Avatar>
  );
}
