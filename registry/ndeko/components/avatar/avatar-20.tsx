import { Avatar } from '@/registry/ndeko/ui/avatar';
import { Button } from '@/registry/ndeko/ui/button';

const MEMBERS = [
  { name: 'Jordan Hayes' },
  { name: 'Anna Novak' },
  { name: 'Lina Haddad' },
  { name: 'Ama Mensah' },
];

export default function Avatar20() {
  return (
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
      <Button
        variant='secondary'
        size='icon-lg'
        className='bg-muted text-muted-foreground hover:bg-muted hover:text-foreground ring-card size-10 text-xs ring-2'
        aria-label='Show 3 more members'
      >
        +3
      </Button>
    </div>
  );
}
