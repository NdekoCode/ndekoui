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
  gem: string;
};

const MEMBERS: Member[] = [
  { value: 'frank', name: 'Frank Morris', gem: 'var(--primary)' },
  { value: 'xavier', name: 'Xavier Guerra', gem: 'var(--info)' },
  { value: 'anne', name: 'Anne Kelley', gem: 'var(--success)' },
];

function initialOf(name: string) {
  return name.charAt(0);
}

function MemberName({ member }: { member: Member }) {
  const gemStyle = { '--gem': member.gem } as React.CSSProperties;

  return (
    <span className='flex min-w-0 items-center gap-2'>
      <span
        aria-hidden='true'
        style={gemStyle}
        className='gem-plate inline-flex size-5 shrink-0 items-center justify-center rounded-[5px] text-[10px] font-semibold'
      >
        {initialOf(member.name)}
      </span>
      <span className='truncate'>{member.name}</span>
    </span>
  );
}

const MEMBER_ITEMS = MEMBERS.map((member) => ({
  value: member.value,
  label: <MemberName member={member} />,
}));

export default function Select39() {
  return (
    <Field className='w-full max-w-xs'>
      <FieldLabel>Assignee</FieldLabel>
      <Select items={MEMBER_ITEMS} defaultValue='frank'>
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
