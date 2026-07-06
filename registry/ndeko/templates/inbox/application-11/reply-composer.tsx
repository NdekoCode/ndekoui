'use client';

import { motion } from 'motion/react';
import { useId } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { pressedSolidOf } from '@/registry/ndeko/lib/demonstration';
import {
  CircleCheckIcon,
  SendIcon,
  UndoIcon,
} from '@/registry/ndeko/lib/icons';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Button } from '@/registry/ndeko/ui/button';
import { Kbd, KbdGroup } from '@/registry/ndeko/ui/kbd';
import { MorphButton, type MorphState } from '@/registry/ndeko/ui/morph-button';

import { EMPTY_SEND_HINT } from './data';
import { DraftCard } from './draft-card';
import type { DraftStatus, SendStatus, TicketLive } from './session';

const SEND_STATE: Record<SendStatus, MorphState> = {
  idle: 'idle',
  sending: 'busy',
  sent: 'done',
};

const SEND_LABELS: Record<MorphState, string> = {
  idle: 'Send',
  busy: 'Sending',
  done: 'Sent',
};

/** The gap under the draft sits inside what resizes, so an empty draft area takes no room at all. */
const TRACE =
  'text-muted-foreground mb-2 flex min-h-7 items-center gap-1.5 px-1 text-xs transition-opacity duration-300 starting:opacity-0';

const NUDGE = { x: [0, -4, 4, 0] };

const STILL = { x: 0 };

/** A refused entry nudges its reason once. Reduced motion keeps it still. */
function nudgeOf(shouldReduceMotion: boolean) {
  if (shouldReduceMotion) {
    return STILL;
  }
  return NUDGE;
}

function describedByOf(showsHint: boolean, hintId: string) {
  if (showsHint) {
    return hintId;
  }
  return undefined;
}

function placeholderOf(draft: DraftStatus) {
  if (draft === 'streaming') {
    return 'The copilot is drafting a reply';
  }
  return 'Write a reply';
}

type DraftAreaProps = {
  draft: DraftStatus;
  isActive: boolean;
  isInsertPressed: boolean;
  onInsert: () => void;
  onEdit: () => void;
  onDiscard: () => void;
  onRestore: () => void;
};

function DraftArea({
  draft,
  isActive,
  isInsertPressed,
  onInsert,
  onEdit,
  onDiscard,
  onRestore,
}: DraftAreaProps) {
  const isStreaming = draft === 'streaming';
  const showsCard = isStreaming || draft === 'ready';

  if (showsCard) {
    return (
      <div className='pb-2'>
        <DraftCard
          isStreaming={isStreaming}
          isActive={isActive}
          isInsertPressed={isInsertPressed}
          onInsert={onInsert}
          onEdit={onEdit}
          onDiscard={onDiscard}
        />
      </div>
    );
  }
  if (draft === 'inserted') {
    return (
      <p className={TRACE}>
        <CircleCheckIcon className='text-success-foreground size-3.5 shrink-0' />
        Draft inserted. Read it through before you send
      </p>
    );
  }
  if (draft === 'discarded') {
    return (
      <p className={TRACE}>
        Draft discarded
        <Button
          type='button'
          variant='ghost'
          size='sm'
          data-draft-restore
          onClick={onRestore}
          className='text-muted-foreground h-6 px-1.5'
        >
          <UndoIcon className='size-3.5' />
          Restore
        </Button>
      </p>
    );
  }
  return null;
}

type ReplyComposerProps = DraftAreaProps & {
  live: TicketLive;
  showsSendHint: boolean;
  emptySends: number;
  isSendPressed: boolean;
  onType: (text: string) => void;
  onSend: () => void;
};

/** The draft arrives in the box a person answers from, above the field it will be inserted into. */
export function ReplyComposer({
  live,
  showsSendHint,
  emptySends,
  isSendPressed,
  onType,
  onSend,
  ...draftArea
}: ReplyComposerProps) {
  const hintId = useId();
  const shouldReduceMotion = usePrefersReducedMotion();

  function sendFromKeys(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    const hasModifier = event.metaKey || event.ctrlKey;
    const isSendKey = event.key === 'Enter' && hasModifier;
    if (!isSendKey) {
      return;
    }
    event.preventDefault();
    onSend();
  }

  return (
    <div className='bg-card hairline-ring ring-foreground/12 has-[textarea:focus-visible]:ring-ring/25 dark:bg-foreground/[0.04] dark:ring-foreground/15 flex flex-col rounded-2xl p-2 shadow-[0_1px_2px_rgb(0_0_0/0.05)] transition-[box-shadow] duration-150 has-[textarea:focus-visible]:ring-[3px]'>
      <AnimatedSize>
        <DraftArea {...draftArea} />
      </AnimatedSize>
      <textarea
        data-reply-field
        value={live.reply}
        rows={2}
        aria-label='Reply to the customer'
        aria-invalid={showsSendHint}
        aria-describedby={describedByOf(showsSendHint, hintId)}
        placeholder={placeholderOf(draftArea.draft)}
        onChange={(event) => onType(event.target.value)}
        onKeyDown={sendFromKeys}
        className='placeholder:text-muted-foreground/75 field-sizing-content max-h-[9lh] min-h-[2lh] resize-none bg-transparent px-1.5 py-1 text-base leading-normal outline-none md:text-[13px]'
      />
      <div className='flex min-h-7 items-center gap-2 pt-2'>
        <div className='min-w-0 flex-1 px-1.5'>
          {showsSendHint && (
            <motion.p
              key={emptySends}
              id={hintId}
              animate={nudgeOf(shouldReduceMotion)}
              transition={{ duration: 0.28 }}
              className='text-destructive-ink text-xs'
            >
              {EMPTY_SEND_HINT}
            </motion.p>
          )}
          {!showsSendHint && (
            <p className='text-muted-foreground hidden items-center gap-1.5 text-xs @md:flex'>
              <KbdGroup aria-hidden='true'>
                <Kbd>Ctrl</Kbd>
                <Kbd>Enter</Kbd>
              </KbdGroup>
              <span className='sr-only'>Control or Command with Enter</span>
              sends
            </p>
          )}
        </div>
        <MorphButton
          type='button'
          size='sm'
          data-reply-send
          state={SEND_STATE[live.send]}
          labels={SEND_LABELS}
          idleIcon={<SendIcon />}
          onClick={onSend}
          className={pressedSolidOf(isSendPressed)}
        />
      </div>
    </div>
  );
}
