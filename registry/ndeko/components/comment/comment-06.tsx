'use client';

import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type MotionProps,
} from 'motion/react';
import { useEffect, useRef, useState } from 'react';

import {
  FileSpreadsheetIcon,
  FileTextIcon,
  ImageIcon,
  LoaderCircleIcon,
  PaperclipIcon,
  XIcon,
  type Icon,
} from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';
import { Textarea } from '@/registry/ndeko/ui/textarea';

import { draftCommentOf, type CommentItem } from './_parts/comment-model';
import { CommentBlock, CommentText } from './_parts/comment-parts';
import { ENTER, EXIT, heightPresenceOf, Swap } from './_parts/motion-parts';

type FileKind = 'image' | 'sheet' | 'document';

type AttachedFile = {
  id: string;
  name: string;
  size: number;
  kind: FileKind;
  previewSrc?: string;
};

type StagedFile = AttachedFile & {
  isReady: boolean;
};

type AttachedComment = CommentItem & {
  files: AttachedFile[];
};

const MAX_FILE_BYTES = 10 * 1024 * 1024;

const UPLOAD_MS = 900;

const ACCEPTED_TYPES = 'image/*,.pdf,.csv,.txt';

const KIND_ICON: Record<FileKind, Icon> = {
  image: ImageIcon,
  sheet: FileSpreadsheetIcon,
  document: FileTextIcon,
};

const FIRST_COMMENTS: AttachedComment[] = [
  {
    id: 'a1',
    authorId: 'mei',
    at: '2026-11-05T09:52:00',
    body: 'Here is the sample finance sent, and how it looks once opened in the ledger.',
    files: [
      {
        id: 'f1',
        name: 'ledger-preview.svg',
        size: 412_000,
        kind: 'image',
        previewSrc: '/images/scenes/scene-03.svg',
      },
      {
        id: 'f2',
        name: 'invoices-october.csv',
        size: 18_400,
        kind: 'sheet',
      },
    ],
  },
];

const CHIP_MOTION: MotionProps = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95, transition: EXIT },
  transition: ENTER,
};

const CHIP_FADE: MotionProps = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0, transition: EXIT },
  transition: ENTER,
};

function chipMotionOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return CHIP_FADE;
  }
  return CHIP_MOTION;
}

function layoutOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return false;
  }
  return 'position';
}

function sizeLabelOf(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  const kilobytes = bytes / 1024;
  if (kilobytes < 1024) {
    return `${Math.round(kilobytes)} KB`;
  }
  const megabytes = kilobytes / 1024;
  return `${megabytes.toFixed(1)} MB`;
}

function kindOf(file: File): FileKind {
  if (file.type.startsWith('image/')) {
    return 'image';
  }
  const isSheet = file.name.toLowerCase().endsWith('.csv');
  if (isSheet) {
    return 'sheet';
  }
  return 'document';
}

function isAccepted(file: File) {
  const name = file.name.toLowerCase();
  const isImage = file.type.startsWith('image/');
  const isPdf = name.endsWith('.pdf');
  const isCsv = name.endsWith('.csv');
  const isText = name.endsWith('.txt');
  return [isImage, isPdf, isCsv, isText].some(Boolean);
}

function refusalOf(file: File) {
  if (!isAccepted(file)) {
    return `“${file.name}” can’t be attached. Pick an image, a PDF, a CSV or a text file`;
  }
  if (file.size > MAX_FILE_BYTES) {
    return `“${file.name}” is over 10 MB. Attach a smaller file`;
  }
  return null;
}

let stagedCount = 0;

function stagedFileOf(file: File): StagedFile {
  stagedCount += 1;
  return {
    id: `staged-${stagedCount}`,
    name: file.name,
    size: file.size,
    kind: kindOf(file),
    isReady: false,
  };
}

function withReady(files: StagedFile[], fileId: string) {
  return files.map((file) => {
    if (file.id !== fileId) {
      return file;
    }
    return { ...file, isReady: true };
  });
}

function stateKeyOf(isReady: boolean) {
  if (isReady) {
    return 'ready';
  }
  return 'uploading';
}

function FileTile({ file }: { file: AttachedFile }) {
  const Glyph = KIND_ICON[file.kind];
  return (
    <li className='bg-card hairline-ring ring-border flex w-44 flex-col overflow-hidden rounded-lg'>
      {file.previewSrc && (
        // eslint-disable-next-line @next/next/no-img-element -- registry items land in any React app, where next/image may not exist
        <img
          src={file.previewSrc}
          alt=''
          className='bg-muted aspect-[16/9] w-full object-cover'
        />
      )}
      <span className='flex items-center gap-2 px-2.5 py-2'>
        <Glyph className='text-muted-foreground size-4 shrink-0' />
        <span className='min-w-0 flex-1'>
          <span className='block truncate text-xs font-medium'>
            {file.name}
          </span>
          <span className='text-muted-foreground block text-[11px] tabular-nums'>
            {sizeLabelOf(file.size)}
          </span>
        </span>
      </span>
    </li>
  );
}

function PostedComment({ comment }: { comment: AttachedComment }) {
  const shouldReduceMotion = useReducedMotion();
  const hasFiles = comment.files.length > 0;
  return (
    <motion.li
      {...heightPresenceOf(shouldReduceMotion)}
      className='overflow-hidden'
    >
      <CommentBlock comment={comment} className='pb-4'>
        <CommentText body={comment.body} />
        {hasFiles && (
          <ul aria-label='Attachments' className='mt-2 flex flex-wrap gap-2'>
            {comment.files.map((file) => (
              <FileTile key={file.id} file={file} />
            ))}
          </ul>
        )}
      </CommentBlock>
    </motion.li>
  );
}

function StagedChip({
  file,
  onRemove,
}: {
  file: StagedFile;
  onRemove: () => void;
}) {
  const shouldReduceMotion = useReducedMotion();
  const Glyph = KIND_ICON[file.kind];

  return (
    <motion.li
      layout={layoutOf(shouldReduceMotion)}
      {...chipMotionOf(shouldReduceMotion)}
      className='bg-foreground/[0.04] flex h-7 max-w-52 items-center gap-1.5 rounded-md ps-2 pe-0.5 text-xs'
    >
      <Swap swapKey={stateKeyOf(file.isReady)}>
        {!file.isReady && (
          <LoaderCircleIcon className='text-muted-foreground size-3.5 animate-spin' />
        )}
        {file.isReady && <Glyph className='text-muted-foreground size-3.5' />}
      </Swap>
      <span className='min-w-0 truncate font-medium'>{file.name}</span>
      <span className='text-muted-foreground shrink-0 tabular-nums'>
        {sizeLabelOf(file.size)}
      </span>
      <button
        type='button'
        onClick={onRemove}
        aria-label={`Remove ${file.name}`}
        className='text-muted-foreground hover:bg-foreground/5 hover:text-foreground focus-visible:ring-ring/25 inline-flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-md outline-none focus-visible:ring-[3px]'
      >
        <XIcon className='size-3' />
      </button>
    </motion.li>
  );
}

export default function Comment06() {
  const shouldReduceMotion = useReducedMotion();
  const [comments, setComments] = useState(FIRST_COMMENTS);
  const [body, setBody] = useState('');
  const [staged, setStaged] = useState<StagedFile[]>([]);
  const [refusal, setRefusal] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());
  const trimmed = body.trim();
  const hasStaged = staged.length > 0;
  const isUploading = staged.some((file) => !file.isReady);
  const hasContent = trimmed.length > 0 || hasStaged;
  const canSend = hasContent && !isUploading;

  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  function finishUpload(fileId: string) {
    const timer = setTimeout(() => {
      timers.current.delete(timer);
      setStaged((current) => withReady(current, fileId));
    }, UPLOAD_MS);
    timers.current.add(timer);
  }

  function stage(event: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(event.target.files ?? []);
    event.target.value = '';
    const refusals = picked.map(refusalOf);
    const firstRefusal = refusals.find((message) => message !== null);
    setRefusal(firstRefusal ?? null);
    const accepted = picked.filter((file) => refusalOf(file) === null);
    const added = accepted.map(stagedFileOf);
    setStaged((current) => [...current, ...added]);
    added.forEach((file) => finishUpload(file.id));
  }

  function unstage(fileId: string) {
    setStaged((current) => current.filter((file) => file.id !== fileId));
  }

  function send(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSend) {
      return;
    }
    const files: AttachedFile[] = staged.map((file) => ({
      id: file.id,
      name: file.name,
      size: file.size,
      kind: file.kind,
    }));
    const comment: AttachedComment = { ...draftCommentOf(trimmed), files };
    setComments((current) => [...current, comment]);
    setBody('');
    setStaged([]);
    setRefusal(null);
  }

  return (
    <section aria-label='Comments with files' className='w-full max-w-md'>
      <ul>
        <AnimatePresence initial={false}>
          {comments.map((comment) => (
            <PostedComment key={comment.id} comment={comment} />
          ))}
        </AnimatePresence>
      </ul>
      <form
        onSubmit={send}
        className='bg-card hairline-ring ring-foreground/12 focus-within:ring-ring/25 dark:bg-foreground/[0.04] dark:ring-foreground/15 rounded-lg shadow-[0_1px_2px_rgb(0_0_0/0.05)] focus-within:ring-[3px]'
      >
        <Textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          rows={2}
          aria-label='Comment'
          placeholder='Add a comment or attach a file'
          className='min-h-14 border-0 bg-transparent shadow-none ring-0 focus-visible:border-transparent focus-visible:ring-0 dark:bg-transparent'
        />
        <ul aria-label='Files to attach' className='flex flex-wrap gap-1 px-2'>
          <AnimatePresence initial={false} mode='popLayout'>
            {staged.map((file) => (
              <StagedChip
                key={file.id}
                file={file}
                onRemove={() => unstage(file.id)}
              />
            ))}
          </AnimatePresence>
        </ul>
        <div className='flex items-center justify-between px-1.5 py-1.5'>
          <input
            ref={inputRef}
            type='file'
            multiple
            accept={ACCEPTED_TYPES}
            onChange={stage}
            className='sr-only'
            tabIndex={-1}
            aria-hidden='true'
          />
          <Button
            type='button'
            variant='ghost'
            size='icon-sm'
            aria-label='Attach files'
            onClick={() => inputRef.current?.click()}
            className='text-muted-foreground'
          >
            <PaperclipIcon />
          </Button>
          <Button type='submit' size='sm' disabled={!canSend}>
            Comment
          </Button>
        </div>
      </form>
      <AnimatePresence initial={false}>
        {refusal && (
          <motion.p
            key='refusal'
            role='alert'
            {...heightPresenceOf(shouldReduceMotion)}
            className='text-destructive-ink overflow-hidden text-xs'
          >
            <span className='block pt-2'>{refusal}</span>
          </motion.p>
        )}
      </AnimatePresence>
    </section>
  );
}
