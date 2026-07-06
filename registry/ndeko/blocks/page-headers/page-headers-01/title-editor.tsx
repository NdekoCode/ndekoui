'use client';

import { useEffect, useId, useRef, useState } from 'react';

import { Button } from '@/registry/ndeko/ui/button';
import { Input } from '@/registry/ndeko/ui/input';

type TitleEditorProps = {
  title: string;
  onSave: (title: string) => void;
  onCancel: () => void;
};

export function TitleEditor({ title, onSave, onCancel }: TitleEditorProps) {
  const [draft, setDraft] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);
  const fieldId = useId();
  const trimmed = draft.trim();
  const canSave = trimmed !== '';

  useEffect(() => {
    const input = inputRef.current;
    input?.focus({ preventScroll: true });
    input?.select();
  }, []);

  function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSave) {
      return;
    }
    onSave(trimmed);
  }

  function cancelOnEscape(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Escape') {
      return;
    }
    event.preventDefault();
    onCancel();
  }

  return (
    <form
      onSubmit={save}
      className='flex min-w-0 flex-1 flex-wrap items-center gap-2 transition-opacity duration-150 starting:opacity-0'
    >
      <label htmlFor={fieldId} className='sr-only'>
        Project name
      </label>
      <Input
        ref={inputRef}
        id={fieldId}
        size='lg'
        autoComplete='off'
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={cancelOnEscape}
        className='min-w-[12rem] flex-1 font-semibold'
      />
      <div className='flex items-center gap-2'>
        <Button type='submit' disabled={!canSave}>
          Save
        </Button>
        <Button type='button' variant='ghost' onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
