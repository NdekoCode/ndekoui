'use client';
import {
  Dialog,
  DialogDescription,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/core/dialog';
import { Button, buttonVariants } from '@/registry/ndeko/ui/button';
import { Input } from '@/registry/ndeko/ui/input';

export function DialogCustomBackdrop() {
  return (
    <Dialog>
      <DialogTrigger className={buttonVariants()}>
        Join the waitlist
      </DialogTrigger>
      <DialogContent className='bg-card backdrop:bg-background/80 w-full max-w-md p-6 shadow-xl shadow-black/8 backdrop:backdrop-blur-xs'>
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
          <label htmlFor='dialog-custom-backdrop-email' className='sr-only'>
            Work email
          </label>
          <Input
            id='dialog-custom-backdrop-email'
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
  );
}
