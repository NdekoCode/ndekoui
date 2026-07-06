'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useId } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { pressedSolidOf } from '@/registry/ndeko/lib/demonstration';
import { CircleXIcon, ReceiptIcon } from '@/registry/ndeko/lib/icons';
import {
  EASE_OUT_STRONG,
  fadePresence,
} from '@/registry/ndeko/lib/motion-presets';
import { cn } from '@/registry/ndeko/lib/utils';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Badge } from '@/registry/ndeko/ui/badge';
import { BrandTile } from '@/registry/ndeko/ui/brand-tile';
import { Button } from '@/registry/ndeko/ui/button';
import { Swap } from '@/registry/ndeko/ui/chat-motion';
import { Kbd } from '@/registry/ndeko/ui/kbd';
import { Spinner } from '@/registry/ndeko/ui/spinner';

import { REFUND } from './data';
import type { Decision, RefundStatus } from './session';

const CHECK_PATH = 'M2.6 6.4 4.9 8.7 9.5 3.6';

const DRAW = { duration: 0.28, ease: EASE_OUT_STRONG, delay: 0.08 };

function strokeStartOf(shouldReduceMotion: boolean) {
  if (shouldReduceMotion) {
    return { pathLength: 1 };
  }
  return { pathLength: 0 };
}

function DrawnCheck() {
  const shouldReduceMotion = usePrefersReducedMotion();

  return (
    <span className='chip-3d inline-flex size-[18px] shrink-0 items-center justify-center rounded-full [--chip:var(--success)]'>
      <svg aria-hidden='true' viewBox='0 0 12 12' className='size-3'>
        <motion.path
          d={CHECK_PATH}
          fill='none'
          stroke='currentColor'
          strokeWidth='1.9'
          strokeLinecap='round'
          strokeLinejoin='round'
          initial={strokeStartOf(shouldReduceMotion)}
          animate={{ pathLength: 1 }}
          transition={DRAW}
        />
      </svg>
    </span>
  );
}

type RequestBodyProps = {
  pressed: string | null;
  /** On a phone the request sits above the reply box, where it keeps to the amount, the reason and the answer. */
  isCompact?: boolean;
  onDecide: (decision: Decision) => void;
};

function RequestBody({
  pressed,
  isCompact = false,
  onDecide,
}: RequestBodyProps) {
  const titleId = useId();
  const keysId = useId();

  function allow() {
    onDecide('approved');
  }

  function deny() {
    onDecide('denied');
  }

  function decideFromKeys(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      deny();
      return;
    }
    const isOnCard = event.target === event.currentTarget;
    const isEnter = event.key === 'Enter';
    if (isEnter && isOnCard) {
      event.preventDefault();
      allow();
    }
  }

  return (
    <div
      role='group'
      tabIndex={0}
      aria-labelledby={titleId}
      aria-describedby={keysId}
      onKeyDown={decideFromKeys}
      className='focus-visible:ring-ring/25 flex flex-col gap-3 rounded-xl p-3 outline-none focus-visible:ring-[3px] focus-visible:ring-inset'
    >
      {isCompact && (
        <h3 id={titleId} className='sr-only'>
          Issue this refund
        </h3>
      )}
      {!isCompact && (
        <div className='flex items-center gap-2.5'>
          <span
            aria-hidden='true'
            className='keycap-3d text-muted-foreground inline-flex size-7 shrink-0 items-center justify-center rounded-md'
          >
            <ReceiptIcon className='size-3.5' />
          </span>
          <h3 id={titleId} className='min-w-0 flex-1 text-[13px] font-medium'>
            Issue this refund
          </h3>
          <Badge variant='warning'>Waiting on you</Badge>
        </div>
      )}
      <div className='flex flex-wrap items-baseline gap-x-2 gap-y-1'>
        <span className='text-2xl leading-8 font-semibold tabular-nums'>
          {REFUND.amount}
        </span>
        <span className='text-muted-foreground flex items-center gap-1.5 text-xs'>
          to
          <BrandTile brand={REFUND.cardBrand} />
          {REFUND.card}
        </span>
      </div>
      {isCompact && (
        <p className='text-muted-foreground truncate text-xs'>
          {REFUND.reason}
        </p>
      )}
      {!isCompact && (
        <dl className='bg-foreground/[0.04] flex flex-col gap-1.5 rounded-lg p-2.5 text-xs'>
          <div className='flex gap-2'>
            <dt className='text-muted-foreground w-14 shrink-0'>Reason</dt>
            <dd className='min-w-0'>{REFUND.reason}</dd>
          </div>
          <div className='flex gap-2'>
            <dt className='text-muted-foreground w-14 shrink-0'>Order</dt>
            <dd className='min-w-0 font-mono'>{REFUND.order}</dd>
          </div>
        </dl>
      )}
      <div className='flex flex-wrap items-center gap-2'>
        <Button
          type='button'
          size='sm'
          onClick={allow}
          className={pressedSolidOf(pressed === 'allow')}
        >
          Allow
          <Kbd className='ms-0.5'>Enter</Kbd>
        </Button>
        <Button type='button' size='sm' variant='outline' onClick={deny}>
          Deny
          <Kbd className='ms-0.5'>Esc</Kbd>
        </Button>
        <Badge variant='secondary' className='ms-auto'>
          Illustrative
        </Badge>
        <span id={keysId} className='sr-only'>
          Enter allows, Escape denies
        </span>
      </div>
    </div>
  );
}

function ResultGlyph({ status }: { status: RefundStatus }) {
  if (status === 'issuing') {
    return <Spinner aria-hidden='true' />;
  }
  if (status === 'denied') {
    return <CircleXIcon className='text-muted-foreground size-4 shrink-0' />;
  }
  return <DrawnCheck />;
}

function resultLineOf(status: RefundStatus) {
  if (status === 'issuing') {
    return `Issuing ${REFUND.amount}`;
  }
  if (status === 'denied') {
    return 'No refund issued. The reply only says one was asked for';
  }
  return `Refunded ${REFUND.amount} to ${REFUND.card}`;
}

function ResultLine({ status }: { status: RefundStatus }) {
  return (
    <div className='flex min-h-11 items-start gap-2.5 p-3 text-[13px] leading-5'>
      <Swap swapKey={status} className='mt-px'>
        <ResultGlyph status={status} />
      </Swap>
      <p
        key={status}
        className='min-w-0 transition-opacity duration-300 starting:opacity-0'
      >
        {resultLineOf(status)}
      </p>
    </div>
  );
}

function viewKeyOf(isAsking: boolean) {
  if (isAsking) {
    return 'request';
  }
  return 'result';
}

type RefundRequestProps = RequestBodyProps & {
  status: RefundStatus;
  className?: string;
};

/** The request resizes into one line that keeps a trace of what the person decided. */
export function RefundRequest({
  status,
  pressed,
  isCompact,
  onDecide,
  className,
}: RefundRequestProps) {
  const fade = fadePresence();
  const isAsking = status === 'asking';

  return (
    <section
      aria-label='Refund request'
      className={cn(
        'bg-card hairline-ring ring-border dark:bg-foreground/[0.04] overflow-hidden rounded-xl shadow-[0_1px_2px_rgb(0_0_0/0.04)] transition-opacity duration-300 starting:opacity-0',
        className
      )}
    >
      <AnimatedSize>
        <AnimatePresence initial={false} mode='popLayout'>
          <motion.div key={viewKeyOf(isAsking)} {...fade}>
            {isAsking && (
              <RequestBody
                pressed={pressed}
                isCompact={isCompact}
                onDecide={onDecide}
              />
            )}
            {!isAsking && <ResultLine status={status} />}
          </motion.div>
        </AnimatePresence>
      </AnimatedSize>
    </section>
  );
}
