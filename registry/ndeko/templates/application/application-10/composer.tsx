'use client';

import { pressedSolidOf } from '@/registry/ndeko/lib/demonstration';
import { ArrowUpIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';

function isSendKey(event: React.KeyboardEvent<HTMLTextAreaElement>) {
  const isPlainEnter = event.key === 'Enter' && !event.shiftKey;
  return isPlainEnter && !event.nativeEvent.isComposing;
}

type ComposerProps = {
  draft: string;
  placeholder: string;
  canSend: boolean;
  isSendPressed: boolean;
  onDraftChange: (text: string) => void;
  onSend: () => void;
};

export function Composer({
  draft,
  placeholder,
  canSend,
  isSendPressed,
  onDraftChange,
  onSend,
}: ComposerProps) {
  function handleKeys(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (!isSendKey(event)) {
      return;
    }
    event.preventDefault();
    if (canSend) {
      onSend();
    }
  }

  return (
    <div className='bg-card hairline-ring ring-foreground/12 has-[textarea:focus-visible]:ring-ring/25 dark:bg-foreground/[0.04] dark:ring-foreground/15 flex items-end gap-2 rounded-2xl p-2 shadow-[0_1px_2px_rgb(0_0_0/0.05)] transition-[box-shadow] duration-150 has-[textarea:focus-visible]:ring-[3px]'>
      <textarea
        value={draft}
        rows={1}
        aria-label='Question for the researcher'
        placeholder={placeholder}
        onChange={(event) => onDraftChange(event.target.value)}
        onKeyDown={handleKeys}
        className='placeholder:text-muted-foreground/75 field-sizing-content max-h-[6lh] min-h-8 flex-1 resize-none bg-transparent px-1.5 py-1.5 text-base leading-normal outline-none md:text-[13px]'
      />
      <Button
        type='button'
        size='icon'
        aria-label='Send the question'
        disabled={!canSend}
        onClick={onSend}
        className={pressedSolidOf(isSendPressed)}
      >
        <ArrowUpIcon />
      </Button>
    </div>
  );
}
