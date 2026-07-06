import { Avatar } from '@/registry/ndeko/ui/avatar';
import { Button } from '@/registry/ndeko/ui/button';

const MEMBERS = [
  { name: 'Jordan Hayes' },
  { name: 'Anna Novak' },
  { name: 'Lina Haddad' },
  { name: 'Ama Mensah' },
];

export default function Avatar22() {
  return (
    <div className='bg-card hairline-ring ring-border flex items-center rounded-full p-1 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
      <div className='flex -space-x-3'>
        {MEMBERS.map((member) => (
          <Avatar
            key={member.name}
            className='ring-card size-10 ring-2'
            seed={member.name}
            role='img'
            aria-label={member.name}
          />
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
