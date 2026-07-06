'use client';

import { LayoutGroup, motion, type Transition } from 'motion/react';
import { useId } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { pressedQuietOf } from '@/registry/ndeko/lib/demonstration';
import { springOf } from '@/registry/ndeko/lib/motion-presets';
import { cn } from '@/registry/ndeko/lib/utils';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Swap } from '@/registry/ndeko/ui/chat-motion';

import {
  BRAND,
  TICKETS,
  type Priority,
  type Ticket,
  type TicketStatus,
} from './data';
import type { TicketLive } from './session';

type GroupId = 'open' | 'solved';

const GROUPS: { id: GroupId; label: string; emptyLine: string }[] = [
  { id: 'open', label: 'Open', emptyLine: 'Every ticket is solved' },
  { id: 'solved', label: 'Solved', emptyLine: 'Solved tickets land here' },
];

const STATUS_WORD: Record<TicketStatus, string> = {
  open: 'Open',
  pending: 'Pending',
  solved: 'Solved',
};

const STATUS_VARIANT: Record<TicketStatus, 'info' | 'warning' | 'success'> = {
  open: 'info',
  pending: 'warning',
  solved: 'success',
};

const PRIORITY_WORD: Record<Priority, string> = {
  high: 'High priority',
  normal: 'Normal priority',
  low: 'Low priority',
};

const PRIORITY_BARS: Record<Priority, number> = { high: 3, normal: 2, low: 1 };

const BAR_HEIGHTS = ['h-1', 'h-2', 'h-3'];

function groupOf(status: TicketStatus): GroupId {
  if (status === 'solved') {
    return 'solved';
  }
  return 'open';
}

function barToneOf(isFilled: boolean) {
  if (isFilled) {
    return 'bg-foreground/70';
  }
  return 'bg-foreground/15';
}

export function PriorityBars({ priority }: { priority: Priority }) {
  const filled = PRIORITY_BARS[priority];

  return (
    <span className='inline-flex shrink-0 items-end gap-0.5'>
      {BAR_HEIGHTS.map((height, index) => {
        const isFilled = index < filled;
        return (
          <span
            key={height}
            aria-hidden='true'
            className={cn('w-[3px] rounded-full', height, barToneOf(isFilled))}
          />
        );
      })}
      <span className='sr-only'>{PRIORITY_WORD[priority]}</span>
    </span>
  );
}

export function StatusBadge({ status }: { status: TicketStatus }) {
  return (
    <Swap swapKey={status}>
      <Badge variant={STATUS_VARIANT[status]}>{STATUS_WORD[status]}</Badge>
    </Swap>
  );
}

function currentOf(isOpen: boolean): 'true' | undefined {
  if (isOpen) {
    return 'true';
  }
  return undefined;
}

function rowToneOf(isOpen: boolean) {
  if (isOpen) {
    return 'bg-foreground/[0.07]';
  }
  return 'hover:bg-foreground/[0.04]';
}

function nameWeightOf(isUnread: boolean) {
  if (isUnread) {
    return 'font-semibold';
  }
  return 'font-medium';
}

type TicketRowProps = {
  ticket: Ticket;
  live: TicketLive;
  isOpen: boolean;
  isPressed: boolean;
  placement: string;
  travel: Transition;
  onOpen: (id: string) => void;
};

/** A ticket that is solved keeps its layout id, so its row travels from Open to Solved. */
function TicketRow({
  ticket,
  live,
  isOpen,
  isPressed,
  placement,
  travel,
  onOpen,
}: TicketRowProps) {
  function open() {
    onOpen(ticket.id);
  }

  return (
    <motion.li
      layout='position'
      layoutId={ticket.id}
      layoutDependency={placement}
      transition={{ layout: travel }}
    >
      <button
        type='button'
        aria-current={currentOf(isOpen)}
        onClick={open}
        className={cn(
          'focus-visible:ring-ring/25 flex w-full cursor-pointer flex-col gap-1 rounded-lg px-2.5 py-2 text-start transition-[background-color,scale] duration-150 outline-none focus-visible:ring-[3px]',
          rowToneOf(isOpen),
          pressedQuietOf(isPressed)
        )}
      >
        <span className='flex items-center gap-2'>
          {live.isUnread && (
            <span className='bg-primary size-1.5 shrink-0 rounded-full'>
              <span className='sr-only'>Unread</span>
            </span>
          )}
          <span
            className={cn(
              'min-w-0 flex-1 truncate text-[13px]',
              nameWeightOf(live.isUnread)
            )}
          >
            {ticket.customer.name}
          </span>
          <span className='text-muted-foreground shrink-0 text-xs tabular-nums'>
            {ticket.receivedAgo}
          </span>
        </span>
        <span className='text-muted-foreground truncate text-xs'>
          {ticket.subject}
        </span>
        <span className='flex items-center gap-2 pt-0.5'>
          <StatusBadge status={live.status} />
          <PriorityBars priority={ticket.priority} />
        </span>
      </button>
    </motion.li>
  );
}

type TicketListProps = {
  live: Record<string, TicketLive>;
  openId: string | null;
  placement: string;
  pressed: string | null;
  onOpen: (id: string) => void;
};

export function TicketList({
  live,
  openId,
  placement,
  pressed,
  onOpen,
}: TicketListProps) {
  const groupId = useId();
  const shouldReduceMotion = usePrefersReducedMotion();
  const travel = springOf(shouldReduceMotion);

  return (
    <div className='flex min-h-0 w-full flex-col gap-3'>
      <div className='flex h-9 shrink-0 items-center gap-2 px-1.5'>
        <span
          aria-hidden='true'
          className='gem-plate inline-flex size-6 shrink-0 items-center justify-center rounded-md text-[11px] font-semibold select-none [--gem:var(--primary)]'
        >
          {BRAND.initial}
        </span>
        <span className='text-[13px] font-semibold'>{BRAND.name}</span>
        <span className='text-muted-foreground text-xs'>{BRAND.desk}</span>
      </div>
      <LayoutGroup id={groupId}>
        <nav
          aria-label='Tickets'
          className='-mx-1 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-1'
        >
          {GROUPS.map((group) => {
            const tickets = TICKETS.filter((ticket) => {
              const ticketGroup = groupOf(live[ticket.id].status);
              return ticketGroup === group.id;
            });
            const isEmpty = tickets.length === 0;
            return (
              <section key={group.id} className='flex flex-col gap-1'>
                <motion.h2
                  layout='position'
                  layoutDependency={placement}
                  transition={{ layout: travel }}
                  className='text-muted-foreground flex h-6 items-center gap-1.5 px-2.5 text-xs font-medium'
                >
                  {group.label}
                  <LayoutGroup inherit={false}>
                    <MotionNumber value={tickets.length} />
                  </LayoutGroup>
                </motion.h2>
                <ul className='flex flex-col gap-px'>
                  {tickets.map((ticket) => {
                    const pressKey = `ticket-${ticket.id}`;
                    return (
                      <TicketRow
                        key={ticket.id}
                        ticket={ticket}
                        live={live[ticket.id]}
                        isOpen={ticket.id === openId}
                        isPressed={pressed === pressKey}
                        placement={placement}
                        travel={travel}
                        onOpen={onOpen}
                      />
                    );
                  })}
                </ul>
                {isEmpty && (
                  <p className='text-muted-foreground px-2.5 text-xs'>
                    {group.emptyLine}
                  </p>
                )}
              </section>
            );
          })}
        </nav>
      </LayoutGroup>
    </div>
  );
}
