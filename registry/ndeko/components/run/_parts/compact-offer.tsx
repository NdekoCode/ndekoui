'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

import { formatTokens } from '@/registry/ndeko/lib/agent-run';
import { CheckIcon } from '@/registry/ndeko/lib/icons';

import {
  compactionLineOf,
  freeTokensOf,
  levelOf,
  type Compaction,
  type ContextBudget,
  type ContextLevel,
} from './context';
import { MorphButton, type MorphState } from '@/registry/ndeko/ui/morph-button';
import { risePresenceOf } from '@/registry/ndeko/lib/motion-presets';
import type { CompactStatus } from './use-context-demo';

const COMPACT_LABELS: Record<MorphState, string> = {
  idle: 'Compact',
  busy: 'Compacting',
  done: 'Compacted',
};

function morphStateOf(status: CompactStatus): MorphState {
  if (status === 'compacting') {
    return 'busy';
  }
  return 'idle';
}

function isOfferShown(
  level: ContextLevel,
  canCompact: boolean,
  status: CompactStatus
) {
  const isCompactSoon = level === 'compact';
  const isCompacting = status === 'compacting';
  const isAvailable = canCompact || isCompacting;
  return isCompactSoon && isAvailable;
}

function traceOf(compaction: Compaction | null, isOffered: boolean) {
  if (isOffered) {
    return null;
  }
  return compaction;
}

type CompactOfferProps = {
  budget: ContextBudget;
  canCompact: boolean;
  compactStatus: CompactStatus;
  compaction: Compaction | null;
  onCompact?: () => void;
};

export function CompactOffer({
  budget,
  canCompact,
  compactStatus,
  compaction,
  onCompact,
}: CompactOfferProps) {
  const shouldReduceMotion = useReducedMotion();
  const risePresence = risePresenceOf(shouldReduceMotion);
  const level = levelOf(budget);
  const free = freeTokensOf(budget);
  const freeText = formatTokens(free);
  const isOffered = isOfferShown(level, canCompact, compactStatus);
  const trace = traceOf(compaction, isOffered);

  return (
    <AnimatePresence initial={false} mode='popLayout'>
      {isOffered && (
        <motion.div key='offer' {...risePresence}>
          <div className='bg-warning/10 flex flex-col gap-2.5 rounded-lg p-3 sm:flex-row sm:items-center'>
            <p className='text-warning-foreground min-w-0 flex-1 text-xs leading-5'>
              {freeText} tokens left before the reserve. Fold the older turns
              into a summary to keep going.
            </p>
            <MorphButton
              type='button'
              size='sm'
              state={morphStateOf(compactStatus)}
              labels={COMPACT_LABELS}
              onClick={onCompact}
            />
          </div>
        </motion.div>
      )}
      {trace && (
        <motion.p
          key='trace'
          className='text-muted-foreground flex items-center gap-2 text-xs'
          {...risePresence}
        >
          <CheckIcon className='text-success-foreground size-3.5' />
          {compactionLineOf(trace)}
        </motion.p>
      )}
    </AnimatePresence>
  );
}

export function contextAnnouncementOf(
  level: ContextLevel,
  levelWord: string,
  compaction: Compaction | null
) {
  if (compaction) {
    const line = compactionLineOf(compaction);
    return `${line}. Context: ${levelWord}`;
  }
  if (level === 'compact') {
    return `Context: ${levelWord}. Compact is available`;
  }
  return `Context: ${levelWord}`;
}
