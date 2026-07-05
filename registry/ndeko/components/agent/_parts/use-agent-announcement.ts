'use client';

import { useState } from 'react';

import type { RunAgent } from '@/registry/ndeko/lib/agent-run';

function changedAgentOf(previous: RunAgent[], next: RunAgent[]) {
  return next.find((agent) => {
    const before = previous.find((candidate) => candidate.id === agent.id);
    if (!before) {
      return true;
    }
    return before.status !== agent.status;
  });
}

export function useAgentAnnouncement(
  agents: RunAgent[],
  describe: (agent: RunAgent) => string
) {
  const [seenAgents, setSeenAgents] = useState(agents);
  const [message, setMessage] = useState('');

  const hasNewAgents = seenAgents !== agents;
  if (hasNewAgents) {
    const changed = changedAgentOf(seenAgents, agents);
    setSeenAgents(agents);
    if (changed) {
      setMessage(describe(changed));
    }
  }

  return message;
}
