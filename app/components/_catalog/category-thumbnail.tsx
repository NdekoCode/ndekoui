import {
  CheckIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsUpDownIcon,
  FolderIcon,
  SearchIcon,
  UploadIcon,
  XIcon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';

const LINE = 'block h-1.5 rounded-full bg-foreground/10';
const STRONG_LINE = 'block h-1.5 rounded-full bg-foreground/25';
const PRIMARY_PILL =
  'block h-5 rounded-full bg-primary shadow-[0_1px_2px_rgb(0_0_0/0.14),inset_0_1px_0_rgb(255_255_255/0.12)]';
const OUTLINE_PILL =
  'block h-5 rounded-full bg-card hairline-ring ring-foreground/15 shadow-[0_1px_2px_rgb(0_0_0/0.05)]';
const FIELD =
  'flex h-6 items-center gap-1.5 rounded-md bg-card px-2 hairline-ring ring-foreground/15 shadow-[0_1px_2px_rgb(0_0_0/0.05)] text-muted-foreground [&_svg]:size-3';
const RAISED = 'surface-raised rounded-lg';
const ICON_CIRCLE =
  'flex size-5 items-center justify-center rounded-full bg-card hairline-ring ring-foreground/15 text-muted-foreground [&_svg]:size-3';
const MINI_ORB =
  'block size-4 shrink-0 rounded-full bg-[radial-gradient(circle_at_50%_18%,color-mix(in_oklab,var(--orb)_62%,white),var(--orb)_58%,color-mix(in_oklab,var(--orb)_82%,black))] shadow-[0_0_0_2px_var(--popover),0_1px_3px_color-mix(in_oklab,var(--orb)_45%,transparent)]';

function Line({ className }: { className: string }) {
  return <span className={cn(LINE, className)} />;
}

function StrongLine({ className }: { className: string }) {
  return <span className={cn(STRONG_LINE, className)} />;
}

function Orb({ color }: { color: string }) {
  const style = { '--orb': color } as React.CSSProperties;
  return <span className={MINI_ORB} style={style} />;
}

function MiniChip({ color, className }: { color: string; className: string }) {
  const style = { '--chip': color } as React.CSSProperties;
  return (
    <span
      className={cn('chip-3d block h-3.5 rounded-[4px]', className)}
      style={style}
    />
  );
}

function MiniCheck({ checked }: { checked: boolean }) {
  if (checked) {
    return (
      <span className='bg-primary text-primary-foreground flex size-3.5 items-center justify-center rounded-[4px] [&_svg]:size-2.5'>
        <CheckIcon strokeWidth={3} />
      </span>
    );
  }
  return (
    <span className='bg-card hairline-ring ring-foreground/25 block size-3.5 rounded-[4px]' />
  );
}

function ButtonThumb() {
  return (
    <div className='flex items-center gap-2'>
      <span className={cn(PRIMARY_PILL, 'w-16')} />
      <span className={cn(OUTLINE_PILL, 'w-14')} />
      <span className={ICON_CIRCLE}>
        <SearchIcon />
      </span>
    </div>
  );
}

function DropdownThumb() {
  return (
    <div className='flex flex-col items-start gap-1.5'>
      <span className={cn(OUTLINE_PILL, 'w-16')} />
      <div className={cn(RAISED, 'flex w-32 flex-col gap-1 p-1')}>
        <div className='bg-foreground/5 flex h-4 items-center gap-1.5 rounded-[4px] px-1.5'>
          <Line className='w-14' />
          <span className='chip-3d ms-auto block size-2.5 rounded-full [--chip:var(--primary)]' />
        </div>
        <div className='flex h-4 items-center px-1.5'>
          <Line className='w-16' />
        </div>
        <div className='flex h-4 items-center px-1.5'>
          <span className='bg-destructive/30 block h-1.5 w-12 rounded-full' />
        </div>
      </div>
    </div>
  );
}

function InputThumb() {
  return (
    <div className='flex w-36 flex-col gap-1.5'>
      <StrongLine className='w-10' />
      <div className={FIELD}>
        <SearchIcon />
        <Line className='w-16' />
      </div>
      <Line className='w-24' />
    </div>
  );
}

function TextareaThumb() {
  return (
    <div className='flex w-36 flex-col gap-1.5'>
      <div className={cn(FIELD, 'h-14 flex-col items-start gap-1.5 py-2')}>
        <Line className='w-24' />
        <Line className='w-20' />
        <Line className='w-12' />
      </div>
      <span className='text-muted-foreground self-end text-[8px] tabular-nums'>
        42/180
      </span>
    </div>
  );
}

function SelectThumb() {
  return (
    <div className='flex w-32 flex-col gap-1.5'>
      <div className={FIELD}>
        <StrongLine className='w-14' />
        <ChevronsUpDownIcon className='ms-auto' />
      </div>
      <div className={cn(RAISED, 'flex flex-col gap-1 p-1')}>
        <div className='flex h-4 items-center px-1.5'>
          <Line className='w-12' />
        </div>
        <div className='bg-foreground/5 flex h-4 items-center rounded-[4px] px-1.5'>
          <Line className='w-16' />
        </div>
      </div>
    </div>
  );
}

function CheckboxThumb() {
  return (
    <div className='flex flex-col gap-2'>
      <div className='flex items-center gap-2'>
        <MiniCheck checked />
        <Line className='w-20' />
      </div>
      <div className='flex items-center gap-2'>
        <MiniCheck checked />
        <Line className='w-16' />
      </div>
      <div className='flex items-center gap-2'>
        <MiniCheck checked={false} />
        <Line className='w-24' />
      </div>
    </div>
  );
}

function RadioThumb() {
  return (
    <div className='flex flex-col gap-2'>
      <div className='flex items-center gap-2'>
        <span className='bg-primary flex size-3.5 items-center justify-center rounded-full'>
          <span className='block size-1.5 rounded-full bg-white' />
        </span>
        <Line className='w-20' />
      </div>
      <div className='flex items-center gap-2'>
        <span className='bg-card hairline-ring ring-foreground/25 block size-3.5 rounded-full' />
        <Line className='w-16' />
      </div>
      <div className='flex items-center gap-2'>
        <span className='bg-card hairline-ring ring-foreground/25 block size-3.5 rounded-full' />
        <Line className='w-24' />
      </div>
    </div>
  );
}

function SwitchThumb() {
  return (
    <div className='flex flex-col gap-2.5'>
      <div className='flex items-center gap-2'>
        <span className='bg-primary flex h-4 w-7 items-center justify-end rounded-full p-0.5'>
          <span className='block size-3 rounded-full bg-white shadow-sm' />
        </span>
        <Line className='w-16' />
      </div>
      <div className='flex items-center gap-2'>
        <span className='bg-foreground/15 flex h-4 w-7 items-center rounded-full p-0.5'>
          <span className='block size-3 rounded-full bg-white shadow-sm' />
        </span>
        <Line className='w-20' />
      </div>
    </div>
  );
}

function SliderThumb() {
  return (
    <div className='flex w-36 items-center gap-2'>
      <div className='bg-foreground/10 relative h-1 flex-1 rounded-full'>
        <span className='bg-primary absolute inset-y-0 left-0 w-3/5 rounded-full' />
        <span className='hairline-ring ring-foreground/15 absolute top-1/2 left-3/5 block size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_1px_3px_rgb(0_0_0/0.18)]' />
      </div>
      <span className='keycap-3d text-muted-foreground flex h-4 items-center rounded-[4px] px-1 text-[8px] font-medium tabular-nums'>
        60
      </span>
    </div>
  );
}

const CALENDAR_DAYS = Array.from({ length: 28 }, (_, index) => index + 1);

function calendarDayClass(day: number) {
  const isPicked = day === 12;
  const isInRange = day > 12 && day < 17;
  if (isPicked) {
    return 'bg-primary';
  }
  if (isInRange) {
    return 'bg-primary/15';
  }
  return 'bg-foreground/[0.07]';
}

function DatePickerThumb() {
  return (
    <div className={cn(RAISED, 'flex flex-col gap-1.5 p-2')}>
      <div className='text-muted-foreground flex items-center justify-between [&_svg]:size-2.5'>
        <ChevronLeftIcon />
        <StrongLine className='w-10' />
        <ChevronRightIcon />
      </div>
      <div className='grid grid-cols-7 gap-1'>
        {CALENDAR_DAYS.map((day) => (
          <span
            key={day}
            className={cn(
              'block size-2.5 rounded-[3px]',
              calendarDayClass(day)
            )}
          />
        ))}
      </div>
    </div>
  );
}

function FileUploadThumb() {
  return (
    <div className='hairline-border border-foreground/25 flex h-20 w-36 flex-col items-center justify-center gap-1.5 rounded-lg border-dashed'>
      <span className={ICON_CIRCLE}>
        <UploadIcon />
      </span>
      <Line className='w-16' />
    </div>
  );
}

function ImageCropperThumb() {
  return (
    <div className='bg-primary/15 relative h-20 w-32 overflow-hidden rounded-lg'>
      <span className='bg-warning/60 absolute top-3 right-5 size-4 rounded-full' />
      <span className='bg-primary/45 absolute -bottom-6 -left-4 h-14 w-24 rounded-[50%]' />
      <span className='bg-primary/30 absolute -right-6 -bottom-8 h-14 w-24 rounded-[50%]' />
      <span className='absolute inset-x-7 inset-y-3 rounded-[3px] border-2 border-white shadow-[0_0_0_999px_rgb(0_0_0/0.3)]' />
    </div>
  );
}

function DialogThumb() {
  return (
    <div className='bg-foreground/[0.06] flex h-24 w-40 items-center justify-center rounded-lg'>
      <div
        className={cn(RAISED, 'flex w-28 flex-col gap-1.5 rounded-xl p-2.5')}
      >
        <StrongLine className='w-14' />
        <Line className='w-20' />
        <div className='mt-1 flex justify-end gap-1'>
          <span className={cn(OUTLINE_PILL, 'h-3.5 w-8')} />
          <span className={cn(PRIMARY_PILL, 'h-3.5 w-9')} />
        </div>
      </div>
    </div>
  );
}

function PopoverThumb() {
  return (
    <div className='flex flex-col items-center gap-1.5'>
      <div
        className={cn(RAISED, 'flex w-28 flex-col gap-1.5 rounded-xl p-2.5')}
      >
        <StrongLine className='w-12' />
        <Line className='w-20' />
        <div className={cn(FIELD, 'h-4')}>
          <Line className='w-10' />
        </div>
      </div>
      <span className={cn(OUTLINE_PILL, 'w-14')} />
    </div>
  );
}

function TooltipThumb() {
  return (
    <div className='flex flex-col items-center gap-1.5'>
      <span className='from-popover hairline-ring ring-border flex h-5 items-center rounded-md bg-linear-to-b to-[color-mix(in_oklab,var(--popover),var(--primary)_9%)] px-2 shadow-md shadow-black/6'>
        <Line className='w-14' />
      </span>
      <span className={ICON_CIRCLE}>
        <SearchIcon />
      </span>
    </div>
  );
}

function NavbarThumb() {
  return (
    <div className='bg-card hairline-ring ring-border flex w-44 items-center gap-2 rounded-lg px-2 py-1.5'>
      <span className='gem-plate block size-3.5 rounded-[4px] [--gem:var(--primary)]' />
      <span className='bg-foreground/5 flex h-3.5 items-center rounded-[4px] px-1'>
        <Line className='w-6' />
      </span>
      <Line className='w-6' />
      <Line className='w-6' />
      <span className={cn(PRIMARY_PILL, 'ms-auto h-3.5 w-9')} />
    </div>
  );
}

function BreadcrumbThumb() {
  return (
    <div className='text-muted-foreground/60 flex items-center gap-1.5 [&_svg]:size-2.5'>
      <Line className='w-8' />
      <ChevronRightIcon />
      <Line className='w-10' />
      <ChevronRightIcon />
      <StrongLine className='w-12' />
    </div>
  );
}

function PaginationThumb() {
  return (
    <div className='text-muted-foreground flex items-center gap-1 text-[8px] font-medium tabular-nums'>
      <span className='flex size-5 items-center justify-center [&_svg]:size-3'>
        <ChevronLeftIcon />
      </span>
      <span className='flex size-5 items-center justify-center'>1</span>
      <span className='bg-card text-foreground hairline-ring ring-foreground/15 flex size-5 items-center justify-center rounded-full shadow-[0_1px_2px_rgb(0_0_0/0.05)]'>
        2
      </span>
      <span className='flex size-5 items-center justify-center'>3</span>
      <span className='flex size-5 items-center justify-center [&_svg]:size-3'>
        <ChevronRightIcon />
      </span>
    </div>
  );
}

function TabsThumb() {
  return (
    <div className='flex flex-col items-start gap-3'>
      <div className='bg-foreground/[0.05] flex items-center gap-0.5 rounded-md p-0.5'>
        <span className='bg-card hairline-ring ring-foreground/10 flex h-4 w-10 items-center justify-center rounded-[4px] shadow-[0_1px_2px_rgb(0_0_0/0.08)]'>
          <StrongLine className='w-6' />
        </span>
        <span className='flex h-4 w-10 items-center justify-center'>
          <Line className='w-6' />
        </span>
        <span className='flex h-4 w-10 items-center justify-center'>
          <Line className='w-6' />
        </span>
      </div>
      <div className='relative flex gap-3 pb-1.5'>
        <StrongLine className='w-8' />
        <Line className='w-8' />
        <Line className='w-8' />
        <span className='bg-primary absolute bottom-0 left-0 block h-0.5 w-8 rounded-full' />
      </div>
    </div>
  );
}

function StepperThumb() {
  return (
    <div className='flex w-40 items-center'>
      <span className='bg-primary text-primary-foreground flex size-4 items-center justify-center rounded-full [&_svg]:size-2.5'>
        <CheckIcon strokeWidth={3} />
      </span>
      <span className='bg-primary mx-1 block h-0.5 flex-1 rounded-full' />
      <span className='bg-primary text-primary-foreground flex size-4 items-center justify-center rounded-full text-[8px] font-medium'>
        2
      </span>
      <span className='bg-foreground/10 mx-1 block h-0.5 flex-1 rounded-full' />
      <span className='bg-foreground/[0.07] text-muted-foreground flex size-4 items-center justify-center rounded-full text-[8px] font-medium'>
        3
      </span>
    </div>
  );
}

const TABLE_STATUSES = [
  'var(--success)',
  'var(--warning)',
  'var(--info)',
  'var(--success)',
];

function TableThumb() {
  return (
    <div className='bg-card hairline-ring ring-border hairline-divide-y divide-border flex w-44 flex-col rounded-lg px-2 py-1'>
      <div className='flex h-4 items-center gap-2'>
        <Line className='bg-foreground/15 w-10' />
        <Line className='bg-foreground/15 ms-auto w-6' />
      </div>
      {TABLE_STATUSES.map((color, index) => (
        <div key={index} className='flex h-4 items-center gap-2'>
          <Line className='w-14' />
          <MiniChip color={color} className='ms-auto w-7' />
        </div>
      ))}
    </div>
  );
}

function TreeThumb() {
  return (
    <div className='text-muted-foreground flex flex-col gap-1.5 [&_svg]:size-3'>
      <div className='flex items-center gap-1'>
        <ChevronDownIcon />
        <FolderIcon />
        <StrongLine className='w-14' />
      </div>
      <div className='flex items-center gap-1 ps-4'>
        <ChevronDownIcon />
        <FolderIcon />
        <Line className='w-12' />
      </div>
      <div className='bg-primary/[0.08] flex items-center gap-1 rounded-[4px] py-0.5 ps-11 pe-1'>
        <Line className='w-12' />
      </div>
      <div className='flex items-center gap-1 ps-11'>
        <Line className='w-16' />
      </div>
    </div>
  );
}

function TimelineThumb() {
  return (
    <div className='relative flex flex-col gap-3 ps-5'>
      <span className='bg-primary/15 absolute top-1 bottom-1 left-1.5 block w-0.5 rounded-full' />
      <span className='bg-primary absolute top-1 left-1.5 block h-6 w-0.5 rounded-full' />
      {['w-20', 'w-16', 'w-24'].map((width, index) => (
        <div key={width} className='relative flex flex-col gap-1'>
          <span
            className={cn(
              'bg-card absolute top-0 -left-[18px] block size-2.5 rounded-full border-2',
              index < 2 && 'border-primary',
              index >= 2 && 'border-primary/25'
            )}
          />
          <StrongLine className='w-10' />
          <Line className={width} />
        </div>
      ))}
    </div>
  );
}

function AccordionThumb() {
  return (
    <div className='hairline-divide-y divide-border text-muted-foreground flex w-40 flex-col [&_svg]:size-3'>
      <div className='flex h-5 items-center'>
        <StrongLine className='w-20' />
        <ChevronDownIcon className='ms-auto' />
      </div>
      <div className='flex flex-col gap-1 py-1.5'>
        <div className='flex items-center'>
          <StrongLine className='w-24' />
          <ChevronDownIcon className='ms-auto rotate-180' />
        </div>
        <Line className='w-32' />
        <Line className='w-20' />
      </div>
      <div className='flex h-5 items-center'>
        <StrongLine className='w-16' />
        <ChevronDownIcon className='ms-auto' />
      </div>
    </div>
  );
}

const AVATAR_TINTS = [
  'bg-[color-mix(in_oklab,var(--primary)_25%,var(--muted))]',
  'bg-[color-mix(in_oklab,var(--success)_25%,var(--muted))]',
  'bg-[color-mix(in_oklab,var(--warning)_30%,var(--muted))]',
];

function AvatarThumb() {
  return (
    <div className='flex -space-x-1.5'>
      {AVATAR_TINTS.map((tint) => (
        <span
          key={tint}
          className={cn('ring-card block size-7 rounded-full ring-2', tint)}
        />
      ))}
      <span className='bg-muted text-muted-foreground ring-card flex size-7 items-center justify-center rounded-full text-[8px] font-medium ring-2'>
        +3
      </span>
    </div>
  );
}

function BadgeThumb() {
  return (
    <div className='grid grid-cols-3 gap-1.5'>
      <MiniChip color='var(--primary)' className='w-9' />
      <MiniChip color='var(--success)' className='w-9' />
      <MiniChip color='var(--warning)' className='w-9' />
      <MiniChip color='var(--info)' className='w-9' />
      <MiniChip color='var(--destructive)' className='w-9' />
      <MiniChip color='var(--muted-foreground)' className='w-9' />
    </div>
  );
}

function EventCalendarThumb() {
  return (
    <div className='bg-card hairline-ring ring-border grid w-44 grid-cols-5 gap-1 rounded-lg p-1.5'>
      <MiniChip color='var(--primary)' className='col-span-2 h-4' />
      <span />
      <MiniChip color='var(--success)' className='col-span-2 h-4' />
      <span />
      <MiniChip color='var(--warning)' className='col-span-3 h-4' />
      <span />
      <MiniChip color='var(--info)' className='h-4' />
      <span />
      <span />
      <MiniChip color='var(--primary)' className='col-span-2 h-4' />
    </div>
  );
}

function AlertThumb() {
  return (
    <div className='bg-card hairline-ring ring-border flex w-40 items-center gap-2 rounded-lg p-2'>
      <Orb color='var(--success)' />
      <div className='flex flex-1 flex-col gap-1'>
        <StrongLine className='w-14' />
        <Line className='w-20' />
      </div>
    </div>
  );
}

function BannerThumb() {
  return (
    <div className='surface-brand text-muted-foreground flex w-44 items-center gap-2 rounded-lg px-2 py-1.5 [&_svg]:size-2.5'>
      <StrongLine className='w-20' />
      <span className={cn(PRIMARY_PILL, 'ms-auto h-3.5 w-9')} />
      <XIcon />
    </div>
  );
}

function NotificationThumb() {
  return (
    <div className='relative h-16 w-40'>
      <div
        className={cn(
          RAISED,
          'absolute inset-x-3 top-0 h-10 rounded-xl opacity-60'
        )}
      />
      <div
        className={cn(
          RAISED,
          'absolute inset-x-0 top-3 flex items-center gap-2 rounded-xl p-2'
        )}
      >
        <Orb color='var(--info)' />
        <div className='flex flex-1 flex-col gap-1'>
          <StrongLine className='w-14' />
          <Line className='w-20' />
        </div>
      </div>
    </div>
  );
}

const AVATAR_DOT = 'keycap-3d block size-4 shrink-0 rounded-full';

function ActivityThumb() {
  return (
    <div className='flex w-44 flex-col gap-2.5'>
      <div className='flex items-center gap-2'>
        <span className={AVATAR_DOT} />
        <StrongLine className='w-10' />
        <Line className='w-16' />
      </div>
      <div className='flex items-center gap-2'>
        <span className={AVATAR_DOT} />
        <span className='bg-foreground/10 block h-3.5 w-9 rounded-[4px]' />
        <ChevronRightIcon className='text-muted-foreground size-2.5' />
        <MiniChip color='var(--primary)' className='w-9' />
      </div>
      <div className='flex items-center gap-2'>
        <span className={AVATAR_DOT} />
        <StrongLine className='w-12' />
        <Line className='w-12' />
      </div>
    </div>
  );
}

function SubtaskThumb() {
  return (
    <div className='flex w-40 flex-col gap-2.5'>
      <div className='flex items-center gap-2'>
        <span className='border-primary border-e-foreground/15 border-b-foreground/15 block size-4 rounded-full border-2' />
        <StrongLine className='w-8' />
      </div>
      <div className='flex flex-col gap-2'>
        <div className='flex items-center gap-2'>
          <MiniCheck checked />
          <span className='bg-foreground/25 block h-px w-20' />
        </div>
        <div className='flex items-center gap-2'>
          <MiniCheck checked />
          <span className='bg-foreground/25 block h-px w-16' />
        </div>
        <div className='flex items-center gap-2'>
          <MiniCheck checked={false} />
          <Line className='w-24' />
        </div>
        <div className='flex items-center gap-2'>
          <MiniCheck checked={false} />
          <Line className='w-14' />
        </div>
      </div>
    </div>
  );
}

function CommentThumb() {
  return (
    <div className='flex w-44 flex-col gap-2'>
      <div className='flex gap-2'>
        <span className={AVATAR_DOT} />
        <div className='flex flex-1 flex-col gap-1.5'>
          <StrongLine className='w-14' />
          <div className='flex items-center gap-1'>
            <Line className='w-8' />
            <span className='bg-primary/15 block h-2.5 w-9 rounded-[3px]' />
            <Line className='w-10' />
          </div>
          <div className='flex items-center gap-1'>
            <span className='bg-primary/15 ring-primary/30 block h-3.5 w-7 rounded-full ring-1' />
            <span className={cn(OUTLINE_PILL, 'h-3.5 w-5')} />
          </div>
        </div>
      </div>
      <div className='ms-6 flex items-center gap-2'>
        <span className='keycap-3d block size-3 shrink-0 rounded-full' />
        <Line className='w-20' />
      </div>
    </div>
  );
}

function TeamsThumb() {
  const gemStyle = { '--gem': 'var(--primary)' } as React.CSSProperties;
  const presenceStyle = { '--chip': 'var(--success)' } as React.CSSProperties;
  return (
    <div className='flex w-44 flex-col gap-3'>
      <div className='flex items-center gap-2'>
        <span
          className='gem-plate flex size-6 items-center justify-center rounded-md text-[8px] font-semibold text-white'
          style={gemStyle}
        >
          DS
        </span>
        <div className='flex flex-col gap-1'>
          <StrongLine className='w-16' />
          <Line className='w-10' />
        </div>
      </div>
      <div className='flex items-center'>
        <span className='keycap-3d ring-card block size-5 rounded-full ring-2' />
        <span className='keycap-3d ring-card relative -ms-1.5 block size-5 rounded-full ring-2'>
          <span
            className='chip-3d ring-card absolute -end-0.5 -bottom-0.5 block size-2 rounded-full ring-1'
            style={presenceStyle}
          />
        </span>
        <span className='keycap-3d ring-card -ms-1.5 block size-5 rounded-full ring-2' />
        <Line className='ms-2 w-8' />
      </div>
    </div>
  );
}

function ModalThumb() {
  return (
    <div className={cn(RAISED, 'flex w-44 flex-col gap-2.5 rounded-xl p-2.5')}>
      <StrongLine className='w-16' />
      <div className='flex items-center gap-1.5'>
        <div className={cn(FIELD, 'flex-1 gap-1')}>
          <MiniChip color='var(--primary)' className='w-6' />
          <MiniChip color='var(--warning)' className='w-6' />
          <MiniChip color='var(--info)' className='w-5' />
        </div>
        <span className={cn(PRIMARY_PILL, 'w-9')} />
      </div>
      <div className='flex items-center gap-2'>
        <span className='keycap-3d block size-4 rounded-full' />
        <Line className='w-16' />
      </div>
      <div className='flex items-center gap-2'>
        <span className='border-foreground/25 block size-4 rounded-full border border-dashed' />
        <Line className='w-12' />
      </div>
    </div>
  );
}

function AsideThumb() {
  return (
    <div className='bg-card hairline-ring ring-foreground/10 relative flex h-24 w-44 overflow-hidden rounded-lg'>
      <div className='flex flex-1 flex-col gap-1.5 p-2'>
        <Line className='w-14' />
        <Line className='w-10' />
        <Line className='w-12' />
      </div>
      <div
        className={cn(
          RAISED,
          'my-1 me-1 flex w-24 flex-col gap-2 rounded-md p-2'
        )}
      >
        <StrongLine className='w-14' />
        <div className='flex items-center justify-between'>
          <Line className='w-6' />
          <Line className='w-8' />
        </div>
        <div className='flex items-center justify-between'>
          <Line className='w-7' />
          <MiniChip color='var(--primary)' className='w-8' />
        </div>
        <div className='flex items-center justify-between'>
          <Line className='w-5' />
          <Line className='w-9' />
        </div>
      </div>
    </div>
  );
}

function seriesStyle(slot: number) {
  return { '--chip': `var(--series-${slot})` } as React.CSSProperties;
}

function seriesFill(slot: number) {
  return { backgroundColor: `var(--series-${slot})` } as React.CSSProperties;
}

function SeriesDot({ slot }: { slot: number }) {
  return (
    <span
      className='chip-3d block size-2.5 shrink-0 rounded-full'
      style={seriesStyle(slot)}
    />
  );
}

function PromptThumb() {
  return (
    <div className='bg-card hairline-ring ring-foreground/12 flex w-44 flex-col gap-3 rounded-xl p-2.5 shadow-[0_1px_2px_rgb(0_0_0/0.05)]'>
      <div className='flex flex-col gap-1.5'>
        <StrongLine className='w-28' />
        <Line className='w-20' />
      </div>
      <div className='flex items-center gap-1.5'>
        <span className={cn(OUTLINE_PILL, 'h-4 w-12')} />
        <span className={cn(OUTLINE_PILL, 'h-4 w-8')} />
        <span className='bg-foreground ms-auto block size-5 rounded-full' />
      </div>
    </div>
  );
}

function CitationMark({ label }: { label: string }) {
  return (
    <span className='bg-primary/15 text-primary-ink flex h-3 min-w-3 items-center justify-center rounded-[3px] px-0.5 text-[7px] font-semibold'>
      {label}
    </span>
  );
}

function AnswerThumb() {
  return (
    <div className='flex w-44 flex-col gap-2'>
      <div className='flex items-center gap-1'>
        <Line className='w-24' />
        <CitationMark label='1' />
      </div>
      <div className='flex items-center gap-1'>
        <Line className='w-16' />
        <CitationMark label='2' />
        <Line className='w-10' />
      </div>
      <Line className='w-28' />
      <div className='mt-1 flex items-center gap-1.5'>
        <span className={cn(OUTLINE_PILL, 'h-4 w-14')} />
        <span className={cn(OUTLINE_PILL, 'h-4 w-12')} />
      </div>
    </div>
  );
}

const LANES = [
  { slot: 1, start: 'ms-0', width: 'w-20' },
  { slot: 2, start: 'ms-6', width: 'w-16' },
  { slot: 3, start: 'ms-3', width: 'w-24' },
];

function AgentThumb() {
  return (
    <div className='flex w-44 flex-col gap-2.5'>
      {LANES.map((lane) => (
        <div key={lane.slot} className='flex items-center gap-2'>
          <SeriesDot slot={lane.slot} />
          <div className='bg-foreground/[0.05] flex h-3 flex-1 items-center rounded-full'>
            <span
              className={cn(
                'block h-3 rounded-full opacity-80',
                lane.start,
                lane.width
              )}
              style={seriesFill(lane.slot)}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

const RUN_ROWS = [
  { state: 'done', width: 'w-20' },
  { state: 'done', width: 'w-16' },
  { state: 'running', width: 'w-24' },
];

function RunMark({ state }: { state: string }) {
  if (state === 'running') {
    return (
      <span className='border-foreground/20 border-t-primary block size-3 shrink-0 rounded-full border-[1.5px]' />
    );
  }
  return <Orb color='var(--success)' />;
}

function RunThumb() {
  return (
    <div className='flex w-44 flex-col gap-2'>
      {RUN_ROWS.map((row, index) => (
        <div key={index} className='flex items-center gap-2'>
          <RunMark state={row.state} />
          <Line className={row.width} />
          <span className='text-muted-foreground ms-auto text-[8px] tabular-nums'>
            1.2s
          </span>
        </div>
      ))}
    </div>
  );
}

function ReviewThumb() {
  return (
    <div className={cn(RAISED, 'flex w-44 flex-col gap-2.5 rounded-xl p-2.5')}>
      <div className='bg-foreground/[0.04] flex h-5 items-center rounded-md px-1.5'>
        <span className='text-muted-foreground font-mono text-[7px]'>
          rm -rf ./cache
        </span>
      </div>
      <div className='flex items-center gap-1.5'>
        <MiniChip color='var(--warning)' className='w-8' />
        <span className={cn(OUTLINE_PILL, 'ms-auto h-4 w-9')} />
        <span className={cn(PRIMARY_PILL, 'h-4 w-10')} />
      </div>
    </div>
  );
}

const VOICE_BARS = ['h-2', 'h-4', 'h-6', 'h-3', 'h-5', 'h-2', 'h-4'];

function VoiceThumb() {
  return (
    <div className='flex items-center gap-4'>
      <span className='bg-card hairline-ring ring-foreground/15 flex size-12 items-center justify-center rounded-full shadow-[0_1px_2px_rgb(0_0_0/0.05)]'>
        <span className='bg-primary/80 block size-6 rounded-full' />
      </span>
      <div className='flex items-center gap-0.5'>
        {VOICE_BARS.map((height, index) => (
          <span
            key={index}
            className={cn('bg-foreground/30 block w-1 rounded-full', height)}
          />
        ))}
      </div>
    </div>
  );
}

const CHART_BARS = ['h-5', 'h-8', 'h-6', 'h-10', 'h-7', 'h-12', 'h-9'];

function ChartThumb() {
  return (
    <div className='relative flex h-16 w-44 items-end gap-1.5'>
      {CHART_BARS.map((height, index) => (
        <span
          key={index}
          className={cn('bg-primary/80 block flex-1 rounded-t-[3px]', height)}
        />
      ))}
      <span className='border-foreground/30 absolute inset-x-0 bottom-7 border-t border-dashed' />
    </div>
  );
}

function BackgroundThumb() {
  return (
    <div className='relative h-20 w-44 overflow-hidden rounded-lg [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]'>
      <div className='absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:12px_12px]' />
      <span className='bg-primary/30 absolute top-6 left-12 block size-3' />
      <span className='bg-primary/20 absolute top-12 left-24 block size-3' />
    </div>
  );
}

function IllustrationThumb() {
  return (
    <div className='relative flex size-24 items-center justify-center'>
      <span className='border-foreground/15 absolute inset-0 rounded-full border' />
      <span className='border-foreground/10 absolute inset-5 rounded-full border' />
      <span className='keycap-3d flex size-7 items-center justify-center rounded-lg'>
        <span className='bg-primary block size-2.5 rounded-full' />
      </span>
      <span className='absolute top-1 left-9'>
        <SeriesDot slot={2} />
      </span>
      <span className='absolute right-2 bottom-5'>
        <SeriesDot slot={4} />
      </span>
      <span className='absolute bottom-7 left-6'>
        <SeriesDot slot={3} />
      </span>
    </div>
  );
}

function TextEffectThumb() {
  return (
    <div className='flex items-center gap-1'>
      <span className='text-foreground text-3xl font-semibold'>Type</span>
      <span className='bg-primary block h-7 w-0.5 rounded-full' />
    </div>
  );
}

function EffectThumb() {
  return (
    <div className='relative h-20 w-28'>
      <span className='bg-card hairline-ring ring-foreground/12 absolute inset-x-4 top-2 bottom-2 block origin-bottom -rotate-12 rounded-lg shadow-[0_1px_2px_rgb(0_0_0/0.05)]' />
      <span className='bg-card hairline-ring ring-foreground/12 absolute inset-x-4 top-2 bottom-2 block origin-bottom rotate-12 rounded-lg shadow-[0_1px_2px_rgb(0_0_0/0.05)]' />
      <span className='bg-card hairline-ring ring-foreground/12 absolute inset-x-4 top-1 bottom-3 flex flex-col gap-1.5 rounded-lg p-2 shadow-[0_1px_2px_rgb(0_0_0/0.05)]'>
        <StrongLine className='w-10' />
        <Line className='w-12' />
      </span>
    </div>
  );
}

function LoadingThumb() {
  return (
    <div className='relative flex w-44 flex-col gap-2 overflow-hidden'>
      <div className='flex items-center gap-2'>
        <span className='bg-foreground/10 block size-6 rounded-full' />
        <div className='flex flex-col gap-1.5'>
          <Line className='w-20' />
          <Line className='w-12' />
        </div>
      </div>
      <Line className='w-36' />
      <Line className='w-28' />
      <span className='via-card/80 absolute inset-y-0 left-12 block w-10 -skew-x-12 bg-gradient-to-r from-transparent to-transparent' />
    </div>
  );
}

const THUMBNAILS: Record<string, () => React.ReactNode> = {
  accordion: AccordionThumb,
  activity: ActivityThumb,
  agent: AgentThumb,
  alert: AlertThumb,
  answer: AnswerThumb,
  aside: AsideThumb,
  background: BackgroundThumb,
  avatar: AvatarThumb,
  badge: BadgeThumb,
  banner: BannerThumb,
  breadcrumb: BreadcrumbThumb,
  button: ButtonThumb,
  'calendar-date-picker': DatePickerThumb,
  chart: ChartThumb,
  checkbox: CheckboxThumb,
  comment: CommentThumb,
  dialog: DialogThumb,
  dropdown: DropdownThumb,
  effect: EffectThumb,
  'event-calendar': EventCalendarThumb,
  'file-upload': FileUploadThumb,
  illustration: IllustrationThumb,
  'image-cropper': ImageCropperThumb,
  input: InputThumb,
  loading: LoadingThumb,
  modal: ModalThumb,
  navbar: NavbarThumb,
  notification: NotificationThumb,
  pagination: PaginationThumb,
  popover: PopoverThumb,
  prompt: PromptThumb,
  radio: RadioThumb,
  review: ReviewThumb,
  run: RunThumb,
  select: SelectThumb,
  slider: SliderThumb,
  stepper: StepperThumb,
  subtask: SubtaskThumb,
  switch: SwitchThumb,
  table: TableThumb,
  tabs: TabsThumb,
  teams: TeamsThumb,
  'text-effect': TextEffectThumb,
  textarea: TextareaThumb,
  timeline: TimelineThumb,
  tooltip: TooltipThumb,
  tree: TreeThumb,
  voice: VoiceThumb,
};

export function CategoryThumbnail({ slug }: { slug: string }) {
  const Thumbnail = THUMBNAILS[slug];
  return (
    <div
      aria-hidden='true'
      className='bg-foreground/[0.025] flex aspect-[4/3] items-center justify-center overflow-hidden rounded-lg'
    >
      {Thumbnail && <Thumbnail />}
    </div>
  );
}
