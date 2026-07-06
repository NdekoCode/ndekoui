'use client';

import { AnimatePresence, motion } from 'motion/react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import {
  CheckIcon,
  CircleXIcon,
  ImageIcon,
  InboxIcon,
  MenuIcon,
} from '@/registry/ndeko/lib/icons';
import { rowPresenceOf } from '@/registry/ndeko/lib/motion-presets';
import { Avatar, AvatarFallback } from '@/registry/ndeko/ui/avatar';
import { Button } from '@/registry/ndeko/ui/button';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';

import { ME, REFUND, type Ticket } from './data';
import type { OpenTicket, RefundStatus, TicketLive } from './session';
import { PriorityBars, StatusBadge } from './ticket-list';
import { useFollowBottom } from './use-follow-bottom';

function InitialsAvatar({ initials }: { initials: string }) {
  return (
    <Avatar className='size-7 shrink-0'>
      <AvatarFallback className='text-[10px]'>{initials}</AvatarFallback>
    </Avatar>
  );
}

function CustomerBubble({ ticket }: { ticket: Ticket }) {
  return (
    <div className='flex items-end gap-2 pb-4'>
      <InitialsAvatar initials={ticket.customer.initials} />
      <div className='flex max-w-[85%] flex-col gap-1.5'>
        <p className='bg-foreground/[0.06] rounded-2xl rounded-es-md px-3.5 py-2 text-sm leading-relaxed'>
          {ticket.message}
        </p>
        {ticket.attachment && (
          <span className='bg-foreground/[0.04] text-muted-foreground flex h-7 w-fit items-center gap-1.5 rounded-lg px-2 text-xs'>
            <ImageIcon className='size-3.5' />
            {ticket.attachment}
          </span>
        )}
      </div>
    </div>
  );
}

function ReplyBubble({ text }: { text: string }) {
  return (
    <div className='flex items-end justify-end gap-2 pb-4'>
      <p className='bg-card hairline-ring ring-border dark:bg-foreground/[0.04] max-w-[85%] rounded-2xl rounded-ee-md px-3.5 py-2 text-sm leading-relaxed whitespace-pre-line shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
        {text}
      </p>
      <InitialsAvatar initials={ME.initials} />
    </div>
  );
}

type EventLineProps = {
  icon: React.ReactNode;
  children: React.ReactNode;
};

function EventLine({ icon, children }: EventLineProps) {
  return (
    <p className='text-muted-foreground flex items-center justify-center gap-1.5 pb-4 text-center text-xs'>
      {icon}
      {children}
    </p>
  );
}

function RefundLine({ status }: { status: RefundStatus }) {
  if (status === 'issued') {
    return (
      <EventLine
        icon={<CheckIcon className='text-success-foreground size-3.5' />}
      >
        Refund of {REFUND.amount} issued to {REFUND.card}
      </EventLine>
    );
  }
  return (
    <EventLine icon={<CircleXIcon className='size-3.5' />}>
      No refund was issued
    </EventLine>
  );
}

type ConversationHeaderProps = {
  open: OpenTicket | null;
  canReplay: boolean;
  onReplay: () => void;
  onOpenList: () => void;
  onOpenCopilot: () => void;
};

export function ConversationHeader({
  open,
  canReplay,
  onReplay,
  onOpenList,
  onOpenCopilot,
}: ConversationHeaderProps) {
  return (
    <header className='flex h-14 shrink-0 items-center gap-2.5 px-3 @2xl:px-4'>
      <Button
        type='button'
        variant='ghost'
        size='icon-sm'
        data-sheet-open='list'
        aria-label='Open the ticket list'
        aria-haspopup='dialog'
        onClick={onOpenList}
        className='text-muted-foreground @4xl:hidden'
      >
        <MenuIcon />
      </Button>
      {!open && (
        <h1 className='min-w-0 flex-1 truncate text-sm font-medium'>Inbox</h1>
      )}
      {open && (
        <div className='flex min-w-0 flex-1 flex-col leading-tight'>
          <h1 className='truncate text-sm font-medium'>
            {open.ticket.subject}
          </h1>
          <p className='text-muted-foreground truncate text-xs'>
            {open.ticket.customer.name}
          </p>
        </div>
      )}
      {open && (
        <span className='hidden @sm:inline-flex'>
          <PriorityBars priority={open.ticket.priority} />
        </span>
      )}
      {open && <StatusBadge status={open.live.status} />}
      <ReplayButton isShown={canReplay} onReplay={onReplay} label='Replay' />
      <Button
        type='button'
        variant='outline'
        size='sm'
        data-sheet-open='copilot'
        aria-haspopup='dialog'
        onClick={onOpenCopilot}
        className='@2xl:hidden'
      >
        Copilot
      </Button>
    </header>
  );
}

function EmptyConversation() {
  return (
    <div className='m-auto flex max-w-xs flex-col items-center gap-3 px-4 text-center'>
      <span
        aria-hidden='true'
        className='keycap-3d text-muted-foreground inline-flex size-10 items-center justify-center rounded-lg'
      >
        <InboxIcon className='size-5' />
      </span>
      <p className='text-sm font-medium'>Pick a ticket</p>
      <p className='text-muted-foreground text-[13px] leading-relaxed'>
        The copilot reads it, looks up the customer and drafts a reply you can
        insert, edit or discard.
      </p>
    </div>
  );
}

type MessagesProps = {
  ticket: Ticket;
  live: TicketLive;
  refund: RefundStatus;
};

/** The refund belongs to one ticket: on any other, `refund` is `none` and no line about it shows. */
function Messages({ ticket, live, refund }: MessagesProps) {
  const { scrollerRef, contentRef, updatePinned } = useFollowBottom();
  const shouldReduceMotion = usePrefersReducedMotion();
  const rowPresence = rowPresenceOf(shouldReduceMotion);
  const isRefundSettled = refund === 'issued' || refund === 'denied';
  const isSolved = live.status === 'solved';

  return (
    <div
      ref={scrollerRef}
      onScroll={updatePinned}
      className='min-h-24 flex-1 overflow-y-auto'
    >
      <div
        ref={contentRef}
        className='mx-auto flex w-full max-w-2xl flex-col px-4 pt-4'
      >
        <CustomerBubble ticket={ticket} />
        <AnimatePresence initial={false}>
          {isRefundSettled && (
            <motion.div
              key='refund'
              className='overflow-hidden'
              {...rowPresence}
            >
              <RefundLine status={refund} />
            </motion.div>
          )}
          {live.sentReplies.map((reply, index) => (
            <motion.div
              key={`reply-${index}`}
              className='-mx-1 overflow-hidden px-1'
              {...rowPresence}
            >
              <ReplyBubble text={reply} />
            </motion.div>
          ))}
          {isSolved && (
            <motion.div
              key='solved'
              className='overflow-hidden'
              {...rowPresence}
            >
              <EventLine
                icon={
                  <CheckIcon className='text-success-foreground size-3.5' />
                }
              >
                Marked as solved
              </EventLine>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

type ConversationProps = MessagesProps | { ticket: null };

/** Keyed by ticket, so opening another one swaps the messages without replaying their entrance. */
export function Conversation(props: ConversationProps) {
  if (props.ticket === null) {
    return (
      <div className='flex min-h-0 flex-1'>
        <EmptyConversation />
      </div>
    );
  }
  return <Messages key={props.ticket.id} {...props} />;
}
