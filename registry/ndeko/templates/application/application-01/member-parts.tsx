'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
} from 'motion/react';

import { MotionNumber } from '@/components/core/motion-number';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { cn } from '@/registry/ndeko/lib/utils';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/registry/ndeko/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/registry/ndeko/ui/dropdown-menu';

import {
  BOARD_ORDER,
  PRESENCE_META,
  STATUS_ICONS,
  type Member,
  type StatusId,
} from './data';
import { isStatusId, statusOf } from './task-model';

/** One column template for the labels, every member card and every invitation, so the dividers line up from xl. */
export const MEMBER_GRID =
  'grid grid-cols-3 xl:grid-cols-[minmax(13rem,1fr)_minmax(15rem,1.7fr)_7.5rem_7.5rem_8.5rem_3rem]';

export const MEMBER_CARD_HEIGHT = 'xl:min-h-[84px]';

export const FIGURE_LABEL = 'text-muted-foreground text-xs xl:hidden';

const SWAP_TRANSITION: Transition = { duration: 0.15, ease: [0.2, 0, 0, 1] };

const SWAP_VARIANTS: Variants = {
  enter: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
  visible: { opacity: 1, scale: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
};

const FADE_VARIANTS: Variants = {
  enter: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const TWO_DIGITS: Intl.NumberFormatOptions = { minimumIntegerDigits: 2 };

export function swapVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return SWAP_VARIANTS;
}

function durationPartsOf(totalMinutes: number) {
  const rawHours = totalMinutes / 60;
  const hours = Math.floor(rawHours);
  const minutes = totalMinutes % 60;
  return { hours, minutes };
}

export function formatDuration(totalMinutes: number) {
  const { hours, minutes } = durationPartsOf(totalMinutes);
  const paddedMinutes = String(minutes).padStart(2, '0');
  return `${hours}h ${paddedMinutes}m`;
}

export function workedTodayOf(member: Member) {
  const task = member.task;
  if (!task) {
    return 0;
  }
  const entry = member.activity.find((item) => item.taskId === task.id);
  if (!entry) {
    return 0;
  }
  return entry.minutes;
}

export function totalTodayOf(member: Member) {
  let total = 0;
  for (const entry of member.activity) {
    total += entry.minutes;
  }
  return total;
}

/** Hours and minutes roll as two numbers, but a screen reader hears the duration once. */
export function DurationFigure({
  minutes,
  className,
}: {
  minutes: number;
  className?: string;
}) {
  const parts = durationPartsOf(minutes);
  const text = formatDuration(minutes);

  return (
    <span
      className={cn(
        'inline-flex items-baseline whitespace-nowrap tabular-nums',
        className
      )}
    >
      <span className='sr-only'>{text}</span>
      <span aria-hidden='true'>
        <MotionNumber value={parts.hours} suffix='h' />{' '}
        <MotionNumber value={parts.minutes} format={TWO_DIGITS} suffix='m' />
      </span>
    </span>
  );
}

export function PresenceAvatar({
  member,
  className,
}: {
  member: Member;
  className?: string;
}) {
  const presence = PRESENCE_META[member.presence];
  const PresenceGlyph = presence.icon;
  const badgeStyle = { '--chip': presence.color } as React.CSSProperties;

  return (
    <span className={cn('relative inline-flex shrink-0', className)}>
      <Avatar className='size-9'>
        {member.avatar && <AvatarImage src={member.avatar} alt='' />}
        <AvatarFallback>{member.initials}</AvatarFallback>
      </Avatar>
      <span className='bg-card absolute -right-0.5 -bottom-0.5 flex rounded-full p-px'>
        <span
          style={badgeStyle}
          className='chip-3d flex size-4 items-center justify-center rounded-full'
        >
          <PresenceGlyph className='size-2.5' strokeWidth={2.75} />
        </span>
      </span>
      <span className='sr-only'>{presence.label}</span>
    </span>
  );
}

function statusChipMetaOf(status: StatusId) {
  const meta = statusOf(status);
  return { label: meta.name, color: meta.color, icon: STATUS_ICONS[status] };
}

type StatusChipMenuProps = {
  status: StatusId;
  taskNumber: string;
  onChange: (status: StatusId) => void;
};

/** The status of a task as an assigned label. Picking another one applies it at once. */
export function StatusChipMenu({
  status,
  taskNumber,
  onChange,
}: StatusChipMenuProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const variants = swapVariantsOf(shouldReduceMotion);
  const meta = statusChipMetaOf(status);
  const StatusGlyph = meta.icon;
  const chipStyle = { '--chip': meta.color } as React.CSSProperties;

  function changeStatus(value: unknown) {
    if (isStatusId(value)) {
      onChange(value);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type='button'
            aria-label={`Status of ${taskNumber}: ${meta.label}. Change status`}
            style={chipStyle}
            className='chip-3d focus-visible:ring-ring/25 inline-flex h-5 shrink-0 cursor-pointer items-center gap-1 overflow-hidden rounded-md px-1.5 text-xs font-medium whitespace-nowrap outline-none focus-visible:ring-[3px]'
          />
        }
      >
        <AnimatePresence mode='popLayout' initial={false}>
          <motion.span
            key={status}
            variants={variants}
            initial='enter'
            animate='visible'
            exit='exit'
            transition={SWAP_TRANSITION}
            className='flex items-center gap-1'
          >
            <StatusGlyph className='size-3' strokeWidth={2.25} />
            {meta.label}
          </motion.span>
        </AnimatePresence>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-48'>
        <DropdownMenuLabel>Status</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={status} onValueChange={changeStatus}>
          {BOARD_ORDER.map((statusId) => {
            const optionMeta = statusChipMetaOf(statusId);
            const OptionGlyph = optionMeta.icon;
            const glyphStyle = {
              color: optionMeta.color,
            } as React.CSSProperties;

            return (
              <DropdownMenuRadioItem
                key={statusId}
                value={statusId}
                closeOnClick
              >
                <OptionGlyph style={glyphStyle} />
                {optionMeta.label}
              </DropdownMenuRadioItem>
            );
          })}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
