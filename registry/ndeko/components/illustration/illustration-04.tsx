'use client';

import { useMemo } from 'react';

import { seriesColorOf, type SeriesSlot } from '@/registry/ndeko/lib/agent-run';
import type { BrandSlug } from '@/registry/ndeko/lib/brand-logos';
import { prefixesOf } from '@/registry/ndeko/lib/demonstration';
import { cn } from '@/registry/ndeko/lib/utils';
import { BrandTile } from '@/registry/ndeko/ui/brand-tile';
import { MeshTile } from '@/registry/ndeko/ui/mesh-tile';

import { delayWhile } from './_parts/delay';
import {
  CHATGPT,
  CLAUDE,
  DEEPSEEK,
  GEMINI,
  MISTRAL,
  type SceneModel,
} from './_parts/models';
import { PromptField } from './_parts/prompt-field';
import { keyHoldOf } from './_parts/typing';
import { useSceneFrames, type SceneFrame } from './_parts/use-scene-frames';
import { useScenePlay } from './_parts/use-scene-play';

export type TeamTool = {
  name: string;
  brand: BrandSlug;
};

export type TeamAgent = {
  role: string;
  series: SeriesSlot;
  model: SceneModel;
  tools: TeamTool[];
};

export type TeamPlay = {
  prompt: string;
  agents: TeamAgent[];
};

/** How much of the team shows: nothing, the connectors, the cards with their roles, then their models and tools. */
type Reveal = 0 | 1 | 2 | 3;

type Beat = {
  playIndex: number;
  typed: string;
  isSending: boolean;
  reveal: Reveal;
};

const REST_MS = 2800;

const LEAVE_MS = 260;

const CLEAR_MS = 620;

const CHARACTER_MS = 44;

const BEFORE_SEND_MS = 340;

const SEND_MS = 220;

const BRANCH_MS = 520;

const CARDS_MS = 640;

const CARD_STAGGER_MS = 90;

const TOOLS_AFTER_MODEL_MS = 140;

const CARD_GAP_REM = 0.5;

const TYPING_SEED = 3;

function beatsOfPlay(playIndex: number, prompt: string) {
  const prefixes = prefixesOf(prompt);
  const beats: SceneFrame<Beat>[] = [];
  const empty: Beat = { playIndex, typed: '', isSending: false, reveal: 0 };
  const whole: Beat = { ...empty, typed: prompt };
  beats.push({ state: empty, holdMs: CLEAR_MS });
  prefixes.forEach((typed, index) => {
    const holdMs = keyHoldOf(index, CHARACTER_MS, TYPING_SEED);
    beats.push({ state: { ...empty, typed }, holdMs });
  });
  beats.push({ state: whole, holdMs: BEFORE_SEND_MS });
  beats.push({ state: { ...whole, isSending: true }, holdMs: SEND_MS });
  beats.push({ state: { ...whole, reveal: 1 }, holdMs: BRANCH_MS });
  beats.push({ state: { ...whole, reveal: 2 }, holdMs: CARDS_MS });
  beats.push({ state: restOf(playIndex, prompt), holdMs: REST_MS });
  return beats;
}

function restOf(playIndex: number, prompt: string): Beat {
  return { playIndex, typed: prompt, isSending: false, reveal: 3 };
}

/**
 * The book opens on the first team at rest. Every play is then typed, sent and branched in turn, and
 * the round ends on the beats that bring the first play back, so the loop closes on its first frame.
 * Before a play, the team on stage leaves: the cards fade out while they still hold their own content.
 */
function beatsOf(plays: TeamPlay[]) {
  const first = plays[0];
  if (!first) {
    const blank: Beat = {
      playIndex: 0,
      typed: '',
      isSending: false,
      reveal: 0,
    };
    return [{ state: blank, holdMs: REST_MS }];
  }
  let leaving = restOf(0, first.prompt);
  const beats: SceneFrame<Beat>[] = [{ state: leaving, holdMs: REST_MS }];
  for (let offset = 1; offset <= plays.length; offset += 1) {
    const playIndex = offset % plays.length;
    const play = plays[playIndex];
    beats.push({ state: { ...leaving, reveal: 0 }, holdMs: LEAVE_MS });
    beats.push(...beatsOfPlay(playIndex, play.prompt));
    leaving = restOf(playIndex, play.prompt);
  }
  beats.pop();
  return beats;
}

/** A card is a seat, not an agent: it stays mounted when the team changes, so it can fade out and in. */
function seatKeyOf(index: number) {
  return `seat-${index}`;
}

function isRevealed(reveal: Reveal, level: Reveal) {
  return reveal >= level;
}

function columnsOf(count: number) {
  return { gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` };
}

function labelOf(play: TeamPlay) {
  const roles = play.agents.map((agent) => agent.role);
  const team = roles.join(', ');
  return `The request "${play.prompt}" becomes a team: ${team}`;
}

const LINE = 'bg-foreground/15 absolute';

const DETAIL =
  'flex min-w-0 items-center opacity-0 transition-opacity duration-150 data-[shown=true]:opacity-100 data-[shown=true]:duration-300';

type ConnectorsProps = {
  count: number;
  isDrawn: boolean;
};

function Connectors({ count, isDrawn }: ConnectorsProps) {
  const gaps = (count - 1) * CARD_GAP_REM;
  const halves = count * 2;
  const halfColumn = `calc((100% - ${gaps}rem) / ${halves})`;
  const drops = Array.from({ length: count }, (_, index) => index);

  return (
    <div className='relative h-7'>
      <span
        data-drawn={isDrawn}
        className={cn(
          LINE,
          'top-0 left-1/2 h-3 w-px origin-top scale-y-0 transition-transform duration-200 ease-(--ease-out-strong) data-[drawn=true]:scale-y-100'
        )}
      />
      <span
        data-drawn={isDrawn}
        style={{ left: halfColumn, right: halfColumn }}
        className={cn(
          LINE,
          'top-3 h-px scale-x-0 transition-transform duration-300 ease-(--ease-out-strong) data-[drawn=true]:scale-x-100 data-[drawn=true]:delay-150'
        )}
      />
      <div
        style={columnsOf(count)}
        className='absolute inset-x-0 top-3 grid h-4 gap-2'
      >
        {drops.map((drop) => (
          <span key={drop} className='relative'>
            <span
              data-drawn={isDrawn}
              className={cn(
                LINE,
                'inset-y-0 left-1/2 w-px origin-top scale-y-0 transition-transform duration-200 ease-(--ease-out-strong) data-[drawn=true]:scale-y-100 data-[drawn=true]:delay-300'
              )}
            />
          </span>
        ))}
      </div>
    </div>
  );
}

type AgentCardProps = {
  agent: TeamAgent;
  order: number;
  reveal: Reveal;
};

function AgentCard({ agent, order, reveal }: AgentCardProps) {
  const isShown = isRevealed(reveal, 2);
  const hasDetails = isRevealed(reveal, 3);
  const cardDelayMs = order * CARD_STAGGER_MS;
  const toolsDelayMs = cardDelayMs + TOOLS_AFTER_MODEL_MS;

  return (
    <div
      data-shown={isShown}
      style={delayWhile(isShown, cardDelayMs)}
      className='bg-card hairline-ring ring-border flex min-w-0 -translate-y-1.5 flex-col gap-1.5 rounded-lg p-2 opacity-0 shadow-[0_1px_2px_rgb(0_0_0/0.04)] transition-[opacity,translate] duration-150 ease-(--ease-out-strong) data-[shown=true]:translate-y-0 data-[shown=true]:opacity-100 data-[shown=true]:duration-300 @sm:p-2.5'
    >
      <MeshTile
        seed={agent.role}
        color={seriesColorOf(agent.series)}
        className='block'
      />
      <p className='truncate text-xs leading-4 font-medium'>{agent.role}</p>
      <p
        data-shown={hasDetails}
        style={delayWhile(hasDetails, cardDelayMs)}
        className={cn(DETAIL, 'gap-1.5')}
      >
        <BrandTile brand={agent.model.brand} size='sm' />
        <span className='text-muted-foreground truncate text-[11px] leading-4'>
          {agent.model.name}
        </span>
      </p>
      <p
        data-shown={hasDetails}
        style={delayWhile(hasDetails, toolsDelayMs)}
        className={cn(DETAIL, 'gap-1')}
      >
        {agent.tools.map((tool) => (
          <BrandTile key={tool.name} brand={tool.brand} />
        ))}
      </p>
    </div>
  );
}

export type PromptToTeamProps = {
  /** The requests the scene types in turn, each with the team it becomes. */
  plays: TeamPlay[];
  className?: string;
};

export function PromptToTeam({ plays, className }: PromptToTeamProps) {
  const { ref, isPlaying, isStill } = useScenePlay();
  const beats = useMemo(() => beatsOf(plays), [plays]);
  const beat = useSceneFrames(beats, { isPlaying, isStill });
  const play = plays[beat.playIndex];

  if (!play) {
    return null;
  }

  const count = Math.max(play.agents.length, 1);
  const isTyping = beat.reveal === 0;
  const isBranched = isRevealed(beat.reveal, 1);

  return (
    <div
      ref={ref}
      role='img'
      aria-label={labelOf(play)}
      className={cn('@container flex w-full max-w-[26rem] flex-col', className)}
    >
      <PromptField
        typed={beat.typed}
        isSending={beat.isSending}
        isTyping={isTyping}
      />
      <Connectors count={count} isDrawn={isBranched} />
      <div style={columnsOf(count)} className='grid gap-2'>
        {play.agents.map((agent, index) => (
          <AgentCard
            key={seatKeyOf(index)}
            agent={agent}
            order={index}
            reveal={beat.reveal}
          />
        ))}
      </div>
    </div>
  );
}

const PLAYS: TeamPlay[] = [
  {
    prompt: 'Find why signups dropped last week',
    agents: [
      {
        role: 'Researcher',
        series: 2,
        model: CLAUDE,
        tools: [
          { name: 'Notion', brand: 'notion' },
          { name: 'Google Drive', brand: 'googledrive' },
        ],
      },
      {
        role: 'Analyst',
        series: 3,
        model: GEMINI,
        tools: [
          { name: 'PostgreSQL', brand: 'postgresql' },
          { name: 'Stripe', brand: 'stripe' },
        ],
      },
      {
        role: 'Writer',
        series: 4,
        model: CHATGPT,
        tools: [
          { name: 'Google Docs', brand: 'googledocs' },
          { name: 'Gmail', brand: 'gmail' },
        ],
      },
    ],
  },
  {
    prompt: 'Fix the failing checkout tests',
    agents: [
      {
        role: 'Planner',
        series: 1,
        model: MISTRAL,
        tools: [
          { name: 'Linear', brand: 'linear' },
          { name: 'Sentry', brand: 'sentry' },
        ],
      },
      {
        role: 'Coder',
        series: 5,
        model: CLAUDE,
        tools: [
          { name: 'GitHub', brand: 'github' },
          { name: 'Vercel', brand: 'vercel' },
        ],
      },
      {
        role: 'Reviewer',
        series: 4,
        model: DEEPSEEK,
        tools: [
          { name: 'GitHub', brand: 'github' },
          { name: 'Linear', brand: 'linear' },
        ],
      },
    ],
  },
];

export default function Illustration04() {
  return <PromptToTeam plays={PLAYS} />;
}
