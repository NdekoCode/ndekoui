'use client';

import { CheckIcon, LoaderIcon, SendIcon } from '@/registry/ndeko/lib/icons';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Button } from '@/registry/ndeko/ui/button';
import { Swap } from '@/registry/ndeko/ui/chat-motion';

export type SubmitPhase = 'idle' | 'sending' | 'sent';

const PHASE_LABEL: Record<SubmitPhase, string> = {
  idle: 'Send',
  sending: 'Sending',
  sent: 'Sent',
};

function PhaseIcon({ phase }: { phase: SubmitPhase }) {
  if (phase === 'sending') {
    return <LoaderIcon className='animate-spin' />;
  }
  if (phase === 'sent') {
    return <CheckIcon />;
  }
  return <SendIcon />;
}

type SubmitButtonProps = {
  phase: SubmitPhase;
  canSend: boolean;
  onSend: () => void;
};

export function SubmitButton({ phase, canSend, onSend }: SubmitButtonProps) {
  const isIdle = phase === 'idle';
  const isDisabled = isIdle && !canSend;
  const label = PHASE_LABEL[phase];

  function send() {
    if (isIdle) {
      onSend();
    }
  }

  return (
    <Button
      type='button'
      onClick={send}
      disabled={isDisabled}
      aria-live='polite'
      className='px-3'
    >
      <AnimatedSize as='span' axis='width' contentClassName='flex items-center'>
        <Swap swapKey={phase}>
          <span className='flex items-center gap-1.5'>
            <PhaseIcon phase={phase} />
            {label}
          </span>
        </Swap>
      </AnimatedSize>
    </Button>
  );
}
