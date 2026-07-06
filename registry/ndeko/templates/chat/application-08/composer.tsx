'use client';

import { pressedSolidOf } from '@/registry/ndeko/lib/demonstration';
import { ArrowUpIcon, StopIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';
import { Swap } from '@/registry/ndeko/ui/chat-motion';

function isSendKey(event: React.KeyboardEvent<HTMLTextAreaElement>) {
  const isPlainEnter = event.key === 'Enter' && !event.shiftKey;
  return isPlainEnter && !event.nativeEvent.isComposing;
}

function buttonKeyOf(isRunning: boolean) {
  if (isRunning) {
    return 'stop';
  }
  return 'send';
}

function buttonLabelOf(isRunning: boolean) {
  if (isRunning) {
    return 'Stop the run';
  }
  return 'Send the message';
}

type ComposerProps = {
  draft: string;
  placeholder: string;
  canSend: boolean;
  isRunning: boolean;
  isReadOnly: boolean;
  isSendPressed: boolean;
  onDraftChange: (text: string) => void;
  onSend: () => void;
  onStop: () => void;
};

export function Composer({
  draft,
  placeholder,
  canSend,
  isRunning,
  isReadOnly,
  isSendPressed,
  onDraftChange,
  onSend,
  onStop,
}: ComposerProps) {
  const isDisabled = !canSend && !isRunning;

  function handleKeys(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (!isSendKey(event)) {
      return;
    }
    event.preventDefault();
    if (canSend) {
      onSend();
    }
  }

  function press() {
    if (isRunning) {
      onStop();
      return;
    }
    onSend();
  }

  return (
    <div className='bg-card hairline-ring ring-foreground/12 has-[textarea:focus-visible]:ring-ring/25 dark:bg-foreground/[0.04] dark:ring-foreground/15 flex items-end gap-2 rounded-2xl p-2 shadow-[0_1px_2px_rgb(0_0_0/0.05)] transition-[box-shadow] duration-150 has-[textarea:focus-visible]:ring-[3px]'>
      <textarea
        data-composer-field
        value={draft}
        rows={1}
        aria-label='Message to Quenby'
        placeholder={placeholder}
        disabled={isReadOnly}
        onChange={(event) => onDraftChange(event.target.value)}
        onKeyDown={handleKeys}
        className='placeholder:text-muted-foreground/75 field-sizing-content max-h-[6lh] min-h-8 flex-1 resize-none bg-transparent px-1.5 py-1.5 text-base leading-normal outline-none md:text-[13px]'
      />
      <Button
        type='button'
        size='icon'
        aria-label={buttonLabelOf(isRunning)}
        disabled={isDisabled}
        onClick={press}
        className={pressedSolidOf(isSendPressed)}
      >
        <Swap swapKey={buttonKeyOf(isRunning)}>
          {isRunning && <StopIcon />}
          {!isRunning && <ArrowUpIcon />}
        </Swap>
      </Button>
    </div>
  );
}
