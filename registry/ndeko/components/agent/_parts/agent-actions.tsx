'use client';

import { AnimatePresence, motion } from 'motion/react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import type { ApprovalRequest, RunAgent } from '@/registry/ndeko/lib/agent-run';
import {
  pressedQuietOf,
  pressedSolidOf,
} from '@/registry/ndeko/lib/demonstration';
import { CheckIcon, RotateCcwIcon } from '@/registry/ndeko/lib/icons';
import { rowPresenceOf } from '@/registry/ndeko/lib/motion-presets';
import { Button } from '@/registry/ndeko/ui/button';
import { Kbd } from '@/registry/ndeko/ui/kbd';

export function pendingApprovalOf(
  approvals: ApprovalRequest[],
  agentId: string
) {
  return approvals.find((approval) => {
    const isForAgent = approval.agentId === agentId;
    const isPending = approval.status === 'pending';
    return isForAgent && isPending;
  });
}

export function approvedApprovalOf(
  approvals: ApprovalRequest[],
  agentId: string
) {
  return approvals.find((approval) => {
    const isForAgent = approval.agentId === agentId;
    const isApproved = approval.status === 'approved';
    return isForAgent && isApproved;
  });
}

function tabIndexOf(hasKeyHints: boolean) {
  if (hasKeyHints) {
    return -1;
  }
  return undefined;
}

const KEY_HINT = 'ms-0.5 hidden group-focus-visible/row:inline-flex';

type AgentActionsProps = {
  agent: RunAgent;
  approvals: ApprovalRequest[];
  onApprove?: (approvalId: string) => void;
  onRetry?: (agentId: string) => void;
  /**
   * Inside a tree the row keeps the focus and A or R decide: the buttons leave the tab order and
   * show their key while the row, marked `group/row`, has visible focus.
   */
  hasKeyHints?: boolean;
  /** Called after Approve or Retry, once the pressed button is about to leave. */
  onDecided?: (agentId: string) => void;
  /** Shows Approve held down, for a demonstration that presses it. */
  isApprovePressed?: boolean;
  /** Shows Retry held down, for a demonstration that presses it. */
  isRetryPressed?: boolean;
};

export function AgentActions({
  agent,
  approvals,
  onApprove,
  onRetry,
  hasKeyHints = false,
  onDecided,
  isApprovePressed = false,
  isRetryPressed = false,
}: AgentActionsProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const rowPresence = rowPresenceOf(shouldReduceMotion);
  const pending = pendingApprovalOf(approvals, agent.id);
  const approved = approvedApprovalOf(approvals, agent.id);
  const isFailed = agent.status === 'failed';
  const canRetry = isFailed && onRetry !== undefined;
  const isNotPending = pending === undefined;
  const showsTrace = approved !== undefined && isNotPending;
  const buttonTabIndex = tabIndexOf(hasKeyHints);

  function approve(event: React.MouseEvent) {
    event.stopPropagation();
    if (pending) {
      onApprove?.(pending.id);
      onDecided?.(agent.id);
    }
  }

  function retry(event: React.MouseEvent) {
    event.stopPropagation();
    onRetry?.(agent.id);
    onDecided?.(agent.id);
  }

  return (
    <AnimatePresence initial={false}>
      {pending && (
        <motion.div key='approve' className='overflow-hidden' {...rowPresence}>
          <div className='flex flex-wrap items-center gap-x-3 gap-y-1.5 pt-1.5'>
            <p className='text-foreground/85 min-w-0 text-xs leading-5'>
              {pending.title}
            </p>
            <Button
              type='button'
              size='sm'
              tabIndex={buttonTabIndex}
              onClick={approve}
              aria-label={`Approve: ${pending.title}`}
              className={pressedSolidOf(isApprovePressed)}
            >
              <CheckIcon />
              Approve
              {hasKeyHints && <Kbd className={KEY_HINT}>A</Kbd>}
            </Button>
          </div>
        </motion.div>
      )}
      {canRetry && (
        <motion.div key='retry' className='overflow-hidden' {...rowPresence}>
          <div className='pt-1.5'>
            <Button
              type='button'
              variant='outline'
              size='sm'
              tabIndex={buttonTabIndex}
              onClick={retry}
              aria-label={`Retry ${agent.name}`}
              className={pressedQuietOf(isRetryPressed)}
            >
              <RotateCcwIcon />
              Retry
              {hasKeyHints && <Kbd className={KEY_HINT}>R</Kbd>}
            </Button>
          </div>
        </motion.div>
      )}
      {showsTrace && (
        <motion.p
          key='approved'
          className='text-muted-foreground overflow-hidden text-xs'
          {...rowPresence}
        >
          <span className='flex items-center gap-1.5 pt-1'>
            <CheckIcon className='text-success-foreground size-3.5 shrink-0' />
            Approved by you
          </span>
        </motion.p>
      )}
    </AnimatePresence>
  );
}
