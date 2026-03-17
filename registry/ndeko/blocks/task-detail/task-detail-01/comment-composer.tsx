'use client';

import { useState } from 'react';

import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import { Textarea } from '@/registry/ndeko/ui/textarea';

import { currentUser } from './detail-model';
import { PersonAvatar } from './task-glyphs';

type CommentComposerProps = {
  onSubmit: (body: string) => void;
  className?: string;
};

export function CommentComposer({ onSubmit, className }: CommentComposerProps) {
  const [body, setBody] = useState('');
  const me = currentUser();
  const trimmed = body.trim();
  const canSend = trimmed.length > 0;

  function submit() {
    if (!canSend) {
      return;
    }
    onSubmit(trimmed);
    setBody('');
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submit();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Escape') {
      event.stopPropagation();
      event.currentTarget.blur();
      return;
    }
    const isCommand = event.metaKey || event.ctrlKey;
    if (event.key === 'Enter' && isCommand) {
      event.preventDefault();
      submit();
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn('flex items-start gap-2.5', className)}
    >
      <PersonAvatar person={me} className='mt-1 size-7 text-[10px]' />
      <div className='relative min-w-0 flex-1'>
        <Textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          aria-label={`Comment as ${me.name}`}
          placeholder='Leave a comment'
          className='min-h-9 py-2 pe-24'
        />
        <Button
          type='submit'
          size='sm'
          disabled={!canSend}
          className='absolute end-1 bottom-1'
        >
          Comment
        </Button>
      </div>
    </form>
  );
}
