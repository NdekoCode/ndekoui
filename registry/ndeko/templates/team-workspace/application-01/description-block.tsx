'use client';

import { useEffect, useRef, useState } from 'react';

import { PencilIcon, PlusIcon } from '@/registry/ndeko/lib/icons';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Button } from '@/registry/ndeko/ui/button';
import { Textarea } from '@/registry/ndeko/ui/textarea';

function paragraphsOf(text: string) {
  const blocks = text.split(/\n\s*\n/);
  const trimmed = blocks.map((block) => block.trim());
  return trimmed.filter(Boolean);
}

type DescriptionBlockProps = {
  paragraphs: string[];
  onSave: (paragraphs: string[]) => void;
};

export function DescriptionBlock({
  paragraphs,
  onSave,
}: DescriptionBlockProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const isEmpty = paragraphs.length === 0;
  const showsText = !isEditing && !isEmpty;
  const showsAdd = !isEditing && isEmpty;

  useEffect(() => {
    if (isEditing) {
      textareaRef.current?.focus();
    }
  }, [isEditing]);

  function startEditing() {
    setDraft(paragraphs.join('\n\n'));
    setIsEditing(true);
  }

  function cancel() {
    setIsEditing(false);
  }

  function save() {
    onSave(paragraphsOf(draft));
    setIsEditing(false);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      cancel();
      return;
    }
    const isCommand = event.metaKey || event.ctrlKey;
    if (event.key === 'Enter' && isCommand) {
      event.preventDefault();
      save();
    }
  }

  return (
    <section aria-label='Description'>
      <div className='flex h-7 items-center justify-between gap-2'>
        <h3 className='text-[13px] font-medium'>Description</h3>
        {showsText && (
          <Button
            variant='ghost'
            size='sm'
            onClick={startEditing}
            className='text-muted-foreground'
          >
            <PencilIcon />
            Edit
          </Button>
        )}
      </div>
      <AnimatedSize className='mt-2'>
        {showsText && (
          <div
            onDoubleClick={startEditing}
            className='flex flex-col gap-3 text-sm leading-relaxed text-pretty'
          >
            {paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        )}
        {showsAdd && (
          <button
            type='button'
            onClick={startEditing}
            className='text-muted-foreground hover:text-foreground focus-visible:ring-ring/25 inline-flex h-7 cursor-pointer items-center gap-1 rounded-md text-[13px] outline-none focus-visible:ring-[3px]'
          >
            <PlusIcon className='size-3.5' />
            Add a description
          </button>
        )}
        {isEditing && (
          <div className='flex flex-col gap-2'>
            <Textarea
              ref={textareaRef}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleKeyDown}
              aria-label='Description'
              placeholder='What needs to happen, and why'
              className='min-h-28 text-base leading-relaxed md:text-sm'
            />
            <div className='flex items-center justify-end gap-2'>
              <Button variant='ghost' size='sm' onClick={cancel}>
                Cancel
              </Button>
              <Button size='sm' onClick={save}>
                Save
              </Button>
            </div>
          </div>
        )}
      </AnimatedSize>
    </section>
  );
}
