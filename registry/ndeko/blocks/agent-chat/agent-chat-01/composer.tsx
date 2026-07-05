'use client';

import { AnimatePresence, motion } from 'motion/react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import type { ApprovalRequest } from '@/registry/ndeko/lib/agent-run';
import { pressedSolidOf } from '@/registry/ndeko/lib/demonstration';
import { ArrowUpIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Badge } from '@/registry/ndeko/ui/badge';
import { BrandTile } from '@/registry/ndeko/ui/brand-tile';
import { Button } from '@/registry/ndeko/ui/button';

import type { Decision } from './session';

const SHELL =
  'bg-card hairline-ring ring-foreground/12 rounded-2xl shadow-[0_1px_2px_rgb(0_0_0/0.05)] dark:bg-foreground/[0.04] dark:ring-foreground/15';

const MORPH = {
  initial: { opacity: 0, scale: 0.98, filter: 'blur(4px)' },
  animate: { opacity: 1, scale: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, transition: { duration: 0.1 } },
  transition: { duration: 0.22, ease: [0.23, 1, 0.32, 1] as const },
};

const MORPH_FADE = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0, transition: { duration: 0.1 } },
  transition: { duration: 0.15 },
};

function morphOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return MORPH_FADE;
  }
  return MORPH;
}

function isSendKey(event: React.KeyboardEvent<HTMLTextAreaElement>) {
  const isPlainEnter = event.key === 'Enter' && !event.shiftKey;
  return isPlainEnter && !event.nativeEvent.isComposing;
}

export type EmailPreview = {
  to: string;
  subject: string;
  body: string;
};

type ApprovalCardProps = {
  approval: ApprovalRequest;
  email: EmailPreview;
  pressed: string | null;
  onDecide: (decision: Decision) => void;
};

function ApprovalCard({
  approval,
  email,
  pressed,
  onDecide,
}: ApprovalCardProps) {
  return (
    <section
      aria-label='Approval needed'
      className={cn(SHELL, 'flex flex-col gap-3 p-3')}
    >
      <header className='flex items-center gap-2.5'>
        <BrandTile brand='gmail' size='lg' />
        <h3 className='min-w-0 flex-1 truncate text-sm font-medium'>
          {approval.title}
        </h3>
        <Badge variant='warning'>Waiting on you</Badge>
      </header>
      <dl className='bg-foreground/[0.04] flex flex-col gap-1.5 rounded-lg p-3 text-[13px]'>
        <div className='flex gap-2'>
          <dt className='text-muted-foreground w-14 shrink-0'>To</dt>
          <dd className='min-w-0 truncate'>{email.to}</dd>
        </div>
        <div className='flex gap-2'>
          <dt className='text-muted-foreground w-14 shrink-0'>Subject</dt>
          <dd className='min-w-0 truncate'>{email.subject}</dd>
        </div>
        <div className='flex gap-2'>
          <dt className='text-muted-foreground w-14 shrink-0'>Message</dt>
          <dd className='min-w-0'>{email.body}</dd>
        </div>
      </dl>
      <div className='flex items-center justify-end gap-2'>
        <Button
          type='button'
          variant='outline'
          onClick={() => onDecide('denied')}
        >
          Deny
        </Button>
        <Button
          type='button'
          onClick={() => onDecide('approved')}
          className={pressedSolidOf(pressed === 'allow')}
        >
          Allow and send
        </Button>
      </div>
    </section>
  );
}

type FieldProps = {
  draft: string;
  placeholder: string;
  canSend: boolean;
  pressed: string | null;
  onDraftChange: (text: string) => void;
  onSend: () => void;
};

function Field({
  draft,
  placeholder,
  canSend,
  pressed,
  onDraftChange,
  onSend,
}: FieldProps) {
  function handleKeys(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (!isSendKey(event)) {
      return;
    }
    event.preventDefault();
    if (canSend) {
      onSend();
    }
  }

  return (
    <div
      className={cn(
        SHELL,
        'has-[textarea:focus-visible]:ring-ring/25 flex items-end gap-2 p-2 transition-[box-shadow] duration-150 has-[textarea:focus-visible]:ring-[3px]'
      )}
    >
      <textarea
        value={draft}
        rows={2}
        aria-label='Message to the assistant'
        placeholder={placeholder}
        onChange={(event) => onDraftChange(event.target.value)}
        onKeyDown={handleKeys}
        className='placeholder:text-muted-foreground/75 min-h-12 flex-1 resize-none bg-transparent px-1.5 py-1 text-base leading-normal outline-none md:text-[13px]'
      />
      <Button
        type='button'
        size='icon'
        aria-label='Send the message'
        disabled={!canSend}
        onClick={onSend}
        className={pressedSolidOf(pressed === 'send')}
      >
        <ArrowUpIcon />
      </Button>
    </div>
  );
}

type ComposerProps = FieldProps & {
  /** While it is set, the field gives its place to the request. */
  approval: ApprovalRequest | null;
  email: EmailPreview;
  onDecide: (decision: Decision) => void;
};

/** The request for a yes takes the place of the field, where the person was typing, and gives it back. */
export function Composer({
  approval,
  email,
  onDecide,
  ...field
}: ComposerProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const morph = morphOf(shouldReduceMotion);

  return (
    <AnimatedSize>
      <AnimatePresence mode='popLayout' initial={false}>
        {approval && (
          <motion.div key='approval' {...morph}>
            <ApprovalCard
              approval={approval}
              email={email}
              pressed={field.pressed}
              onDecide={onDecide}
            />
          </motion.div>
        )}
        {!approval && (
          <motion.div key='field' {...morph}>
            <Field {...field} />
          </motion.div>
        )}
      </AnimatePresence>
    </AnimatedSize>
  );
}
