'use client';

import { CheckIcon, CopyIcon, ThumbsUpIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';
import {
  MessageAction,
  MessageActions,
} from '@/registry/ndeko/ui/chat-message';
import { Swap } from '@/registry/ndeko/ui/chat-motion';

import type { CopyStatus } from './use-copied';
import { useCopied } from './use-copied';
import type { Feedback } from './data';

const COPY_TOOLTIP: Record<CopyStatus, string> = {
  idle: 'Copy',
  copied: 'Copied',
  failed: 'Couldn’t copy, select the text instead',
};

const ACTION_BUTTON =
  'text-muted-foreground aria-pressed:bg-foreground/[0.06] aria-pressed:text-foreground';

type ReplyActionsProps = {
  text: string;
  feedback: Feedback | undefined;
  onFeedback: (feedback: Feedback | undefined) => void;
};

function toggled(current: Feedback | undefined, choice: Feedback) {
  if (current === choice) {
    return undefined;
  }
  return choice;
}

export function ReplyActions({
  text,
  feedback,
  onFeedback,
}: ReplyActionsProps) {
  const { status, copy } = useCopied();
  const isCopied = status === 'copied';
  const isHelpful = feedback === 'helpful';
  const isNotHelpful = feedback === 'not-helpful';
  const tooltip = COPY_TOOLTIP[status];

  function copyReply() {
    copy(text);
  }

  function markHelpful() {
    onFeedback(toggled(feedback, 'helpful'));
  }

  function markNotHelpful() {
    onFeedback(toggled(feedback, 'not-helpful'));
  }

  return (
    <MessageActions className='-ms-1.5'>
      <MessageAction tooltip={tooltip}>
        <Button
          type='button'
          variant='ghost'
          size='icon-sm'
          aria-label={tooltip}
          onClick={copyReply}
          className={ACTION_BUTTON}
        >
          <Swap swapKey={String(isCopied)}>
            {isCopied && <CheckIcon className='size-3.5' />}
            {!isCopied && <CopyIcon className='size-3.5' />}
          </Swap>
        </Button>
      </MessageAction>
      <MessageAction tooltip='Helpful'>
        <Button
          type='button'
          variant='ghost'
          size='icon-sm'
          aria-label='Helpful'
          aria-pressed={isHelpful}
          onClick={markHelpful}
          className={ACTION_BUTTON}
        >
          <ThumbsUpIcon className='size-3.5' />
        </Button>
      </MessageAction>
      <MessageAction tooltip='Not helpful'>
        <Button
          type='button'
          variant='ghost'
          size='icon-sm'
          aria-label='Not helpful'
          aria-pressed={isNotHelpful}
          onClick={markNotHelpful}
          className={ACTION_BUTTON}
        >
          <ThumbsUpIcon className='size-3.5 rotate-180' />
        </Button>
      </MessageAction>
    </MessageActions>
  );
}
