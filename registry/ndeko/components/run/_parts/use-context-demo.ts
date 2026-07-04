'use client';

import { useState } from 'react';

import type { RunScriptStep } from '@/registry/ndeko/hooks/use-agent-run';
import { emptyRun } from '@/registry/ndeko/lib/agent-run';

import {
  BASE_TOKENS,
  budgetOf,
  compactionOf,
  CONTEXT_LIMIT,
  sumTokens,
  TURNS,
  turnsWithin,
  type Compaction,
  type ContextItem,
} from './context';
import { RUN_TITLE } from './scenario';
import { useDemoRun } from '@/registry/ndeko/hooks/use-demo-run';
import { useTimeouts } from '@/registry/ndeko/hooks/use-timeouts';

export type CompactStatus = 'idle' | 'compacting';

const COMPACT_MS = 900;

const TURN_EVERY_MS = 1100;

const OPENING_TURNS = 2;

const OPENING_TOKENS = sumTokens(TURNS.slice(0, OPENING_TURNS));

/** The run reports its whole context; the views break it into parts. */
const CONTEXT_RUN = emptyRun({
  id: 'brightmoor-context',
  title: RUN_TITLE,
  status: 'running',
  usage: {
    inputTokens: 0,
    outputTokens: 0,
    costUsd: 0,
    contextTokens: BASE_TOKENS + OPENING_TOKENS,
    contextLimit: CONTEXT_LIMIT,
  },
});

function stepOfTurn(turn: ContextItem): RunScriptStep {
  return {
    after: TURN_EVERY_MS,
    event: {
      type: 'usage.added',
      contextTokens: turn.tokens,
      inputTokens: turn.tokens,
    },
  };
}

const CONTEXT_SCRIPT: RunScriptStep[] =
  TURNS.slice(OPENING_TURNS).map(stepOfTurn);

export function useContextRun() {
  const { ref, snapshot, restart, isFinished } = useDemoRun(CONTEXT_SCRIPT, {
    initial: CONTEXT_RUN,
  });
  const conversationTokens = snapshot.usage.contextTokens - BASE_TOKENS;
  const turns = turnsWithin(conversationTokens);
  return { ref, turns, restart, isFinished };
}

export function useContextControls(turns: ContextItem[]) {
  const [removedFileIds, setRemovedFileIds] = useState<string[]>([]);
  const [compaction, setCompaction] = useState<Compaction | null>(null);
  const [compactStatus, setCompactStatus] = useState<CompactStatus>('idle');
  const { schedule, clearAll } = useTimeouts();
  const budget = budgetOf({ turns, removedFileIds, compaction });
  const budgetBefore = budgetOf({ turns, removedFileIds, compaction: null });
  const nextCompaction = compactionOf(turns);
  const foldedNow = compaction?.foldedTurns ?? 0;
  const foldableNext = nextCompaction?.foldedTurns ?? 0;
  const hasNewTurnsToFold = foldableNext > foldedNow;
  const isIdle = compactStatus === 'idle';
  const canCompact = hasNewTurnsToFold && isIdle;

  function removeFile(fileId: string) {
    setRemovedFileIds((current) => [...current, fileId]);
  }

  function compact() {
    if (!canCompact) {
      return;
    }
    setCompactStatus('compacting');
    schedule(() => {
      setCompaction(nextCompaction);
      setCompactStatus('idle');
    }, COMPACT_MS);
  }

  function reset() {
    clearAll();
    setRemovedFileIds([]);
    setCompaction(null);
    setCompactStatus('idle');
  }

  return {
    budget,
    budgetBefore,
    compaction,
    compactStatus,
    canCompact,
    removeFile,
    compact,
    reset,
  };
}
