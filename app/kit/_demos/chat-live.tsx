'use client';

import { useEffect, useId, useRef, useState } from 'react';

import {
  CheckIcon,
  FileIcon,
  PaperclipIcon,
  PlusIcon,
  RefreshCwIcon,
  UploadCloudIcon,
} from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';
import {
  ChatContainerContent,
  ChatContainerRoot,
} from '@/registry/ndeko/ui/chat-container';
import {
  FileUpload,
  FileUploadContent,
  FileUploadTrigger,
} from '@/registry/ndeko/ui/chat-file-upload';
import { Message, MessageContent } from '@/registry/ndeko/ui/chat-message';
import { Fold, Swap } from '@/registry/ndeko/ui/chat-motion';
import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputSubmit,
  PromptInputTextarea,
} from '@/registry/ndeko/ui/chat-prompt-input';
import {
  ResponseStream,
  type StreamMode,
} from '@/registry/ndeko/ui/chat-response-stream';

type ChatLine = {
  id: string;
  isMine: boolean;
  text: string;
};

type AttachedFile = {
  id: string;
  name: string;
  size: number;
};

const SEED_LINES: ChatLine[] = [
  { id: 'seed-1', isMine: false, text: 'The pricing copy is ready for review' },
  { id: 'seed-2', isMine: true, text: 'Thanks, I will read it after lunch' },
  { id: 'seed-3', isMine: false, text: 'The hero demo still needs a pass' },
  { id: 'seed-4', isMine: true, text: 'I can take it this afternoon' },
];

const NEW_LINES = [
  'Docs search ships tomorrow',
  'Design review moved to Thursday',
  'The beta list has fifty workspaces now',
  'Launch plan is attached to the project',
];

const REPLY_DELAY_MS = 2000;

const STREAMED_REPLY =
  'The 2.4 release moves pagination to cursors, raises the rate limit for workspace tokens and adds an endpoint to delete comments.';

const STREAM_MODES: StreamMode[] = ['typewriter', 'fade'];

const STREAM_TEXT = 'text-foreground min-h-16 text-sm leading-relaxed';

const BYTES_PER_KILOBYTE = 1024;
const BYTES_PER_MEGABYTE = BYTES_PER_KILOBYTE * 1024;

function lineAlignmentOf(isMine: boolean) {
  if (isMine) {
    return 'justify-end';
  }
  return 'justify-start';
}

function nextLineOf(count: number): ChatLine {
  const index = count % NEW_LINES.length;
  const isMine = count % 2 === 1;
  return { id: `added-${count}`, isMine, text: NEW_LINES[index] };
}

function followKeyOf(isFollowing: boolean) {
  if (isFollowing) {
    return 'following';
  }
  return 'follow';
}

function followLabelOf(isFollowing: boolean) {
  if (isFollowing) {
    return 'Following';
  }
  return 'Follow thread';
}

function foldLabelOf(isOpen: boolean) {
  if (isOpen) {
    return 'Hide the sources';
  }
  return 'Show the sources';
}

function sizeLabelOf(bytes: number) {
  const isLarge = bytes >= BYTES_PER_MEGABYTE;
  if (isLarge) {
    const megabytes = bytes / BYTES_PER_MEGABYTE;
    const roundedMegabytes = megabytes.toFixed(1);
    return `${roundedMegabytes} MB`;
  }
  const kilobytes = bytes / BYTES_PER_KILOBYTE;
  const wholeKilobytes = Math.round(kilobytes);
  const roundedKilobytes = Math.max(1, wholeKilobytes);
  return `${roundedKilobytes} KB`;
}

function attachedFileOf(file: File, position: number): AttachedFile {
  return { id: `file-${position}`, name: file.name, size: file.size };
}

export function ChatContainerDemo() {
  const [lines, setLines] = useState(SEED_LINES);
  const [addedCount, setAddedCount] = useState(0);

  function addLine() {
    const line = nextLineOf(addedCount);
    setLines((current) => [...current, line]);
    setAddedCount((count) => count + 1);
  }

  return (
    <div className='flex w-full max-w-md flex-col items-start gap-3'>
      <ChatContainerRoot className='hairline-ring ring-border h-56 w-full rounded-lg'>
        <ChatContainerContent className='gap-2 p-3'>
          {lines.map((line) => (
            <Message key={line.id} className={lineAlignmentOf(line.isMine)}>
              <MessageContent className='max-w-[80%] py-1.5 text-[13px]'>
                {line.text}
              </MessageContent>
            </Message>
          ))}
        </ChatContainerContent>
      </ChatContainerRoot>
      <Button variant='outline' size='sm' onClick={addLine}>
        <PlusIcon />
        Add a message
      </Button>
    </div>
  );
}

export function PromptInputDemo() {
  const [draft, setDraft] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const replyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (replyTimer.current) {
        clearTimeout(replyTimer.current);
      }
    };
  }, []);

  function clearReplyTimer() {
    if (replyTimer.current) {
      clearTimeout(replyTimer.current);
    }
  }

  function finishReply() {
    setIsLoading(false);
  }

  function send() {
    const text = draft.trim();
    if (text.length === 0) {
      return;
    }
    setDraft('');
    setIsLoading(true);
    clearReplyTimer();
    replyTimer.current = setTimeout(finishReply, REPLY_DELAY_MS);
  }

  function stop() {
    clearReplyTimer();
    setIsLoading(false);
  }

  return (
    <PromptInput
      value={draft}
      onValueChange={setDraft}
      onSubmit={send}
      isLoading={isLoading}
      className='w-full max-w-md'
    >
      <PromptInputTextarea
        aria-label='Prompt'
        placeholder='Ask about this project'
      />
      <PromptInputActions className='justify-between gap-2 pt-1'>
        <PromptInputAction tooltip='Attach files'>
          <Button
            type='button'
            variant='ghost'
            size='icon'
            aria-label='Attach files'
            className='text-muted-foreground'
          >
            <PaperclipIcon />
          </Button>
        </PromptInputAction>
        <PromptInputSubmit onStop={stop} />
      </PromptInputActions>
    </PromptInput>
  );
}

type StreamPaneProps = {
  mode: StreamMode;
  runCount: number;
};

function StreamPane({ mode, runCount }: StreamPaneProps) {
  const hasStreamed = runCount > 0;

  return (
    <div className='flex flex-col gap-2'>
      <p className='text-muted-foreground font-mono text-[11px]'>
        mode=&apos;{mode}&apos;
      </p>
      {!hasStreamed && <p className={STREAM_TEXT}>{STREAMED_REPLY}</p>}
      {hasStreamed && (
        <ResponseStream
          key={runCount}
          as='p'
          mode={mode}
          textStream={STREAMED_REPLY}
          className={STREAM_TEXT}
        />
      )}
    </div>
  );
}

export function ResponseStreamDemo() {
  const [runCount, setRunCount] = useState(0);

  function streamAgain() {
    setRunCount((count) => count + 1);
  }

  return (
    <div className='flex w-full flex-col items-start gap-4'>
      <div className='grid w-full gap-6 sm:grid-cols-2'>
        {STREAM_MODES.map((mode) => (
          <StreamPane key={mode} mode={mode} runCount={runCount} />
        ))}
      </div>
      <Button variant='outline' size='sm' onClick={streamAgain}>
        <RefreshCwIcon />
        Stream the reply
      </Button>
    </div>
  );
}

export function ChatMotionDemo() {
  const foldId = useId();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFoldOpen, setIsFoldOpen] = useState(false);
  const followKey = followKeyOf(isFollowing);
  const followLabel = followLabelOf(isFollowing);
  const foldLabel = foldLabelOf(isFoldOpen);

  function toggleFollow() {
    setIsFollowing((current) => !current);
  }

  function toggleFold() {
    setIsFoldOpen((current) => !current);
  }

  return (
    <div className='flex w-full max-w-xs flex-col items-center gap-5'>
      <Button
        variant='outline'
        aria-pressed={isFollowing}
        onClick={toggleFollow}
      >
        <Swap swapKey={followKey}>
          <span className='flex items-center gap-2'>
            {isFollowing && <CheckIcon />}
            {!isFollowing && <PlusIcon />}
            {followLabel}
          </span>
        </Swap>
      </Button>
      <div className='flex w-full flex-col items-center'>
        <Button
          variant='ghost'
          size='sm'
          aria-expanded={isFoldOpen}
          aria-controls={foldId}
          onClick={toggleFold}
        >
          {foldLabel}
        </Button>
        <Fold open={isFoldOpen} id={foldId} className='w-full'>
          <ul className='text-muted-foreground flex flex-col gap-1 pt-2 text-[13px]'>
            <li>The API reference, pagination section</li>
            <li>The 2.4 entry of the changelog</li>
          </ul>
        </Fold>
      </div>
    </div>
  );
}

export function FileUploadDemo() {
  const [files, setFiles] = useState<AttachedFile[]>([]);
  const [addedCount, setAddedCount] = useState(0);
  const hasFiles = files.length > 0;

  function addFiles(added: File[]) {
    const attached = added.map((file, index) => {
      const position = addedCount + index;
      return attachedFileOf(file, position);
    });
    setFiles((current) => [...current, ...attached]);
    setAddedCount((count) => count + added.length);
  }

  return (
    <FileUpload onFilesAdded={addFiles}>
      <div className='flex w-full max-w-xs flex-col items-center gap-3'>
        <FileUploadTrigger render={<Button variant='outline' />}>
          <PaperclipIcon />
          Attach files
        </FileUploadTrigger>
        <p className='text-muted-foreground text-xs'>
          Or drop files anywhere on the page
        </p>
        {hasFiles && (
          <ul className='flex w-full flex-col gap-1.5 text-[13px]'>
            {files.map((file) => (
              <li
                key={file.id}
                className='hairline-ring ring-border flex items-center gap-2 rounded-lg px-3 py-2'
              >
                <FileIcon className='text-muted-foreground size-4 shrink-0' />
                <span className='min-w-0 flex-1 truncate'>{file.name}</span>
                <span className='text-muted-foreground text-xs tabular-nums'>
                  {sizeLabelOf(file.size)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <FileUploadContent>
        <div className='bg-card hairline-border border-foreground/25 flex flex-col items-center gap-2 rounded-2xl border-dashed px-10 py-8 text-center shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
          <UploadCloudIcon className='text-muted-foreground size-6' />
          <p className='text-sm font-medium'>Drop files to attach them</p>
        </div>
      </FileUploadContent>
    </FileUpload>
  );
}
