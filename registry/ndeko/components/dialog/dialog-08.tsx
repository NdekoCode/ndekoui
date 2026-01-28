'use client';

import { useId, useState } from 'react';

import { Trash2Icon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/registry/ndeko/ui/dialog';
import { Input } from '@/registry/ndeko/ui/input';
import { Label } from '@/registry/ndeko/ui/label';
import { StatusOrb } from '@/registry/ndeko/ui/status-orb';

const PROJECT_NAME = 'Atlas Redesign';

export default function Dialog08() {
  const id = useId();
  const [typedName, setTypedName] = useState('');
  const isConfirmed = typedName === PROJECT_NAME;

  function clearOnOpen(open: boolean) {
    if (open) {
      setTypedName('');
    }
  }

  function updateTypedName(event: React.ChangeEvent<HTMLInputElement>) {
    setTypedName(event.currentTarget.value);
  }

  return (
    <Dialog onOpenChange={clearOnOpen}>
      <DialogTrigger render={<Button variant='outline' />}>
        Delete project
      </DialogTrigger>
      <DialogContent className='max-w-md'>
        <div className='flex flex-col items-center gap-4'>
          <StatusOrb tone='error' glyph={<Trash2Icon strokeWidth={2.25} />} />
          <DialogHeader className='px-8 text-center'>
            <DialogTitle>Delete {PROJECT_NAME}?</DialogTitle>
            <DialogDescription>
              The project, its 48 tasks and every file attached to them are
              removed for good. To confirm, type{' '}
              <span className='text-foreground font-medium'>
                {PROJECT_NAME}
              </span>
              .
            </DialogDescription>
          </DialogHeader>
        </div>
        <div className='grid gap-2'>
          <Label htmlFor={id}>Project name</Label>
          <Input
            id={id}
            autoComplete='off'
            placeholder={PROJECT_NAME}
            value={typedName}
            onChange={updateTypedName}
          />
        </div>
        <DialogFooter>
          <DialogClose
            render={<Button variant='outline' size='lg' className='flex-1' />}
          >
            Cancel
          </DialogClose>
          <DialogClose
            disabled={!isConfirmed}
            render={
              <Button variant='destructive' size='lg' className='flex-1' />
            }
          >
            Delete project
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
