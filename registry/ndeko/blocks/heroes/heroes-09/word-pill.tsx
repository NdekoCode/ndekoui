import type { CSSProperties } from 'react';

import { WordRoll } from '@/components/core/word-roll';
import { seriesColorOf } from '@/registry/ndeko/lib/agent-run';
import { cn } from '@/registry/ndeko/lib/utils';

import { AGENTS, type AgentId, type Change } from './data';

type ChipStyle = CSSProperties & { '--chip': string };

function agentOf(id: AgentId) {
  const found = AGENTS.find((agent) => agent.id === id);
  return found ?? AGENTS[0];
}

function chipStyleOf(id: AgentId) {
  const agent = agentOf(id);
  const style: ChipStyle = { '--chip': seriesColorOf(agent.series) };
  return style;
}

/** The first colour is there from the start; only a colour that replaces another sweeps in. */
function wipeClassOf(hasChanged: boolean) {
  if (hasChanged) {
    return 'starting:scale-x-0';
  }
  return undefined;
}

const LAYER = 'chip-3d absolute inset-0 -z-10 rounded-[inherit]';

const WIPE_LAYER =
  'origin-left transition-transform duration-500 ease-(--ease-out-strong) motion-reduce:transition-none';

type WordPillProps = {
  change: Change;
};

/**
 * The word of the headline in a pill. A new word rolls in while the colour of its agent sweeps
 * over the old one from the left: the new layer is mounted again for each change, and it starts
 * with no width.
 */
export function WordPill({ change }: WordPillProps) {
  const agent = agentOf(change.to);
  const hasChanged = change.id > 0;

  return (
    <span className='relative isolate inline-flex overflow-hidden rounded-2xl px-3 py-0.5 @2xl:px-4'>
      <span
        key={`from-${change.id}`}
        aria-hidden='true'
        style={chipStyleOf(change.from)}
        className={LAYER}
      />
      <span
        key={`to-${change.id}`}
        aria-hidden='true'
        style={chipStyleOf(change.to)}
        className={cn(LAYER, WIPE_LAYER, wipeClassOf(hasChanged))}
      />
      <WordRoll text={agent.role} />
    </span>
  );
}
