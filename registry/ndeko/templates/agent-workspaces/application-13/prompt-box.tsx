'use client';

import { motion } from 'motion/react';
import { useId, useRef } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import {
  pressedQuietOf,
  pressedSolidOf,
} from '@/registry/ndeko/lib/demonstration';
import {
  ArrowUpIcon,
  FileTextIcon,
  PaperclipIcon,
  XIcon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Button } from '@/registry/ndeko/ui/button';

import {
  EMPTY_PROMPT_HINT,
  FULL_HINT,
  type Attachment,
  type ModeId,
  type ModelId,
} from './data';
import { ModeKey, ModelKey } from './prompt-keys';
import type { Hint } from './session';

const KILOBYTE = 1024;

const MEGABYTE = KILOBYTE * KILOBYTE;

const HINT_TEXT: Record<Hint, string> = {
  none: '',
  empty: EMPTY_PROMPT_HINT,
  full: FULL_HINT,
};

const NUDGE = { x: [0, -4, 4, 0] };

const STILL = { x: 0 };

/** A refused entry nudges its reason once. Reduced motion keeps it still. */
function nudgeOf(shouldReduceMotion: boolean) {
  if (shouldReduceMotion) {
    return STILL;
  }
  return NUDGE;
}

/** 48 KB, 1.2 MB. */
function formatBytes(bytes: number) {
  if (bytes < MEGABYTE) {
    const rounded = Math.round(bytes / KILOBYTE);
    const kilobytes = Math.max(1, rounded);
    return `${kilobytes} KB`;
  }
  const megabytes = bytes / MEGABYTE;
  return `${megabytes.toFixed(1)} MB`;
}

function describedByOf(hasHint: boolean, hintId: string) {
  if (hasHint) {
    return hintId;
  }
  return undefined;
}

function isSendKey(event: React.KeyboardEvent<HTMLTextAreaElement>) {
  const isPlainEnter = event.key === 'Enter' && !event.shiftKey;
  return isPlainEnter && !event.nativeEvent.isComposing;
}

type AttachmentChipProps = {
  attachment: Attachment;
  onRemove: (id: string) => void;
};

function AttachmentChip({ attachment, onRemove }: AttachmentChipProps) {
  function remove() {
    onRemove(attachment.id);
  }

  return (
    <li className='bg-foreground/[0.05] flex h-7 max-w-full items-center gap-1.5 rounded-lg ps-2 pe-1 text-xs transition-[opacity,scale] duration-200 ease-(--ease-out-strong) starting:scale-95 starting:opacity-0'>
      <FileTextIcon className='text-muted-foreground size-3.5 shrink-0' />
      <span className='min-w-0 truncate'>{attachment.name}</span>
      <span className='text-muted-foreground shrink-0 tabular-nums'>
        {formatBytes(attachment.bytes)}
      </span>
      <button
        type='button'
        aria-label={`Remove ${attachment.name}`}
        onClick={remove}
        className='text-muted-foreground hover:bg-foreground/[0.07] hover:text-foreground focus-visible:ring-ring/25 flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-md outline-none focus-visible:ring-[3px] active:scale-[0.97]'
      >
        <XIcon className='size-3' />
      </button>
    </li>
  );
}

type PromptBoxProps = {
  draft: string;
  attachments: Attachment[];
  model: ModelId;
  mode: ModeId;
  hint: Hint;
  refusals: number;
  pressed: string | null;
  onType: (text: string) => void;
  onSend: () => void;
  onAttach: (attachments: Attachment[]) => void;
  onDetach: (id: string) => void;
  onModelChange: (model: ModelId) => void;
  onModeChange: (mode: ModeId) => void;
};

/** Nothing is uploaded here: a picked file is only listed, by its name and its size. */
export function PromptBox({
  draft,
  attachments,
  model,
  mode,
  hint,
  refusals,
  pressed,
  onType,
  onSend,
  onAttach,
  onDetach,
  onModelChange,
  onModeChange,
}: PromptBoxProps) {
  const hintId = useId();
  const pickerRef = useRef<HTMLInputElement>(null);
  const pickedCount = useRef(0);
  const shouldReduceMotion = usePrefersReducedMotion();
  const hasHint = hint !== 'none';
  const hasAttachments = attachments.length > 0;

  function sendFromKeys(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (!isSendKey(event)) {
      return;
    }
    event.preventDefault();
    onSend();
  }

  function openPicker() {
    pickerRef.current?.click();
  }

  function attachmentOf(file: File): Attachment {
    pickedCount.current += 1;
    const id = `picked-${pickedCount.current}`;
    return { id, name: file.name, bytes: file.size };
  }

  function attachPicked(event: React.ChangeEvent<HTMLInputElement>) {
    const picked = event.target.files ?? [];
    const files = Array.from(picked);
    event.target.value = '';
    if (files.length === 0) {
      return;
    }
    const added = files.map(attachmentOf);
    onAttach(added);
  }

  return (
    <div
      data-solid
      className='bg-card hairline-ring ring-foreground/12 has-[textarea:focus-visible]:ring-ring/25 dark:bg-foreground/[0.04] dark:ring-foreground/15 relative flex flex-col rounded-2xl p-2 shadow-[0_1px_2px_rgb(0_0_0/0.05)] transition-[box-shadow] duration-150 has-[textarea:focus-visible]:ring-[3px]'
    >
      <AnimatedSize>
        {hasAttachments && (
          <ul
            aria-label='Attached files'
            className='flex flex-wrap gap-1.5 pb-2'
          >
            {attachments.map((attachment) => (
              <AttachmentChip
                key={attachment.id}
                attachment={attachment}
                onRemove={onDetach}
              />
            ))}
          </ul>
        )}
      </AnimatedSize>
      <textarea
        data-prompt-field
        value={draft}
        rows={2}
        aria-label='What the agent should do'
        aria-invalid={hasHint}
        aria-describedby={describedByOf(hasHint, hintId)}
        placeholder='Describe a task, or pick one under this field'
        onChange={(event) => onType(event.target.value)}
        onKeyDown={sendFromKeys}
        className='placeholder:text-muted-foreground/75 field-sizing-content max-h-[8lh] min-h-[2lh] resize-none bg-transparent px-1.5 py-1 text-base leading-normal outline-none md:text-sm'
      />
      <div className='flex flex-wrap items-center gap-1.5 pt-2'>
        <Button
          type='button'
          variant='ghost'
          size='icon-sm'
          aria-label='Attach files'
          onClick={openPicker}
          className={cn(
            'text-muted-foreground',
            pressedQuietOf(pressed === 'attach')
          )}
        >
          <PaperclipIcon />
        </Button>
        <input
          ref={pickerRef}
          type='file'
          multiple
          tabIndex={-1}
          aria-hidden='true'
          onChange={attachPicked}
          className='sr-only'
        />
        <ModelKey value={model} onValueChange={onModelChange} />
        <ModeKey value={mode} onValueChange={onModeChange} />
        <Button
          type='button'
          size='sm'
          onClick={onSend}
          className={cn('ms-auto', pressedSolidOf(pressed === 'send'))}
        >
          Start
          <ArrowUpIcon />
        </Button>
      </div>
      {hasHint && (
        <motion.p
          key={refusals}
          id={hintId}
          animate={nudgeOf(shouldReduceMotion)}
          transition={{ duration: 0.28 }}
          className='text-destructive-ink px-1.5 pt-2 text-xs'
        >
          {HINT_TEXT[hint]}
        </motion.p>
      )}
    </div>
  );
}
