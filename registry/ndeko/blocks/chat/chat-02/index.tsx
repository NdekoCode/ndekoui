'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useId, useRef, useState } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import {
  CircleAlertIcon,
  CircleCheckIcon,
  PaperclipIcon,
  UploadCloudIcon,
} from '@/registry/ndeko/lib/icons';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Button } from '@/registry/ndeko/ui/button';
import {
  FileUpload,
  FileUploadContent,
  useFileUpload,
} from '@/registry/ndeko/ui/chat-file-upload';
import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from '@/registry/ndeko/ui/chat-prompt-input';
import { PromptSuggestion } from '@/registry/ndeko/ui/chat-prompt-suggestion';

import { AttachmentList, formatBytes } from './attachment-list';
import {
  maxBytes,
  maxFiles,
  models,
  seedAttachments,
  sendingMs,
  sentMs,
  suggestions,
  type Attachment,
  type AttachmentKind,
  type ModelValue,
} from './data';
import { ModelPicker } from './model-picker';
import { risePresenceOf } from './presence';
import { SubmitButton, type SubmitPhase } from './submit-button';

type NoticeTone = 'refusal' | 'sent';

type Notice = {
  tone: NoticeTone;
  text: string;
};

const NOTICE_ICON: Record<NoticeTone, React.ReactNode> = {
  refusal: <CircleAlertIcon className='text-warning-foreground size-4' />,
  sent: <CircleCheckIcon className='text-success-foreground size-4' />,
};

function kindOf(file: File): AttachmentKind {
  const isImage = file.type.startsWith('image/');
  if (isImage) {
    return 'image';
  }
  return 'document';
}

function modelLabelOf(value: ModelValue) {
  const model = models.find((candidate) => candidate.value === value);
  return model?.label ?? value;
}

function fileCountOf(count: number) {
  if (count === 1) {
    return '1 file';
  }
  return `${count} files`;
}

function sentTextOf(modelLabel: string, fileCount: number) {
  if (fileCount === 0) {
    return `Sent to ${modelLabel}`;
  }
  const files = fileCountOf(fileCount);
  return `Sent to ${modelLabel} with ${files}`;
}

function refusalOf(tooLargeName: string | null, hasOverflow: boolean) {
  if (tooLargeName) {
    const limit = formatBytes(maxBytes);
    const text = `“${tooLargeName}” is over ${limit}. Attach a smaller copy`;
    return { tone: 'refusal' as const, text };
  }
  if (hasOverflow) {
    const text = `${fileCountOf(maxFiles)} fit in one prompt. Remove one to add another`;
    return { tone: 'refusal' as const, text };
  }
  return null;
}

function focusAtEnd(id: string) {
  const element = document.getElementById(id);
  if (!(element instanceof HTMLTextAreaElement)) {
    return;
  }
  const end = element.value.length;
  element.focus();
  element.setSelectionRange(end, end);
}

type AttachButtonProps = {
  isFull: boolean;
  disabled: boolean;
  onRefuse: () => void;
};

function AttachButton({ isFull, disabled, onRefuse }: AttachButtonProps) {
  const { openPicker } = useFileUpload();

  function attach() {
    if (isFull) {
      onRefuse();
      return;
    }
    openPicker();
  }

  return (
    <PromptInputAction tooltip='Attach files'>
      <Button
        type='button'
        variant='ghost'
        size='icon'
        aria-label='Attach files'
        disabled={disabled}
        onClick={attach}
        className='text-muted-foreground'
      >
        <PaperclipIcon />
      </Button>
    </PromptInputAction>
  );
}

function Composer02() {
  const [draft, setDraft] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>(seedAttachments);
  const [model, setModel] = useState<ModelValue>('deep');
  const [phase, setPhase] = useState<SubmitPhase>('idle');
  const [notice, setNotice] = useState<Notice | null>(null);
  const idCounter = useRef(0);
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());
  const textareaId = useId();
  const shouldReduceMotion = usePrefersReducedMotion();
  const presence = risePresenceOf(shouldReduceMotion);
  const isIdle = phase === 'idle';
  const isWorking = !isIdle;
  const hasText = draft.trim().length > 0;
  const hasAttachments = attachments.length > 0;
  const canSend = hasText || hasAttachments;
  const isFull = attachments.length >= maxFiles;
  const isDraftEmpty = draft.length === 0;
  const showsSuggestions = isDraftEmpty && isIdle;

  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  function schedule(task: () => void, delay: number) {
    const timer = setTimeout(() => {
      timers.current.delete(timer);
      task();
    }, delay);
    timers.current.add(timer);
  }

  function nextId() {
    idCounter.current += 1;
    return `file-${idCounter.current}`;
  }

  function addFiles(files: File[]) {
    const room = maxFiles - attachments.length;
    const accepted: Attachment[] = [];
    let tooLargeName: string | null = null;
    let hasOverflow = false;
    for (const file of files) {
      const isTooLarge = file.size > maxBytes;
      if (isTooLarge) {
        tooLargeName = file.name;
        continue;
      }
      const isOutOfRoom = accepted.length >= room;
      if (isOutOfRoom) {
        hasOverflow = true;
        continue;
      }
      const attachment: Attachment = {
        id: nextId(),
        name: file.name,
        size: file.size,
        kind: kindOf(file),
      };
      accepted.push(attachment);
    }
    setAttachments((current) => [...current, ...accepted]);
    setNotice(refusalOf(tooLargeName, hasOverflow));
  }

  function removeAttachment(id: string) {
    setAttachments((current) => current.filter((item) => item.id !== id));
    setNotice(null);
  }

  function refuseMoreFiles() {
    setNotice(refusalOf(null, true));
  }

  function changeDraft(value: string) {
    setDraft(value);
    if (notice?.tone === 'sent') {
      setNotice(null);
    }
  }

  function applySuggestion(text: string) {
    setDraft(text);
    requestAnimationFrame(() => focusAtEnd(textareaId));
  }

  function send() {
    if (!isIdle) {
      return;
    }
    if (!canSend) {
      return;
    }
    const modelLabel = modelLabelOf(model);
    const sentText = sentTextOf(modelLabel, attachments.length);
    setPhase('sending');
    setNotice(null);
    schedule(() => {
      setPhase('sent');
      setDraft('');
      setAttachments([]);
      setNotice({ tone: 'sent', text: sentText });
    }, sendingMs);
    schedule(() => setPhase('idle'), sendingMs + sentMs);
  }

  return (
    <div className='bg-background text-foreground flex min-h-dvh w-full flex-col items-center px-4 pt-16 pb-10 sm:pt-24'>
      <div className='w-full max-w-xl'>
        <div className='mb-5 space-y-1.5 text-center'>
          <h1 className='text-xl font-semibold text-balance sm:text-2xl'>
            Draft with Quillstone
          </h1>
          <p className='text-muted-foreground text-sm text-balance'>
            Attach notes or a page, pick a model and say what you need
          </p>
        </div>

        <FileUpload onFilesAdded={addFiles} disabled={isWorking}>
          <PromptInput
            value={draft}
            onValueChange={changeDraft}
            onSubmit={send}
            isLoading={isWorking}
          >
            <AnimatedSize>
              <AttachmentList
                attachments={attachments}
                onRemove={removeAttachment}
                disabled={isWorking}
              />
              <PromptInputTextarea
                id={textareaId}
                aria-label='Prompt'
                placeholder='Ask Quillstone to draft, rewrite or summarise'
                readOnly={isWorking}
              />
              <PromptInputActions className='justify-between gap-2 pt-1'>
                <div className='flex min-w-0 items-center gap-1'>
                  <AttachButton
                    isFull={isFull}
                    disabled={isWorking}
                    onRefuse={refuseMoreFiles}
                  />
                  <ModelPicker
                    value={model}
                    onChange={setModel}
                    disabled={isWorking}
                  />
                </div>
                <SubmitButton phase={phase} canSend={canSend} onSend={send} />
              </PromptInputActions>
            </AnimatedSize>
          </PromptInput>
          <FileUploadContent>
            <div className='bg-card hairline-border border-foreground/25 flex flex-col items-center gap-2 rounded-2xl border-dashed px-10 py-8 text-center shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
              <UploadCloudIcon className='text-muted-foreground size-6' />
              <p className='text-sm font-medium'>Drop files to attach them</p>
              <p className='text-muted-foreground text-xs'>
                Up to {fileCountOf(maxFiles)}, {formatBytes(maxBytes)} each
              </p>
            </div>
          </FileUploadContent>
        </FileUpload>

        <AnimatedSize>
          <div aria-live='polite'>
            <AnimatePresence initial={false} mode='popLayout'>
              {notice && (
                <motion.p
                  key={notice.text}
                  className='text-muted-foreground flex items-start gap-2 px-1 pt-3 text-[13px]'
                  {...presence}
                >
                  <span className='mt-px shrink-0'>
                    {NOTICE_ICON[notice.tone]}
                  </span>
                  {notice.text}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </AnimatedSize>

        <AnimatePresence initial={false}>
          {showsSuggestions && (
            <motion.ul
              key='suggestions'
              aria-label='Suggested prompts'
              className='mt-4 flex flex-wrap justify-center gap-2'
              {...presence}
            >
              {suggestions.map((suggestion) => (
                <li key={suggestion}>
                  <PromptSuggestion onClick={() => applySuggestion(suggestion)}>
                    {suggestion}
                  </PromptSuggestion>
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default Composer02;
