'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
} from 'motion/react';
import { useState } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { CircleCheckIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from '@/registry/ndeko/ui/popover';
import { Textarea } from '@/registry/ndeko/ui/textarea';

const SWAP_TRANSITION: Transition = { duration: 0.15, ease: [0.2, 0, 0, 1] };

const NOTICE_VARIANTS: Variants = {
  enter: { opacity: 0, filter: 'blur(2px)' },
  visible: { opacity: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, filter: 'blur(2px)' },
};

const FADE_VARIANTS: Variants = {
  enter: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

function noticeVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return NOTICE_VARIANTS;
}

export default function Popover08() {
  const [message, setMessage] = useState('');
  const [isSent, setIsSent] = useState(false);
  const shouldReduceMotion = usePrefersReducedMotion();
  const noticeVariants = noticeVariantsOf(shouldReduceMotion);
  const trimmedMessage = message.trim();
  const hasMessage = trimmedMessage.length > 0;

  function updateMessage(event: React.ChangeEvent<HTMLTextAreaElement>) {
    setMessage(event.target.value);
    setIsSent(false);
  }

  function sendFeedback(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!hasMessage) {
      return;
    }
    setMessage('');
    setIsSent(true);
  }

  function resetAfterClosing(isOpen: boolean) {
    if (isOpen) {
      return;
    }
    setMessage('');
    setIsSent(false);
  }

  return (
    <Popover onOpenChangeComplete={resetAfterClosing}>
      <PopoverTrigger render={<Button variant='outline' />}>
        Feedback
      </PopoverTrigger>
      <PopoverContent className='flex flex-col gap-3'>
        <PopoverTitle>Send us feedback</PopoverTitle>
        <form onSubmit={sendFeedback} className='flex flex-col gap-3'>
          <Textarea
            value={message}
            onChange={updateMessage}
            placeholder='What would make this page better?'
            aria-label='Feedback'
          />
          <div className='flex items-center justify-between gap-3'>
            <div role='status' className='flex'>
              <AnimatePresence initial={false}>
                {isSent && (
                  <motion.span
                    key='sent'
                    className='text-muted-foreground flex items-center gap-1.5 text-xs'
                    variants={noticeVariants}
                    initial='enter'
                    animate='visible'
                    exit='exit'
                    transition={SWAP_TRANSITION}
                  >
                    <CircleCheckIcon className='text-success-foreground size-3.5' />
                    Sent. Thank you.
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
            <Button
              type='submit'
              size='sm'
              disabled={!hasMessage}
              focusableWhenDisabled
              className='ml-auto'
            >
              Send feedback
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}
