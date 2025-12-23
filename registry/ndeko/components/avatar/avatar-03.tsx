import { UserRoundIcon } from '@/registry/ndeko/lib/icons';
import { Avatar, AvatarFallback } from '@/registry/ndeko/ui/avatar';

export default function Avatar03() {
  return (
    <Avatar>
      <AvatarFallback>
        <UserRoundIcon className='size-4 opacity-60' />
      </AvatarFallback>
    </Avatar>
  );
}
