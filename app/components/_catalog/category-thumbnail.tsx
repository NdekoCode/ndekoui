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

const THUMBNAILS: Record<string, () => React.ReactNode> = {
  accordion: AccordionThumb,
  alert: AlertThumb,
  avatar: AvatarThumb,
  badge: BadgeThumb,
  banner: BannerThumb,
  breadcrumb: BreadcrumbThumb,
  button: ButtonThumb,
  'calendar-date-picker': DatePickerThumb,
  checkbox: CheckboxThumb,
  dialog: DialogThumb,
  dropdown: DropdownThumb,
  'event-calendar': EventCalendarThumb,
  'file-upload': FileUploadThumb,
  'image-cropper': ImageCropperThumb,
  input: InputThumb,
  navbar: NavbarThumb,
  notification: NotificationThumb,
  pagination: PaginationThumb,
  popover: PopoverThumb,
  radio: RadioThumb,
  select: SelectThumb,
  slider: SliderThumb,
  stepper: StepperThumb,
  switch: SwitchThumb,
  table: TableThumb,
  tabs: TabsThumb,
  textarea: TextareaThumb,
  timeline: TimelineThumb,
  tooltip: TooltipThumb,
  tree: TreeThumb,
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
