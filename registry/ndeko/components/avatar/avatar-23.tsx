import { Avatar } from '@/registry/ndeko/ui/avatar';

const MEMBERS = [
  { name: 'Jordan Hayes' },
  { name: 'Anna Novak' },
  { name: 'Lina Haddad' },
  { name: 'Ama Mensah' },
];

export default function Avatar23() {
  return (
    <div className='bg-card hairline-ring ring-border flex items-center rounded-full p-1 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
      <div className='flex -space-x-1.5'>
        {MEMBERS.map((member) => (
          <Avatar
            key={member.name}
            className='ring-card size-5 ring-1'
            seed={member.name}
            role='img'
            aria-label={member.name}
          />
        ))}
      </div>
      <p className='text-muted-foreground px-2 text-xs'>
        <span className='text-foreground font-medium'>Jordan, Anna</span> and 2
        others joined this week
      </p>
    </div>
  );
}
