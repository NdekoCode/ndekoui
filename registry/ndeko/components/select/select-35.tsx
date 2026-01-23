import { ReactBrandIcon } from '@/registry/ndeko/lib/icons';
import { Field, FieldLabel } from '@/registry/ndeko/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/registry/ndeko/ui/select';

function NextjsMark(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth={1.75}
      strokeLinecap='round'
      strokeLinejoin='round'
      aria-hidden='true'
      {...props}
    >
      <circle cx='12' cy='12' r='9' />
      <path d='M9 15.5v-7l7.5 10' />
      <path d='M15 8.5v4.5' />
    </svg>
  );
}

function GatsbyMark(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth={1.75}
      strokeLinecap='round'
      strokeLinejoin='round'
      aria-hidden='true'
      {...props}
    >
      <circle cx='12' cy='12' r='9' />
      <path d='M3.5 13.5 10.5 20.5' />
      <path d='M6 6.5 17.5 18' />
      <path d='M13 12h8' />
    </svg>
  );
}

type Framework = {
  value: string;
  name: string;
  Mark: React.ComponentType<{ className?: string }>;
};

const FRAMEWORKS: Framework[] = [
  { value: 'react', name: 'React', Mark: ReactBrandIcon },
  { value: 'nextjs', name: 'Next.js', Mark: NextjsMark },
  { value: 'gatsby', name: 'Gatsby', Mark: GatsbyMark },
];

function FrameworkName({ framework }: { framework: Framework }) {
  const { Mark } = framework;

  return (
    <span className='flex min-w-0 items-center gap-2'>
      <Mark className='text-muted-foreground size-4 shrink-0' />
      <span className='truncate'>{framework.name}</span>
    </span>
  );
}

const FRAMEWORK_ITEMS = FRAMEWORKS.map((framework) => ({
  value: framework.value,
  label: <FrameworkName framework={framework} />,
}));

export default function Select35() {
  return (
    <Field className='w-full max-w-xs'>
      <FieldLabel>Framework</FieldLabel>
      <Select items={FRAMEWORK_ITEMS} defaultValue='nextjs'>
        <SelectTrigger>
          <SelectValue placeholder='Pick a framework' />
        </SelectTrigger>
        <SelectContent>
          {FRAMEWORKS.map((framework) => (
            <SelectItem
              key={framework.value}
              value={framework.value}
              label={framework.name}
            >
              <FrameworkName framework={framework} />
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}
