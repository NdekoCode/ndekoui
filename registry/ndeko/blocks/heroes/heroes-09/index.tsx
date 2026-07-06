'use client';

import { useState } from 'react';

import {
  type AutoplayStep,
  useAutoplay,
} from '@/registry/ndeko/hooks/use-autoplay';
import { PRESS_LEAD_MS, usePress } from '@/registry/ndeko/lib/demonstration';
import { ArrowRightIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';

import { AgentRow } from './agent-row';
import { type AgentId, type Change, HERO, INITIAL_CHANGE } from './data';
import { WordPill } from './word-pill';

/** The demonstration walks the agents in this order and ends on the one the hero began with. */
const DEMO_ORDER: AgentId[] = [
  'researcher',
  'writer',
  'reviewer',
  'coder',
  'planner',
];

const PICK_EVERY_MS = 2600;

function changedTo(current: Change, agent: AgentId): Change {
  if (current.to === agent) {
    return current;
  }
  return { id: current.id + 1, from: current.to, to: agent };
}

export default function Heroes09() {
  const [change, setChange] = useState<Change>(INITIAL_CHANGE);
  const { pressed, press } = usePress<AgentId>();

  function pick(agent: AgentId) {
    setChange((current) => changedTo(current, agent));
  }

  function startOver() {
    setChange(INITIAL_CHANGE);
  }

  const steps: AutoplayStep[] = DEMO_ORDER.flatMap((agent) => [
    { after: PICK_EVERY_MS, run: () => press(agent) },
    { after: PRESS_LEAD_MS, run: () => pick(agent) },
  ]);
  const { ref } = useAutoplay(steps, { loopAfter: 0, onReset: startOver });

  return (
    <section className='@container'>
      <div
        ref={ref}
        className='mx-auto flex max-w-4xl flex-col items-center gap-8 px-4 py-16 text-center @2xl:gap-10 @2xl:px-6 @2xl:py-24'
      >
        <AgentRow lit={change.to} pressed={pressed} onPick={pick} />
        <h1 className='text-4xl leading-[1.15] font-semibold text-balance @2xl:text-5xl @4xl:text-6xl'>
          {HERO.titleStart}{' '}
          <span className='mt-1 block'>
            <WordPill change={change} />
          </span>
        </h1>
        <p className='text-muted-foreground max-w-xl text-base text-pretty'>
          {HERO.description}
        </p>
        <div className='flex flex-wrap justify-center gap-2'>
          <Button size='lg' nativeButton={false} render={<a href='#' />}>
            {HERO.primaryAction}
            <ArrowRightIcon />
          </Button>
          <Button
            size='lg'
            variant='outline'
            nativeButton={false}
            render={<a href='#' />}
          >
            {HERO.secondaryAction}
          </Button>
        </div>
      </div>
    </section>
  );
}
