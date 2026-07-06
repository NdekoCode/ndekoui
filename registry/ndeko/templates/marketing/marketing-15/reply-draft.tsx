'use client';

import { useId, useState } from 'react';

import { typingSteps, useAutoplay } from '@/registry/ndeko/hooks/use-autoplay';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { pressedSolidOf } from '@/registry/ndeko/lib/demonstration';
import { CheckIcon } from '@/registry/ndeko/lib/icons';
import { Avatar } from '@/registry/ndeko/ui/avatar';
import { Button } from '@/registry/ndeko/ui/button';
import { Swap } from '@/registry/ndeko/ui/chat-motion';
import { Textarea } from '@/registry/ndeko/ui/textarea';

import { REPLY_DRAFT } from './data';

function shownDraftOf(
  draft: string | null,
  shouldReduceMotion: boolean | null
) {
  if (draft !== null) {
    return draft;
  }
  if (shouldReduceMotion) {
    return REPLY_DRAFT.draft;
  }
  return '';
}

function InsertLabel({ isInserted }: { isInserted: boolean }) {
  if (isInserted) {
    return (
      <span className='inline-flex items-center gap-1.5'>
        <CheckIcon />
        {REPLY_DRAFT.inserted}
      </span>
    );
  }
  return <span>{REPLY_DRAFT.insert}</span>;
}

export function ReplyDraft() {
  const [draft, setDraft] = useState<string | null>(null);
  const [isPressed, setIsPressed] = useState(false);
  const [isInserted, setIsInserted] = useState(false);
  const shouldReduceMotion = usePrefersReducedMotion();
  const draftId = useId();
  const steps = [
    ...typingSteps(REPLY_DRAFT.draft, setDraft, {
      startAfter: 1000,
      characterMs: 24,
    }),
    { after: 700, run: () => setIsPressed(true) },
    {
      after: 140,
      run: () => {
        setIsPressed(false);
        setIsInserted(true);
      },
    },
  ];
  const { ref } = useAutoplay(steps, {
    loopAfter: 2400,
    onReset: () => {
      setDraft(null);
      setIsInserted(false);
    },
  });

  function changeDraft(event: React.ChangeEvent<HTMLTextAreaElement>) {
    setDraft(event.target.value);
  }

  function insert() {
    setIsInserted(true);
  }

  return (
    <div ref={ref} className='flex flex-col gap-3'>
      <div className='flex items-start gap-2'>
        <Avatar
          seed={REPLY_DRAFT.incomingFrom}
          role='img'
          aria-label={REPLY_DRAFT.incomingFrom}
          className='size-6'
        />
        <p className='bg-card hairline-ring ring-border rounded-xl rounded-ss-sm px-3 py-2 text-[13px] text-pretty'>
          {REPLY_DRAFT.incoming}
        </p>
      </div>
      <label htmlFor={draftId} className='sr-only'>
        Draft reply
      </label>
      <Textarea
        id={draftId}
        value={shownDraftOf(draft, shouldReduceMotion)}
        onChange={changeDraft}
        placeholder='The draft appears here'
        className='min-h-[6.5rem]'
      />
      <Button size='sm' onClick={insert} className={pressedSolidOf(isPressed)}>
        <Swap swapKey={String(isInserted)}>
          <InsertLabel isInserted={isInserted} />
        </Swap>
      </Button>
    </div>
  );
}
