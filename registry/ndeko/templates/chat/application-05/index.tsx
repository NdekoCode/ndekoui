'use client';

import { useState } from 'react';

import { Sheet, SheetContent, SheetTitle } from '@/registry/ndeko/ui/sheet';

import { ConversationSidebar } from './conversation-list';
import { ConversationView } from './conversation-view';
import {
  NEW_CHAT_TITLE,
  TITLE_WORD_LIMIT,
  newChatReplies,
  reader,
  seedConversations,
  type Conversation,
} from './data';

function titleOf(text: string) {
  const words = text.trim().split(/\s+/);
  const shown = words.slice(0, TITLE_WORD_LIMIT);
  return shown.join(' ');
}

function isListed(conversation: Conversation) {
  return !conversation.isDraft;
}

function namedConversation(
  conversation: Conversation,
  conversationId: string,
  title: string
): Conversation {
  if (conversation.id !== conversationId) {
    return conversation;
  }
  return { ...conversation, title, isDraft: false };
}

function draftOf(draftNumber: number): Conversation {
  return {
    id: `chat-${draftNumber}`,
    title: NEW_CHAT_TITLE,
    turns: [],
    replies: newChatReplies,
    isDraft: true,
  };
}

export default function Application05() {
  const [conversations, setConversations] =
    useState<Conversation[]>(seedConversations);
  const [activeId, setActiveId] = useState(seedConversations[0].id);
  const [draftCount, setDraftCount] = useState(0);
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);
  const listedConversations = conversations.filter(isListed);

  function openConversation(conversationId: string) {
    setActiveId(conversationId);
    setIsNavigationOpen(false);
  }

  function startNewChat() {
    setIsNavigationOpen(false);
    const openDraft = conversations.find(
      (conversation) => conversation.isDraft
    );
    if (openDraft) {
      setActiveId(openDraft.id);
      return;
    }
    const draftNumber = draftCount + 1;
    const draft = draftOf(draftNumber);
    setDraftCount(draftNumber);
    setConversations((current) => [draft, ...current]);
    setActiveId(draft.id);
  }

  function nameConversation(conversationId: string, titleSource: string) {
    const title = titleOf(titleSource);
    setConversations((current) =>
      current.map((conversation) =>
        namedConversation(conversation, conversationId, title)
      )
    );
  }

  function openNavigation() {
    setIsNavigationOpen(true);
  }

  const sidebarProps = {
    conversations: listedConversations,
    activeId,
    person: reader,
    onSelect: openConversation,
    onNewChat: startNewChat,
  };

  return (
    <div className='bg-sidebar text-foreground flex h-dvh min-h-[30rem] w-full md:p-2'>
      <aside
        aria-label='Conversations'
        className='hidden w-64 shrink-0 pr-2 md:block'
      >
        <ConversationSidebar {...sidebarProps} />
      </aside>
      <Sheet open={isNavigationOpen} onOpenChange={setIsNavigationOpen}>
        <SheetContent
          side='left'
          showCloseButton={false}
          className='bg-sidebar w-72 gap-0 p-2'
        >
          <SheetTitle className='sr-only'>Conversations</SheetTitle>
          <ConversationSidebar {...sidebarProps} />
        </SheetContent>
      </Sheet>
      <main className='bg-background md:hairline-ring md:ring-border flex min-w-0 flex-1 flex-col overflow-clip md:rounded-xl md:shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
        {conversations.map((conversation) => (
          <div
            key={conversation.id}
            hidden={conversation.id !== activeId}
            className='flex min-h-0 flex-1 flex-col'
          >
            <ConversationView
              conversation={conversation}
              onFirstMessage={nameConversation}
              onOpenNavigation={openNavigation}
            />
          </div>
        ))}
      </main>
    </div>
  );
}
