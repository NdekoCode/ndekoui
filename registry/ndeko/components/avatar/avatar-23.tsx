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

export default function Avatar23() {
  return (
    <div className='bg-card hairline-ring ring-border flex items-center rounded-full p-1 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
      <div className='flex -space-x-1.5'>
        {MEMBERS.map((member) => (
          <Avatar
            key={member.name}
            className='ring-card size-5 text-[8px] ring-1'
          >
            <AvatarImage src={member.image} alt={member.name} />
            <AvatarFallback>{member.initials}</AvatarFallback>
          </Avatar>
        ))}
      </div>
      <p className='text-muted-foreground px-2 text-xs'>
        <span className='text-foreground font-medium'>Jordan, Anna</span> and 2
        others joined this week
      </p>
    </div>
  );
}
