'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useId } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import {
  FeatherIcon,
  MessageCircleIcon,
  PlusIcon,
} from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';

import { AccountMenu } from './account-menu';
import { PRODUCT_NAME, type Conversation, type Person } from './data';
import { revealVariantsOf } from './presence';
import { ActiveRowIndicator, NAV_ROW, ariaCurrentOf } from './sidebar-parts';

export function QuillstoneMark() {
  return (
    <span
      aria-hidden='true'
      className='gem-plate inline-flex size-6 shrink-0 items-center justify-center rounded-md [--gem:var(--primary)] [&_svg]:size-3.5'
    >
      <FeatherIcon />
    </span>
  );
}

type ConversationRowProps = {
  conversation: Conversation;
  isActive: boolean;
  indicatorId: string;
  onSelect: (conversationId: string) => void;
};

function ConversationRow({
  conversation,
  isActive,
  indicatorId,
  onSelect,
}: ConversationRowProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const variants = revealVariantsOf(shouldReduceMotion);
  const ariaCurrent = ariaCurrentOf(isActive);

  function select() {
    onSelect(conversation.id);
  }

  return (
    <motion.li
      variants={variants}
      initial='hidden'
      animate='shown'
      exit='hidden'
    >
      <button
        type='button'
        aria-current={ariaCurrent}
        onClick={select}
        className={NAV_ROW}
      >
        {isActive && <ActiveRowIndicator layoutId={indicatorId} />}
        <MessageCircleIcon />
        <span className='relative min-w-0 flex-1 truncate'>
          {conversation.title}
        </span>
      </button>
    </motion.li>
  );
}

type ConversationSidebarProps = {
  conversations: Conversation[];
  activeId: string;
  person: Person;
  onSelect: (conversationId: string) => void;
  onNewChat: () => void;
};

export function ConversationSidebar({
  conversations,
  activeId,
  person,
  onSelect,
  onNewChat,
}: ConversationSidebarProps) {
  const indicatorId = useId();

  return (
    <div className='flex h-full min-h-0 flex-col gap-3'>
      <div className='flex flex-col gap-2'>
        <div className='flex h-9 items-center gap-2 px-1.5'>
          <QuillstoneMark />
          <span className='text-[13px] font-semibold'>{PRODUCT_NAME}</span>
        </div>
        <Button
          variant='outline'
          onClick={onNewChat}
          className='w-full justify-start'
        >
          <PlusIcon />
          New chat
        </Button>
      </div>
      <nav
        aria-label='Conversations'
        className='-mx-2 flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-2'
      >
        <p className='text-muted-foreground flex h-6 items-center px-2 text-xs font-medium'>
          Recent
        </p>
        <ul className='flex flex-col'>
          <AnimatePresence initial={false}>
            {conversations.map((conversation) => (
              <ConversationRow
                key={conversation.id}
                conversation={conversation}
                isActive={conversation.id === activeId}
                indicatorId={indicatorId}
                onSelect={onSelect}
              />
            ))}
          </AnimatePresence>
        </ul>
      </nav>
      <AccountMenu person={person} />
    </div>
  );
}
