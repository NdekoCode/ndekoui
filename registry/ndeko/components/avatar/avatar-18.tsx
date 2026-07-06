import { Avatar } from '@/registry/ndeko/ui/avatar';

const MEMBERS = [
  { name: 'Jordan Hayes' },
  { name: 'Anna Novak' },
  { name: 'Lina Haddad' },
  { name: 'Ama Mensah' },
];

export default function Avatar18() {
  return (
    <div className='flex -space-x-[1.2rem]'>
      {MEMBERS.map((member) => (
        <Avatar
          key={member.name}
          className='ring-card size-16 ring-2'
          seed={member.name}
          role='img'
          aria-label={member.name}
        />
      ))}
    </div>
  );
}
