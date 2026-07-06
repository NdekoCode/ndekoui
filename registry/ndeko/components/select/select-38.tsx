import { Avatar } from '@/registry/ndeko/ui/avatar';
import { Field, FieldLabel } from '@/registry/ndeko/ui/field';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/registry/ndeko/ui/select';

type Member = {
  value: string;
  name: string;
};

const MEMBERS: Member[] = [
  { value: 'jenny', name: 'Jenny Hamilton' },
  { value: 'paul', name: 'Paul Smith' },
  { value: 'luna', name: 'Luna Wyen' },
];

function MemberName({ member }: { member: Member }) {
  return (
    <span className='flex min-w-0 items-center gap-2'>
      <Avatar aria-hidden='true' className='size-5' seed={member.name} />
      <span className='truncate'>{member.name}</span>
    </span>
  );
}

const MEMBER_ITEMS = MEMBERS.map((member) => ({
  value: member.value,
  label: <MemberName member={member} />,
}));

export default function Select38() {
  return (
    <Field className='w-full max-w-xs'>
      <FieldLabel>Assignee</FieldLabel>
      <Select items={MEMBER_ITEMS} defaultValue='jenny'>
        <SelectTrigger className='ps-1.5'>
          <SelectValue placeholder='Pick a team member' />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Team members</SelectLabel>
            {MEMBERS.map((member) => (
              <SelectItem
                key={member.value}
                value={member.value}
                label={member.name}
              >
                <MemberName member={member} />
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </Field>
  );
}
