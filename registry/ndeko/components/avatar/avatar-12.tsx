import { Avatar } from '@/registry/ndeko/ui/avatar';

const MEMBERS = [
  { name: 'Jordan Hayes' },
  { name: 'Anna Novak' },
  { name: 'Lina Haddad' },
  { name: 'Ama Mensah' },
];

export default function Avatar12() {
  return (
    <div className='flex -space-x-[0.45rem]'>
      {MEMBERS.map((member) => (
        <Avatar
          key={member.name}
          className='ring-card size-6 ring-1'
          seed={member.name}
          role='img'
          aria-label={member.name}
        />
      ))}
    </div>
  );
}
