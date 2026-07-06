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
  HourglassIcon,
  PaperclipIcon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Button } from '@/registry/ndeko/ui/button';
import { Swap } from '@/registry/ndeko/ui/chat-motion';

import { AttachmentChip, SkillChip, ToolChip } from './chips';
import {
  FULL_HINT,
  QUEUE_FULL_HINT,
  type Attachment,
  type AttachmentKind,
  type Effort,
  type SkillId,
  type ToolId,
} from './data';
import { EffortRamp } from './effort-ramp';
import { QueueTray } from './queue-tray';
import type { Hint, Outgoing } from './session';
import { ToolsMenu } from './tools-menu';

const HINT_TEXT: Record<Hint, string> = {
  none: '',
  attachments: FULL_HINT,
  queue: QUEUE_FULL_HINT,
};

const NUDGE = { x: [0, -4, 4, 0] };

const STILL = { x: 0 };

function nudgeOf(shouldReduceMotion: boolean) {
  if (shouldReduceMotion) {
    return STILL;
  }
  return NUDGE;
}

function kindOf(file: File): AttachmentKind {
  if (file.type.startsWith('image/')) {
    return 'photo';
  }
  return 'file';
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

function sendLabelOf(isBusy: boolean) {
  if (isBusy) {
    return 'Queue the message';
  }
  return 'Send the message';
}

function sendKeyOf(isBusy: boolean) {
  if (isBusy) {
    return 'queue';
  }
  return 'send';
}

type ComposerProps = {
  draft: string;
  placeholder: string;
  canSend: boolean;
  isBusy: boolean;
  attachments: Attachment[];
  toolIds: ToolId[];
  skillIds: SkillId[];
  effort: Effort;
  queue: Outgoing[];
  hint: Hint;
  refusals: number;
  pressed: string | null;
  onDraftChange: (text: string) => void;
  onSend: () => void;
  onAttach: (attachments: Attachment[]) => void;
  onDetach: (id: string) => void;
  onToggleTool: (id: ToolId) => void;
  onToggleSkill: (id: SkillId) => void;
  onEffortChange: (effort: Effort) => void;
  onRemoveQueued: (id: string) => void;
};

/** Nothing is uploaded here: a picked file is only listed, by its name and its size. */
export function Composer({
  draft,
  placeholder,
  canSend,
  isBusy,
  attachments,
  toolIds,
  skillIds,
  effort,
  queue,
  hint,
  refusals,
  pressed,
  onDraftChange,
  onSend,
  onAttach,
  onDetach,
  onToggleTool,
  onToggleSkill,
  onEffortChange,
  onRemoveQueued,
}: ComposerProps) {
  const hintId = useId();
  const pickerRef = useRef<HTMLInputElement>(null);
  const pickedCount = useRef(0);
  const shouldReduceMotion = usePrefersReducedMotion();
  const hasHint = hint !== 'none';
  const hasQueue = queue.length > 0;
  const chipCount = attachments.length + toolIds.length + skillIds.length;
  const hasChips = chipCount > 0;

  function sendFromKeys(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (!isSendKey(event)) {
      return;
    }
    event.preventDefault();
    if (canSend) {
      onSend();
    }
  }

  function openPicker() {
    pickerRef.current?.click();
  }

  function attachmentOf(file: File): Attachment {
    pickedCount.current += 1;
    const id = `picked-${pickedCount.current}`;
    return { id, kind: kindOf(file), name: file.name, bytes: file.size };
  }

  function attachPicked(event: React.ChangeEvent<HTMLInputElement>) {
    const picked = event.target.files ?? [];
    const files = Array.from(picked);
    event.target.value = '';
    if (files.length === 0) {
      return;
    }
    onAttach(files.map(attachmentOf));
  }

  return (
    <div className='bg-card hairline-ring ring-foreground/12 has-[textarea:focus-visible]:ring-ring/25 dark:bg-foreground/[0.04] dark:ring-foreground/15 relative flex flex-col rounded-2xl p-2 shadow-[0_1px_2px_rgb(0_0_0/0.05)] transition-[box-shadow] duration-150 has-[textarea:focus-visible]:ring-[3px]'>
      <AnimatedSize>
        {hasQueue && <QueueTray queue={queue} onRemove={onRemoveQueued} />}
      </AnimatedSize>
      <AnimatedSize>
        {hasChips && (
          <ul
            aria-label='Added to this message'
            className='flex flex-wrap gap-1.5 pb-2'
          >
            {attachments.map((attachment) => (
              <AttachmentChip
                key={attachment.id}
                attachment={attachment}
                onRemove={onDetach}
              />
            ))}
            {toolIds.map((id) => (
              <ToolChip key={id} toolId={id} onRemove={onToggleTool} />
            ))}
            {skillIds.map((id) => (
              <SkillChip key={id} skillId={id} onRemove={onToggleSkill} />
            ))}
          </ul>
        )}
      </AnimatedSize>
      <textarea
        data-composer-field
        value={draft}
        rows={2}
        aria-label='Message to the agent'
        aria-invalid={hasHint}
        aria-describedby={describedByOf(hasHint, hintId)}
        placeholder={placeholder}
        onChange={(event) => onDraftChange(event.target.value)}
        onKeyDown={sendFromKeys}
        className='placeholder:text-muted-foreground/75 field-sizing-content max-h-[8lh] min-h-[2lh] resize-none bg-transparent px-1.5 py-1 text-base leading-normal outline-none md:text-[13px]'
      />
      <div className='flex flex-wrap items-center gap-1 pt-2'>
        <Button
          type='button'
          variant='ghost'
          size='icon-sm'
          aria-label='Attach photos or files'
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
        <ToolsMenu
          toolIds={toolIds}
          skillIds={skillIds}
          isPressed={pressed === 'tools'}
          onToggleTool={onToggleTool}
          onToggleSkill={onToggleSkill}
        />
        <EffortRamp
          value={effort}
          isPressed={pressed === 'effort'}
          onValueChange={onEffortChange}
        />
        <Button
          type='button'
          size='icon'
          aria-label={sendLabelOf(isBusy)}
          disabled={!canSend}
          onClick={onSend}
          className={cn('ms-auto', pressedSolidOf(pressed === 'send'))}
        >
          <Swap swapKey={sendKeyOf(isBusy)}>
            {isBusy && <HourglassIcon />}
            {!isBusy && <ArrowUpIcon />}
          </Swap>
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

type ReadOnlyNoteProps = {
  onNewSession: () => void;
};

export function ReadOnlyNote({ onNewSession }: ReadOnlyNoteProps) {
  return (
    <div className='bg-foreground/[0.04] flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-2xl px-3 py-2 text-[13px]'>
      <p className='text-muted-foreground min-w-0 flex-1'>
        This session is read only. Start a new one to write.
      </p>
      <Button type='button' size='sm' variant='outline' onClick={onNewSession}>
        New session
      </Button>
    </div>
  );
}
