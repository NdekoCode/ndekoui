'use client';

import { seriesColorOf } from '@/registry/ndeko/lib/agent-run';
import { pressedQuietOf } from '@/registry/ndeko/lib/demonstration';
import { cn } from '@/registry/ndeko/lib/utils';
import { MeshTile } from '@/registry/ndeko/ui/mesh-tile';
import { ToggleGroup, ToggleGroupItem } from '@/registry/ndeko/ui/toggle-group';

import { AGENTS, type AgentId, HERO } from './data';

const LIT_CARD =
  'bg-card hairline-ring ring-border shadow-[0_1px_2px_rgb(0_0_0/0.04)] dark:bg-foreground/[0.06]';

const AGENT_ITEM = 'bg-foreground/[0.04] h-9 rounded-full ps-1 pe-3';

function isAgentId(value: unknown): value is AgentId {
  return AGENTS.some((agent) => agent.id === value);
}

type AgentRowProps = {
  lit: AgentId;
  pressed: AgentId | null;
  onPick: (agent: AgentId) => void;
};

export function AgentRow({ lit, pressed, onPick }: AgentRowProps) {
  const litValues = [lit];

  /** Pressing the lit agent again keeps it: the headline always has a word. */
  function change(values: unknown[]) {
    const [next] = values;
    if (isAgentId(next)) {
      onPick(next);
    }
  }

  return (
    <ToggleGroup
      aria-label={HERO.agentsLabel}
      value={litValues}
      onValueChange={change}
      travel
      indicatorClassName={LIT_CARD}
      className='flex w-full flex-wrap justify-center gap-1.5'
    >
      {AGENTS.map((agent) => (
        <ToggleGroupItem
          key={agent.id}
          value={agent.id}
          className={cn(AGENT_ITEM, pressedQuietOf(pressed === agent.id))}
        >
          <MeshTile
            seed={agent.role}
            color={seriesColorOf(agent.series)}
            size='lg'
          />
          {agent.role}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
