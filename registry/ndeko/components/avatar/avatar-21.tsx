import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/registry/ndeko/ui/avatar';
import { Button } from '@/registry/ndeko/ui/button';

const MEMBERS = [
  { name: 'Jordan Hayes', initials: 'JH', image: '/avatars/avatar-03.svg' },
  { name: 'Anna Novak', initials: 'AN', image: '/avatars/avatar-04.svg' },
  { name: 'Lina Haddad', initials: 'LH', image: '/avatars/avatar-05.svg' },
  { name: 'Ama Mensah', initials: 'AM', image: '/avatars/avatar-06.svg' },
];

export default function Avatar21() {
  return (
    <div className='bg-muted flex items-center rounded-full p-0.5'>
      <div className='flex -space-x-3'>
        {MEMBERS.map((member) => (
          <Avatar
            key={member.name}
            className='ring-muted size-10 text-[13px] ring-2'
          >
            <AvatarImage src={member.image} alt={member.name} />
            <AvatarFallback className='bg-card'>
              {member.initials}
            </AvatarFallback>
          </Avatar>
        ))}
      </div>
      <Button
        variant='ghost'
        className='text-muted-foreground hover:text-foreground rounded-full px-3 text-xs hover:bg-transparent'
        aria-label='Show 3 more members'
      >
        +3
      </Button>
    </div>
  );
}
