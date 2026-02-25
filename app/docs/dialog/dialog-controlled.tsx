'use client';
import { useState } from 'react';
import {
  Dialog,
  DialogDescription,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/core/dialog';
import { Button } from '@/registry/ndeko/ui/button';
import { Input } from '@/registry/ndeko/ui/input';

export function DialogControlled() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <Button variant='outline' onClick={() => setIsOpen(true)}>
        Open the waitlist form
      </Button>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className='bg-card w-full max-w-md p-6'>
          <DialogHeader>
            <DialogTitle className='text-foreground'>
              Join the waitlist
            </DialogTitle>
            <DialogDescription className='text-muted-foreground text-[13px]'>
              Tidewell opens to new teams in March. Leave your work email and we
              write once, on launch day.
            </DialogDescription>
          </DialogHeader>
          <div className='mt-6 flex flex-col space-y-4'>
            <label htmlFor='dialog-controlled-email' className='sr-only'>
              Work email
            </label>
            <Input
              id='dialog-controlled-email'
              type='email'
              placeholder='lea@harbor-studio.com'
            />
            <Button type='submit' className='self-end'>
              Join the waitlist
            </Button>
          </div>
          <DialogClose />
        </DialogContent>
      </Dialog>
    </div>
  );
}
