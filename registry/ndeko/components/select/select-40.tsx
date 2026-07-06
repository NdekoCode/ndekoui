import { Avatar } from '@/registry/ndeko/ui/avatar';
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
  handle: string;
};

const MEMBERS: Member[] = [
  {
    value: 'jenny',
    name: 'Jenny Hamilton',
    handle: '@jennycodes',
  },
  { value: 'paul', name: 'Paul Smith', handle: '@paulsmith' },
  { value: 'luna', name: 'Luna Wyen', handle: '@wyen.luna' },
];

function MemberPortrait({ member }: { member: Member }) {
  return (
    <span className='flex min-w-0 items-center gap-2.5'>
      <Avatar aria-hidden='true' seed={member.name} />
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
