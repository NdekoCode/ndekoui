'use client';

import type { RunAgent } from '@/registry/ndeko/lib/agent-run';
import { LiveDuration } from '@/registry/ndeko/ui/live-duration';

export function isLiveAgent(agent: RunAgent) {
  const isRunning = agent.status === 'running';
  const isWaiting = agent.status === 'waiting';
  return isRunning || isWaiting;
}

/** A duration that ticks keeps its width, so nothing beside it shifts ten times a second. */
export function AgentClock({ agent }: { agent: RunAgent }) {
  const hasStarted = agent.startedAt !== undefined;
  if (!hasStarted) {
    return <span>Not started</span>;
  }
  return (
    <LiveDuration
      item={agent}
      isRunning={isLiveAgent(agent)}
      className='inline-block min-w-8'
    />
  );
}
