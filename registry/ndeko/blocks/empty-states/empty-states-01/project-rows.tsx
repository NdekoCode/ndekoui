'use client';

import { motion, useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

import { FolderIcon, TrashIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';
import { Input } from '@/registry/ndeko/ui/input';

import { heightPresenceOf } from './motion-parts';

export type Project = {
  id: string;
  name: string;
};

function ProjectTile() {
  return (
    <span className='keycap-3d text-muted-foreground flex size-7 shrink-0 items-center justify-center rounded-md'>
      <FolderIcon className='size-3.5' />
    </span>
  );
}

export function ProjectRow({
  project,
  onDelete,
}: {
  project: Project;
  onDelete: (projectId: string) => void;
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.li
      {...heightPresenceOf(shouldReduceMotion)}
      className='overflow-hidden'
    >
      <div className='flex h-14 items-center gap-3 ps-3 pe-2'>
        <ProjectTile />
        <div className='min-w-0 flex-1'>
          <p className='truncate text-[13px] font-medium'>{project.name}</p>
          <p className='text-muted-foreground text-xs'>No tasks yet</p>
        </div>
        <Button
          variant='ghost'
          size='icon-sm'
          aria-label={`Delete ${project.name}`}
          onClick={() => onDelete(project.id)}
          className='text-muted-foreground'
        >
          <TrashIcon />
        </Button>
      </div>
    </motion.li>
  );
}

export function DraftProjectRow({
  onCreate,
  onCancel,
}: {
  onCreate: (name: string) => void;
  onCancel: () => void;
}) {
  const shouldReduceMotion = useReducedMotion();
  const inputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState('');
  const trimmed = name.trim();
  const canCreate = trimmed.length > 0;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canCreate) {
      return;
    }
    onCreate(trimmed);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      onCancel();
    }
  }

  return (
    <motion.li
      {...heightPresenceOf(shouldReduceMotion)}
      className='overflow-hidden'
    >
      <form
        onSubmit={submit}
        className='flex min-h-14 flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2.5'
      >
        <ProjectTile />
        <Input
          ref={inputRef}
          value={name}
          onChange={(event) => setName(event.target.value)}
          onKeyDown={handleKeyDown}
          aria-label='Project name'
          placeholder='Project name'
          className='min-w-0 flex-1 basis-40'
        />
        <div className='ms-auto flex items-center gap-1'>
          <Button type='button' variant='ghost' size='sm' onClick={onCancel}>
            Cancel
          </Button>
          <Button type='submit' size='sm' disabled={!canCreate}>
            Create
          </Button>
        </div>
      </form>
    </motion.li>
  );
}
