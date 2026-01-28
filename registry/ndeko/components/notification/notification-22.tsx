'use client';

import { toast } from 'sonner';

import { XIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';
import { StatusOrb } from '@/registry/ndeko/ui/status-orb';

const TEXT_ACTION = 'h-auto px-0 text-[13px] leading-5';

type ToastId = string | number;

function MessageSentToast({ toastId }: { toastId: ToastId }) {
  function close() {
    toast.dismiss(toastId);
  }

  return (
    <div className='flex w-full items-center gap-3 font-normal'>
      <StatusOrb tone='success' size='sm' />
      <div className='flex grow items-center justify-between gap-4'>
        <p className='text-foreground text-[13px] leading-5'>Message sent</p>
        <div className='flex items-center gap-1.5 whitespace-nowrap'>
          <Button variant='link' size='sm' className={TEXT_ACTION}>
            View
          </Button>
          <span aria-hidden='true' className='text-muted-foreground'>
            ·
          </span>
          <Button
            variant='link'
            size='sm'
            className={TEXT_ACTION}
            onClick={close}
          >
            Undo
          </Button>
        </div>
      </div>
      <Button
        variant='ghost'
        size='icon-sm'
        aria-label='Dismiss notification'
        className='text-muted-foreground -my-1 -me-1.5'
        onClick={close}
      >
        <XIcon />
      </Button>
    </div>
  );
}

function renderMessageSent(toastId: ToastId) {
  return <MessageSentToast toastId={toastId} />;
}

function showMessageSent() {
  toast.custom(renderMessageSent);
}

export default function Notification22() {
  return (
    <Button variant='outline' onClick={showMessageSent}>
      Show custom toast
    </Button>
  );
}
