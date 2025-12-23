import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/registry/ndeko/ui/avatar';

const MEMBERS = [
  { name: 'Jordan Hayes', initials: 'JH', image: '/avatars/avatar-03.svg' },
  { name: 'Anna Novak', initials: 'AN', image: '/avatars/avatar-04.svg' },
  { name: 'Lina Haddad', initials: 'LH', image: '/avatars/avatar-05.svg' },
  { name: 'Ama Mensah', initials: 'AM', image: '/avatars/avatar-06.svg' },
];

export default function Avatar16() {
  return (
    <div className='flex -space-x-3'>
      {MEMBERS.map((member) => (
        <Avatar
          key={member.name}
          className='ring-card size-10 text-[13px] ring-2'
        >
          <AvatarImage src={member.image} alt={member.name} />
          <AvatarFallback>{member.initials}</AvatarFallback>
        </Avatar>
      ))}
    </div>
  );
}
