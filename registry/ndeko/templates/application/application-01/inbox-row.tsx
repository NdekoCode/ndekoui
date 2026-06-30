'use client';

import {
  motion,
  useReducedMotion,
  type MotionProps,
  type Transition,
} from 'motion/react';

import { ArchiveIcon, CheckIcon, MailIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import {
  TOOLTIP_GLIDE_CLOSE_DELAY,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  useTooltipHandle,
} from '@/registry/ndeko/ui/tooltip';

import { PEOPLE, TEAM_KEY, type InboxItem } from './data';
import { SenderAvatar } from './inbox-glyphs';
import { IssueTypeGem } from './task-glyphs';

const EASE_OUT_STRONG: [number, number, number, number] = [0.23, 1, 0.32, 1];

const ENTER: Transition = { duration: 0.2, ease: EASE_OUT_STRONG };

const EXIT: Transition = { duration: 0.16, ease: EASE_OUT_STRONG };

type PresenceProps = Pick<
  MotionProps,
  'initial' | 'animate' | 'exit' | 'transition'
>;

const ROW_PRESENCE: PresenceProps = {
  initial: { height: 0, opacity: 0 },
  animate: { height: 'auto', opacity: 1 },
  exit: { height: 0, opacity: 0, transition: EXIT },
  transition: ENTER,
};

const ROW_FADE: PresenceProps = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0, transition: EXIT },
  transition: ENTER,
};

function rowPresenceOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return ROW_FADE;
  }
  return ROW_PRESENCE;
}

const ACTION_BUTTON =
  'inline-flex size-6 cursor-pointer items-center justify-center rounded-md text-muted-foreground outline-none transition-colors duration-150 hover:bg-foreground/5 hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/25';

function senderOf(item: InboxItem) {
  const found = PEOPLE.find((person) => person.id === item.senderId);
  if (found) {
    return found;
  }
  return PEOPLE[0];
}

function readToggleLabelOf(item: InboxItem) {
  if (item.isUnread) {
    return 'Mark as read';
  }
  return 'Mark as unread';
}

function eventLineOf(senderName: string, item: InboxItem) {
  const firstName = senderName.split(' ')[0];
  if (item.excerpt) {
    return `${firstName} ${item.event}: ${item.excerpt}`;
  }
  return `${firstName} ${item.event}`;
}

type InboxRowProps = {
  item: InboxItem;
  onOpen: (itemId: string) => void;
  onToggleRead: (itemId: string) => void;
  onArchive: (itemId: string) => void;
};

export function InboxRow({
  item,
  onOpen,
  onToggleRead,
  onArchive,
}: InboxRowProps) {
  const shouldReduceMotion = useReducedMotion();
  const sender = senderOf(item);
  const key = `${TEAM_KEY}-${item.taskNumber}`;
  const readLabel = readToggleLabelOf(item);
  const actionHint = useTooltipHandle<string>();

  return (
    <motion.li
      {...rowPresenceOf(shouldReduceMotion)}
      className='overflow-hidden'
    >
      <div className='group/row hover:bg-foreground/[0.03] focus-within:bg-foreground/[0.03] relative flex items-start gap-3 rounded-lg px-2.5 py-2.5'>
        {item.isUnread && (
          <span
            aria-hidden='true'
            className='bg-primary absolute start-1 top-[1.15rem] size-1.5 rounded-full'
          />
        )}
        <SenderAvatar person={sender} kind={item.kind} />
        <button
          type='button'
          aria-haspopup='dialog'
          onClick={() => onOpen(item.id)}
          className='focus-visible:after:ring-ring/25 min-w-0 flex-1 cursor-pointer text-left outline-none after:absolute after:inset-0 after:rounded-lg focus-visible:after:ring-[3px]'
        >
          <span className='flex min-w-0 items-center gap-1.5'>
            <IssueTypeGem type={item.taskType} />
            <span className='text-muted-foreground shrink-0 text-xs tabular-nums'>
              {key}
            </span>
            <span
              className={cn(
                'truncate text-[13px] font-medium',
                !item.isUnread && 'text-muted-foreground'
              )}
            >
              {item.taskTitle}
            </span>
          </span>
          <span className='text-muted-foreground mt-0.5 line-clamp-1 block text-xs'>
            <span aria-hidden='true' className='hidden pointer-coarse:inline'>
              {item.age} ·{' '}
            </span>
            {eventLineOf(sender.name, item)}
          </span>
          <span className='sr-only'>
            , {item.age}
            {item.isUnread && ', unread'}
          </span>
        </button>
        <span className='relative z-10 flex h-5 shrink-0 items-center'>
          <span
            aria-hidden='true'
            className='text-muted-foreground text-xs tabular-nums transition-opacity duration-150 group-focus-within/row:opacity-0 group-hover/row:opacity-0 pointer-coarse:hidden'
          >
            {item.age}
          </span>
          <span className='absolute end-0 flex items-center gap-0.5 opacity-0 transition-opacity duration-150 group-focus-within/row:opacity-100 group-hover/row:opacity-100 pointer-coarse:static pointer-coarse:opacity-100'>
            <TooltipTrigger
              handle={actionHint}
              payload={readLabel}
              closeDelay={TOOLTIP_GLIDE_CLOSE_DELAY}
              aria-label={readLabel}
              onClick={() => onToggleRead(item.id)}
              className={ACTION_BUTTON}
            >
              {item.isUnread && <CheckIcon className='size-3.5' />}
              {!item.isUnread && <MailIcon className='size-3.5' />}
            </TooltipTrigger>
            <TooltipTrigger
              handle={actionHint}
              payload='Archive'
              closeDelay={TOOLTIP_GLIDE_CLOSE_DELAY}
              aria-label='Archive'
              onClick={() => onArchive(item.id)}
              className={ACTION_BUTTON}
            >
              <ArchiveIcon className='size-3.5' />
            </TooltipTrigger>
            <Tooltip handle={actionHint}>
              {({ payload }) => (
                <TooltipContent glide>{payload}</TooltipContent>
              )}
            </Tooltip>
          </span>
        </span>
      </div>
    </motion.li>
  );
}
