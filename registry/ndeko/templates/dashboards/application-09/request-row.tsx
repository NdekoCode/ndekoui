'use client';

import { seriesColorOf } from '@/registry/ndeko/lib/agent-run';
import {
  pressedQuietOf,
  pressedSolidOf,
} from '@/registry/ndeko/lib/demonstration';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Button } from '@/registry/ndeko/ui/button';
import { MeshTile } from '@/registry/ndeko/ui/mesh-tile';

import { AGENTS, type RequestSeed, type Risk } from './data';
import type { Decision } from './session';

const RISK_WORD: Record<Risk, string> = {
  low: 'Low risk',
  medium: 'Medium risk',
  high: 'High risk',
};

const RISK_VARIANT = {
  low: 'secondary',
  medium: 'warning',
  high: 'destructive',
} as const;

type RequestRowProps = {
  request: RequestSeed;
  pressed: string | null;
  onDecide: (requestId: RequestSeed['id'], decision: Decision) => void;
};

export function RequestRow({ request, pressed, onDecide }: RequestRowProps) {
  const agent = AGENTS[request.agentId];
  const isAllowPressed = pressed === `allow-${request.id}`;
  const isDenyPressed = pressed === `deny-${request.id}`;

  function allow() {
    onDecide(request.id, 'approved');
  }

  function deny() {
    onDecide(request.id, 'denied');
  }

  return (
    <div className='flex flex-wrap items-start gap-x-3 gap-y-2.5 px-4 py-3'>
      <MeshTile
        seed={agent.name}
        color={seriesColorOf(agent.series)}
        size='lg'
      />
      <div className='flex min-w-0 flex-1 basis-52 flex-col gap-0.5'>
        <p className='flex flex-wrap items-center gap-x-2 gap-y-1'>
          <span className='text-[13px] leading-5 font-medium text-pretty'>
            {request.title}
          </span>
          <Badge variant={RISK_VARIANT[request.risk]}>
            {RISK_WORD[request.risk]}
          </Badge>
        </p>
        <p className='text-muted-foreground text-xs leading-5 text-pretty'>
          {agent.name} asks. {request.detail}
        </p>
        <p className='text-muted-foreground text-xs'>{request.waiting}</p>
      </div>
      <div className='flex shrink-0 items-center gap-2'>
        <Button
          type='button'
          size='sm'
          aria-label={`Allow: ${request.title}`}
          onClick={allow}
          className={pressedSolidOf(isAllowPressed)}
        >
          Allow
        </Button>
        <Button
          type='button'
          size='sm'
          variant='outline'
          aria-label={`Deny: ${request.title}`}
          onClick={deny}
          className={pressedQuietOf(isDenyPressed)}
        >
          Deny
        </Button>
      </div>
    </div>
  );
}
