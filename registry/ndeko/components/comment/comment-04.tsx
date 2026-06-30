'use client';

import { useRef, useState } from 'react';

import {
  EllipsisIcon,
  PencilIcon,
  TrashIcon,
} from '@/registry/ndeko/lib/icons';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Button } from '@/registry/ndeko/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/registry/ndeko/ui/dropdown-menu';
import { Textarea } from '@/registry/ndeko/ui/textarea';

import type { CommentItem } from './_parts/comment-model';
import { CommentBlock, CommentText, TEXT_ACTION } from './_parts/comment-parts';
import { Swap } from './_parts/motion-parts';
import { CURRENT_USER_ID } from './_parts/people';
import { NOW } from './_parts/time';

type Mode = 'reading' | 'editing' | 'deleted';

const CONTEXT: CommentItem = {
  id: 'e1',
  authorId: 'mei',
  at: '2026-11-05T09:48:00',
  body: 'Which date does the file name use, the start of the range or the day of the export?',
};

const MINE: CommentItem = {
  id: 'e2',
  authorId: CURRENT_USER_ID,
  at: '2026-11-05T10:20:00',
  body: 'The day of the export, so two exports of the same range never overwrite each other.',
};

function isSaveKey(event: React.KeyboardEvent<HTMLTextAreaElement>) {
  const isCommand = event.metaKey || event.ctrlKey;
  return isCommand && event.key === 'Enter';
}

function EditForm({
  initialBody,
  onSave,
  onCancel,
}: {
  initialBody: string;
  onSave: (body: string) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState(initialBody);
  const trimmed = draft.trim();
  const hasText = trimmed.length > 0;
  const isChanged = trimmed !== initialBody;
  const canSave = hasText && isChanged;

  function save() {
    if (!canSave) {
      return;
    }
    onSave(trimmed);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    save();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (isSaveKey(event)) {
      event.preventDefault();
      save();
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      onCancel();
    }
  }

  function placeCaretAtEnd(event: React.FocusEvent<HTMLTextAreaElement>) {
    const length = event.currentTarget.value.length;
    event.currentTarget.setSelectionRange(length, length);
  }

  return (
    <form onSubmit={handleSubmit} className='mt-1 flex flex-col gap-2'>
      <Textarea
        autoFocus
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={placeCaretAtEnd}
        aria-label='Edit your comment'
        className='min-h-16'
      />
      <div className='flex items-center justify-end gap-2'>
        <span className='text-muted-foreground me-auto text-xs'>
          Escape to cancel
        </span>
        <Button type='button' variant='ghost' size='sm' onClick={onCancel}>
          Cancel
        </Button>
        <Button type='submit' size='sm' disabled={!canSave}>
          Save
        </Button>
      </div>
    </form>
  );
}

function CommentActions({
  triggerRef,
  onEdit,
  onDelete,
}: {
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            ref={triggerRef}
            variant='ghost'
            size='icon-sm'
            aria-label='Comment actions'
            className='text-muted-foreground'
          />
        }
      >
        <EllipsisIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-40'>
        <DropdownMenuItem onClick={onEdit}>
          <PencilIcon />
          Edit
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant='destructive' onClick={onDelete}>
          <TrashIcon />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function editedMarkOf(comment: CommentItem) {
  if (!comment.editedAt) {
    return 'original';
  }
  return 'edited';
}

export default function Comment04() {
  const [comment, setComment] = useState(MINE);
  const [mode, setMode] = useState<Mode>('reading');
  const actionsRef = useRef<HTMLButtonElement>(null);
  const isEdited = Boolean(comment.editedAt);

  function backToReading() {
    setMode('reading');
    requestAnimationFrame(() => actionsRef.current?.focus());
  }

  function save(body: string) {
    setComment((current) => ({ ...current, body, editedAt: NOW }));
    backToReading();
  }

  return (
    <section aria-label='Comments' className='w-full max-w-md'>
      <ul className='flex flex-col gap-4'>
        <li>
          <CommentBlock comment={CONTEXT} />
        </li>
        <li>
          <AnimatedSize>
            {mode === 'deleted' && (
              <div className='bg-foreground/[0.03] flex min-h-10 items-center justify-between gap-3 rounded-lg ps-3 pe-1.5'>
                <p className='text-muted-foreground text-[13px]'>
                  You deleted your comment
                </p>
                <button
                  type='button'
                  autoFocus
                  onClick={backToReading}
                  className={TEXT_ACTION}
                >
                  Undo
                </button>
              </div>
            )}
            {mode !== 'deleted' && (
              <CommentBlock
                comment={comment}
                meta={
                  <Swap
                    swapKey={editedMarkOf(comment)}
                    className='text-muted-foreground text-xs'
                  >
                    {isEdited && <span>(edited)</span>}
                  </Swap>
                }
                actions={
                  <CommentActions
                    triggerRef={actionsRef}
                    onEdit={() => setMode('editing')}
                    onDelete={() => setMode('deleted')}
                  />
                }
              >
                {mode === 'reading' && <CommentText body={comment.body} />}
                {mode === 'editing' && (
                  <EditForm
                    initialBody={comment.body}
                    onSave={save}
                    onCancel={backToReading}
                  />
                )}
              </CommentBlock>
            )}
          </AnimatedSize>
        </li>
      </ul>
    </section>
  );
}
