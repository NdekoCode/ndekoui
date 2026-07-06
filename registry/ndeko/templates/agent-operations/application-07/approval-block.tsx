'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useId } from 'react';

import {
  pendingApprovalsOf,
  type ApprovalRequest,
  type RunSnapshot,
} from '@/registry/ndeko/lib/agent-run';
import { pressedSolidOf } from '@/registry/ndeko/lib/demonstration';
import { CircleXIcon } from '@/registry/ndeko/lib/icons';
import { fadePresence } from '@/registry/ndeko/lib/motion-presets';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Badge, type BadgeProps } from '@/registry/ndeko/ui/badge';
import { Button } from '@/registry/ndeko/ui/button';
import { Swap } from '@/registry/ndeko/ui/chat-motion';
import { DrawnCheck } from '@/registry/ndeko/ui/drawn-check';
import { Kbd } from '@/registry/ndeko/ui/kbd';
import { Spinner } from '@/registry/ndeko/ui/spinner';

import { DECLINED_LINE, POSTED_LINE } from './data';
import type { Decision } from './session';

export type ApprovalView = 'none' | 'asking' | 'posting' | 'posted' | 'denied';

export function approvalViewOf(run: RunSnapshot): ApprovalView {
  const approval = run.approvals[0];
  if (!approval) {
    return 'none';
  }
  if (approval.status === 'pending') {
    return 'asking';
  }
  if (approval.status === 'denied') {
    return 'denied';
  }
  const call = run.calls.find((candidate) => candidate.id === 'c7');
  if (call?.status === 'done') {
    return 'posted';
  }
  return 'posting';
}

const RISK_WORD: Record<ApprovalRequest['risk'], string> = {
  low: 'Low risk',
  medium: 'Medium risk',
  high: 'High risk',
};

const RISK_VARIANT: Record<ApprovalRequest['risk'], BadgeProps['variant']> = {
  low: 'success',
  medium: 'warning',
  high: 'destructive',
};

type RequestBodyProps = {
  approval: ApprovalRequest;
  pressed: string | null;
  onDecide: (decision: Decision) => void;
};

function RequestBody({ approval, pressed, onDecide }: RequestBodyProps) {
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
      data-approval
      aria-labelledby={titleId}
      aria-describedby={keysId}
      onKeyDown={decideFromKeys}
      className='focus-visible:ring-ring/25 flex flex-col gap-3 rounded-xl p-3 outline-none focus-visible:ring-[3px] focus-visible:ring-inset'
    >
      <div className='flex items-start gap-2'>
        <h3 id={titleId} className='min-w-0 flex-1 text-[13px] font-medium'>
          {approval.title}
        </h3>
        <Badge variant={RISK_VARIANT[approval.risk]}>
          {RISK_WORD[approval.risk]}
        </Badge>
      </div>
      <p className='text-muted-foreground text-xs leading-5'>
        {approval.detail}
      </p>
      <pre className='bg-foreground/[0.04] overflow-x-auto rounded-lg p-2.5 font-mono text-xs leading-relaxed whitespace-pre-wrap'>
        {approval.command}
      </pre>
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

function ResultGlyph({ view }: { view: ApprovalView }) {
  if (view === 'posting') {
    return <Spinner aria-hidden='true' />;
  }
  if (view === 'denied') {
    return <CircleXIcon className='text-muted-foreground size-4 shrink-0' />;
  }
  return <DrawnCheck tone='success' entrance='draw' />;
}

function resultLineOf(view: ApprovalView) {
  if (view === 'posting') {
    return 'Posting the entries';
  }
  if (view === 'denied') {
    return DECLINED_LINE;
  }
  return POSTED_LINE;
}

function ResultLine({ view }: { view: ApprovalView }) {
  return (
    <div className='flex min-h-11 items-start gap-2.5 p-3 text-[13px] leading-5'>
      <Swap swapKey={view} className='mt-px'>
        <ResultGlyph view={view} />
      </Swap>
      <p
        key={view}
        className='min-w-0 transition-opacity duration-300 starting:opacity-0'
      >
        {resultLineOf(view)}
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

type ApprovalBlockProps = {
  run: RunSnapshot;
  pressed: string | null;
  onDecide: (decision: Decision) => void;
};

export function ApprovalBlock({ run, pressed, onDecide }: ApprovalBlockProps) {
  const fade = fadePresence();
  const view = approvalViewOf(run);
  const pending = pendingApprovalsOf(run)[0];
  const approval = pending ?? run.approvals[0];
  if (!approval || view === 'none') {
    return null;
  }
  const isAsking = view === 'asking';

  return (
    <section
      data-request
      tabIndex={-1}
      aria-label='Request waiting for an answer'
      className='bg-card hairline-ring ring-border dark:bg-foreground/[0.04] overflow-hidden rounded-xl shadow-[0_1px_2px_rgb(0_0_0/0.04)] transition-opacity duration-300 outline-none starting:opacity-0'
    >
      <AnimatedSize>
        <AnimatePresence initial={false} mode='popLayout'>
          <motion.div key={viewKeyOf(isAsking)} {...fade}>
            {isAsking && (
              <RequestBody
                approval={approval}
                pressed={pressed}
                onDecide={onDecide}
              />
            )}
            {!isAsking && <ResultLine view={view} />}
          </motion.div>
        </AnimatePresence>
      </AnimatedSize>
    </section>
  );
}
