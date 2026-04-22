'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
  useReducedMotion,
} from 'motion/react';
import { useState } from 'react';

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

const DIGIT_SHIFT_PX = 8;

const DIGIT_TRANSITION: Transition = { duration: 0.18, ease: [0.2, 0, 0, 1] };

const DIGIT_VARIANTS: Variants = {
  enter: (direction: number) => {
    const offset = direction * DIGIT_SHIFT_PX;
    return { opacity: 0, y: offset };
  },
  visible: { opacity: 1, y: 0 },
  exit: (direction: number) => {
    const offset = direction * DIGIT_SHIFT_PX;
    return { opacity: 0, y: -offset };
  },
};

export function swapVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return SWAP_VARIANTS;
}

function digitVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return DIGIT_VARIANTS;
}

function directionOf(previous: number, next: number) {
  if (next > previous) {
    return 1;
  }
  return -1;
}

export function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  const paddedRest = String(rest).padStart(2, '0');
  return `${hours}h ${paddedRest}m`;
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

type ShownValue = { value: number; direction: number };

/** A figure the user just changed: its digits slide in the direction of the change. */
export function SlidingValue({
  value,
  format = formatDuration,
  className,
}: {
  value: number;
  format?: (value: number) => string;
  className?: string;
}) {
  const shouldReduceMotion = useReducedMotion();
  const [shown, setShown] = useState<ShownValue>({ value, direction: 1 });
  const variants = digitVariantsOf(shouldReduceMotion);
  const text = format(value);

  if (shown.value !== value) {
    const direction = directionOf(shown.value, value);
    setShown({ value, direction });
  }

  return (
    <span
      className={cn(
        'relative inline-flex overflow-hidden tabular-nums',
        className
      )}
    >
      <AnimatePresence
        mode='popLayout'
        initial={false}
        custom={shown.direction}
      >
        <motion.span
          key={text}
          custom={shown.direction}
          variants={variants}
          initial='enter'
          animate='visible'
          exit='exit'
          transition={DIGIT_TRANSITION}
        >
          {text}
        </motion.span>
      </AnimatePresence>
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
  const shouldReduceMotion = useReducedMotion();
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
