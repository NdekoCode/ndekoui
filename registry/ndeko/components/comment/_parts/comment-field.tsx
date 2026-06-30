'use client';

import { useState } from 'react';

import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import { Textarea } from '@/registry/ndeko/ui/textarea';

import { PersonAvatar } from './comment-parts';
import { currentUser } from './people';

type CommentFieldProps = {
  placeholder: string;
  submitLabel?: string;
  onSubmit: (body: string) => void;
  onCancel?: () => void;
  autoFocus?: boolean;
  showsAvatar?: boolean;
  className?: string;
};

function isSendKey(event: React.KeyboardEvent<HTMLTextAreaElement>) {
  const isCommand = event.metaKey || event.ctrlKey;
  return isCommand && event.key === 'Enter';
}

/** A comment field that grows with its text; Cmd or Ctrl and Enter sends, Escape leaves. */
export function CommentField({
  placeholder,
  submitLabel = 'Comment',
  onSubmit,
  onCancel,
  autoFocus = false,
  showsAvatar = true,
  className,
}: CommentFieldProps) {
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
    if (isSendKey(event)) {
      event.preventDefault();
      submit();
      return;
    }
    if (event.key !== 'Escape') {
      return;
    }
    event.stopPropagation();
    if (onCancel) {
      onCancel();
      return;
    }
    event.currentTarget.blur();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn('flex items-start gap-3', className)}
    >
      {showsAvatar && <PersonAvatar person={me} className='mt-1' />}
      <div className='relative min-w-0 flex-1'>
        <Textarea
          autoFocus={autoFocus}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          aria-label={placeholder}
          placeholder={placeholder}
          className='min-h-9 py-2 pe-24'
        />
        <Button
          type='submit'
          size='sm'
          disabled={!canSend}
          className='absolute end-1 bottom-1'
        >
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
