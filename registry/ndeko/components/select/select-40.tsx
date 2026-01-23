import { Avatar, AvatarFallback } from '@/registry/ndeko/ui/avatar';
import { Field, FieldLabel } from '@/registry/ndeko/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/registry/ndeko/ui/select';

type Member = {
  value: string;
  name: string;
  initials: string;
  handle: string;
};

const MEMBERS: Member[] = [
  {
    value: 'jenny',
    name: 'Jenny Hamilton',
    initials: 'JH',
    handle: '@jennycodes',
  },
  { value: 'paul', name: 'Paul Smith', initials: 'PS', handle: '@paulsmith' },
  { value: 'luna', name: 'Luna Wyen', initials: 'LW', handle: '@wyen.luna' },
];

function MemberPortrait({ member }: { member: Member }) {
  return (
    <span className='flex min-w-0 items-center gap-2.5'>
      <Avatar aria-hidden='true'>
        <AvatarFallback>{member.initials}</AvatarFallback>
      </Avatar>
      <span className='flex min-w-0 flex-col gap-0.5'>
        <span className='truncate font-medium'>{member.name}</span>
        <span className='text-muted-foreground truncate text-xs'>
          {member.handle}
        </span>
      </span>
    </span>
  );
}

const MEMBER_ITEMS = MEMBERS.map((member) => ({
  value: member.value,
  label: <MemberPortrait member={member} />,
}));

export default function Select40() {
  return (
    <Field className='w-full max-w-xs'>
      <FieldLabel>Reviewer</FieldLabel>
      <Select items={MEMBER_ITEMS} defaultValue='jenny'>
        <SelectTrigger className='h-auto py-1.5 ps-1.5'>
          <SelectValue placeholder='Pick a reviewer' />
        </SelectTrigger>
        <SelectContent>
          {MEMBERS.map((member) => (
            <SelectItem
              key={member.value}
              value={member.value}
              label={member.name}
              className='h-auto py-1.5'
            >
              <MemberPortrait member={member} />
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}
