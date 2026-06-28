import { Marquee } from '@/components/core/marquee';
import { Chip } from '@/registry/ndeko/ui/chip';

const NEUTRAL = 'var(--muted-foreground)';

const FIRST_ROW = [
  'Design tokens',
  'Keyboard first',
  'Dark mode',
  'Empty states',
  'Release notes',
  'Onboarding',
  'Command menu',
];

const SECOND_ROW = [
  'Accessibility',
  'Motion',
  'Data tables',
  'Date pickers',
  'Forms',
  'Notifications',
  'Charts',
];

function TopicChip({ label }: { label: string }) {
  return (
    <Chip color={NEUTRAL} className='h-7 rounded-md px-2.5 text-[13px]'>
      {label}
    </Chip>
  );
}

export function MarqueeRows() {
  return (
    <div className='flex w-full flex-col gap-3 py-10'>
      <Marquee gap={12} duration={36} className='py-1'>
        {FIRST_ROW.map((label) => (
          <TopicChip key={label} label={label} />
        ))}
      </Marquee>
      <Marquee gap={12} duration={42} reverse className='py-1'>
        {SECOND_ROW.map((label) => (
          <TopicChip key={label} label={label} />
        ))}
      </Marquee>
    </div>
  );
}
