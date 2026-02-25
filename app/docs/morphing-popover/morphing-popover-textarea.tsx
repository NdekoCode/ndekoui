'use client';
import {
  MorphingPopover,
  MorphingPopoverTrigger,
  MorphingPopoverContent,
} from '@/components/core/morphing-popover';
import { motion } from 'motion/react';
import { useId, useState } from 'react';
import { ArrowLeftIcon } from '@/registry/ndeko/lib/icons';
import { Button, buttonVariants } from '@/registry/ndeko/ui/button';

function placeholderOpacityOf(note: string) {
  if (note) {
    return 0;
  }
  return 1;
}

export function MorphingPopoverTextarea() {
  const uniqueId = useId();
  const [note, setNote] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const placeholderOpacity = placeholderOpacityOf(note);

  const closeMenu = () => {
    setNote('');
    setIsOpen(false);
  };

  return (
    <MorphingPopover
      transition={{
        type: 'spring',
        bounce: 0.05,
        duration: 0.3,
      }}
      open={isOpen}
      onOpenChange={setIsOpen}
    >
      <MorphingPopoverTrigger
        className={buttonVariants({ variant: 'outline' })}
      >
        <motion.span layoutId={`popover-label-${uniqueId}`}>
          Add note
        </motion.span>
      </MorphingPopoverTrigger>
      <MorphingPopoverContent className='rounded-xl p-0'>
        <div className='h-[200px] w-[364px]'>
          <form
            className='flex h-full flex-col'
            onSubmit={(e) => {
              e.preventDefault();
            }}
          >
            <motion.span
              layoutId={`popover-label-${uniqueId}`}
              aria-hidden='true'
              style={{
                opacity: placeholderOpacity,
              }}
              className='text-muted-foreground absolute top-3 left-4 text-[13px] select-none'
            >
              Add note
            </motion.span>
            <textarea
              aria-label='Note'
              className='text-foreground h-full w-full resize-none rounded-md bg-transparent px-4 py-3 text-base outline-hidden md:text-[13px]'
              autoFocus
              onChange={(e) => setNote(e.target.value)}
            />
            <div key='close' className='flex justify-between py-3 pr-4 pl-2'>
              <Button
                type='button'
                variant='ghost'
                size='icon-sm'
                onClick={closeMenu}
                aria-label='Close popover'
              >
                <ArrowLeftIcon />
              </Button>
              <Button
                type='submit'
                variant='outline'
                size='sm'
                aria-label='Save note'
                onClick={() => {
                  closeMenu();
                }}
              >
                Save note
              </Button>
            </div>
          </form>
        </div>
      </MorphingPopoverContent>
    </MorphingPopover>
  );
}
