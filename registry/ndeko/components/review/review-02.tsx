'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useId, useState } from 'react';

import {
  seriesColorOf,
  type ApprovalRequest,
  type ApprovalScope,
  type RiskLevel,
  type RunAgent,
} from '@/registry/ndeko/lib/agent-run';
import {
  CheckIcon,
  CircleAlertIcon,
  CircleXIcon,
  RotateCcwIcon,
  ShieldCheckIcon,
  TriangleAlertIcon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Button } from '@/registry/ndeko/ui/button';
import { Fold } from '@/registry/ndeko/ui/chat-motion';
import { Chip } from '@/registry/ndeko/ui/chip';
import { Kbd } from '@/registry/ndeko/ui/kbd';

import { CopyButton } from '@/registry/ndeko/ui/copy-button';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { fadePresence } from '@/registry/ndeko/lib/motion-presets';
import { Segments, type Segment } from '@/registry/ndeko/ui/segments';
import { useTimeouts } from '@/registry/ndeko/hooks/use-timeouts';

export type PermissionEntry = {
  request: ApprovalRequest;
  agent: Pick<RunAgent, 'name' | 'series'>;
  tool: string;
  /** One line on what could go wrong, shown under the risk. */
  why: string;
};

export type PermissionDecision = 'allowed' | 'denied';

const SCOPES: Segment<ApprovalScope>[] = [
  { value: 'once', label: 'Once' },
  { value: 'session', label: 'This session' },
  { value: 'always', label: 'Always' },
];

const SCOPE_WORDS: Record<ApprovalScope, string> = {
  once: 'once',
  session: 'for this session',
  always: 'always, in every session',
};

type RiskLook = {
  label: string;
  variant: 'success' | 'warning' | 'destructive';
  icon: React.ReactNode;
};

const RISK_LOOK: Record<RiskLevel, RiskLook> = {
  low: {
    label: 'Low risk',
    variant: 'success',
    icon: <ShieldCheckIcon />,
  },
  medium: {
    label: 'Medium risk',
    variant: 'warning',
    icon: <TriangleAlertIcon />,
  },
  high: {
    label: 'High risk',
    variant: 'destructive',
    icon: <CircleAlertIcon />,
  },
};

function resultLineOf(
  decision: PermissionDecision,
  scope: ApprovalScope,
  agentName: string
) {
  if (decision === 'denied') {
    return `denied, ${agentName} will not run it`;
  }
  return `allowed ${SCOPE_WORDS[scope]}`;
}

function ResultLine({
  entry,
  decision,
  scope,
}: {
  entry: PermissionEntry;
  decision: PermissionDecision;
  scope: ApprovalScope;
}) {
  const isAllowed = decision === 'allowed';
  const line = resultLineOf(decision, scope, entry.agent.name);

  return (
    <div className='flex items-start gap-2.5 p-3.5 text-[13px]'>
      {isAllowed && (
        <CheckIcon className='text-success-foreground mt-0.5 size-4 shrink-0' />
      )}
      {!isAllowed && (
        <CircleXIcon className='text-muted-foreground mt-0.5 size-4 shrink-0' />
      )}
      <p className='min-w-0 leading-5'>
        <code className='bg-foreground/[0.05] rounded-sm px-1 py-0.5 font-mono text-xs break-all'>
          {entry.request.command}
        </code>{' '}
        <span className='text-muted-foreground'>{line}</span>
      </p>
    </div>
  );
}

type RequestBodyProps = {
  entry: PermissionEntry;
  scope: ApprovalScope;
  onScopeChange: (scope: ApprovalScope) => void;
  onAllow: () => void;
  onDeny: () => void;
};

function RequestBody({
  entry,
  scope,
  onScopeChange,
  onAllow,
  onDeny,
}: RequestBodyProps) {
  const titleId = useId();
  const keysId = useId();
  const warningId = useId();
  const { request, agent, tool } = entry;
  const risk = RISK_LOOK[request.risk];
  const isAlways = scope === 'always';
  const command = request.command ?? '';
  const chipColor = seriesColorOf(agent.series);

  function decideFromKeys(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      onDeny();
      return;
    }
    const isOnCard = event.target === event.currentTarget;
    const isEnter = event.key === 'Enter';
    if (isEnter && isOnCard) {
      event.preventDefault();
      onAllow();
    }
  }

  return (
    <div
      role='group'
      tabIndex={0}
      aria-labelledby={titleId}
      aria-describedby={keysId}
      onKeyDown={decideFromKeys}
      className='focus-visible:ring-ring/25 flex flex-col gap-3 rounded-xl p-4 outline-none focus-visible:ring-[3px]'
    >
      <div className='flex flex-wrap items-center gap-2'>
        <Chip color={chipColor}>{agent.name}</Chip>
        <span className='text-muted-foreground text-xs'>
          wants to use <span className='text-foreground font-mono'>{tool}</span>
        </span>
      </div>
      <p id={titleId} className='text-sm font-medium text-balance'>
        {request.title}
      </p>
      <div className='bg-foreground/[0.04] flex items-start gap-2 rounded-lg py-2 ps-3 pe-1.5'>
        <code className='min-w-0 flex-1 py-0.5 font-mono text-xs leading-5 break-all'>
          <span
            aria-hidden='true'
            className='text-muted-foreground select-none'
          >
            ${' '}
          </span>
          {command}
        </code>
        <CopyButton text={command} label='Copy the command' />
      </div>
      <div className='flex flex-col gap-1.5'>
        <Badge variant={risk.variant}>
          {risk.icon}
          {risk.label}
        </Badge>
        <p className='text-muted-foreground text-xs leading-5'>{entry.why}</p>
      </div>
      <div className='flex flex-col gap-1.5'>
        <span className='text-xs font-medium'>Allow it</span>
        <Segments
          value={scope}
          segments={SCOPES}
          onValueChange={onScopeChange}
          label='How long the permission lasts'
          className='w-full sm:w-fit'
        />
        <Fold open={isAlways} id={warningId}>
          <p className='text-warning-foreground flex items-start gap-1.5 pt-1 text-xs leading-5'>
            <TriangleAlertIcon className='mt-0.5 size-3.5 shrink-0' />
            {agent.name} will run this command without asking, in this session
            and every next one, until you take it back in settings.
          </p>
        </Fold>
      </div>
      <div className='flex flex-wrap items-center gap-2'>
        <Button type='button' size='sm' onClick={onAllow}>
          Allow
          <Kbd className='ms-0.5'>Enter</Kbd>
        </Button>
        <Button type='button' size='sm' variant='outline' onClick={onDeny}>
          Deny
          <Kbd className='ms-0.5'>Esc</Kbd>
        </Button>
        <span id={keysId} className='sr-only'>
          Enter allows, Escape denies
        </span>
      </div>
    </div>
  );
}

type PickedScope = { entryId: string; scope: ApprovalScope };

/** A new request starts from its own suggested scope, never from the last one picked. */
function pickedOf(entry: PermissionEntry): PickedScope {
  const scope = entry.request.scope ?? 'once';
  return { entryId: entry.request.id, scope };
}

export type PermissionRequestCardProps = {
  entry: PermissionEntry;
  /** Set once a decision is taken: the card resizes into one result line. */
  result?: { decision: PermissionDecision; scope: ApprovalScope } | null;
  onDecide?: (decision: PermissionDecision, scope: ApprovalScope) => void;
  className?: string;
};

export function PermissionRequestCard({
  entry,
  result = null,
  onDecide,
  className,
}: PermissionRequestCardProps) {
  const entryId = entry.request.id;
  const [picked, setPicked] = useState<PickedScope>(() => pickedOf(entry));
  if (picked.entryId !== entryId) {
    setPicked(pickedOf(entry));
  }
  const scope = picked.scope;
  const fade = fadePresence();

  function changeScope(next: ApprovalScope) {
    setPicked({ entryId, scope: next });
  }
  const swapKey = swapKeyOf(entry, result);

  function allow() {
    onDecide?.('allowed', scope);
  }

  function deny() {
    onDecide?.('denied', scope);
  }

  return (
    <div className={cn('surface-raised overflow-hidden rounded-xl', className)}>
      <AnimatedSize>
        <AnimatePresence initial={false} mode='popLayout'>
          <motion.div key={swapKey} {...fade}>
            {result && (
              <ResultLine
                entry={entry}
                decision={result.decision}
                scope={result.scope}
              />
            )}
            {!result && (
              <RequestBody
                entry={entry}
                scope={scope}
                onScopeChange={changeScope}
                onAllow={allow}
                onDeny={deny}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </AnimatedSize>
    </div>
  );
}

function swapKeyOf(
  entry: PermissionEntry,
  result: PermissionRequestCardProps['result']
) {
  if (result) {
    return `${entry.request.id}-result`;
  }
  return `${entry.request.id}-ask`;
}

const CODER: Pick<RunAgent, 'name' | 'series'> = { name: 'Coder', series: 5 };

const REQUESTS: PermissionEntry[] = [
  {
    request: {
      id: 'diff',
      title: 'See which files changed since the last commit',
      risk: 'low',
      status: 'pending',
      command: 'git diff --stat',
    },
    agent: CODER,
    tool: 'shell',
    why: 'It only reads the repository. Nothing is written or sent.',
  },
  {
    request: {
      id: 'install',
      title: 'Add a CSV parser to the project',
      risk: 'medium',
      status: 'pending',
      command: 'npm install csv-parse@5.6.0',
    },
    agent: CODER,
    tool: 'shell',
    why: 'It downloads code from the npm registry and changes package.json and the lockfile.',
  },
  {
    request: {
      id: 'cache',
      title: 'Clear the cache of old price pages',
      risk: 'high',
      status: 'pending',
      command: 'rm -rf ./tmp/cache',
    },
    agent: CODER,
    tool: 'shell',
    why: 'It deletes 214 files that are not in git. They cannot be brought back.',
  },
];

const NEXT_REQUEST_MS = 1800;

type Result = NonNullable<PermissionRequestCardProps['result']>;

function announcementOf(entry: PermissionEntry, result: Result | null) {
  const command = entry.request.command ?? '';
  if (!result) {
    return `${entry.agent.name} asks to run ${command}`;
  }
  const line = resultLineOf(result.decision, result.scope, entry.agent.name);
  return `${command}: ${line}`;
}

export default function Review02() {
  const [index, setIndex] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const { schedule, clearAll } = useTimeouts();
  const entry = REQUESTS[index];
  const isLast = index === REQUESTS.length - 1;
  const isFinished = isLast && result !== null;
  const announcement = announcementOf(entry, result);
  const stepLabel = `Request ${index + 1} of ${REQUESTS.length}`;

  function decide(decision: PermissionDecision, scope: ApprovalScope) {
    if (result) {
      return;
    }
    setResult({ decision, scope });
    if (isLast) {
      return;
    }
    schedule(() => {
      setResult(null);
      setIndex((current) => current + 1);
    }, NEXT_REQUEST_MS);
  }

  function startOver() {
    clearAll();
    setResult(null);
    setIndex(0);
  }

  return (
    <div className='flex w-full max-w-[26rem] flex-col gap-2'>
      <PermissionRequestCard entry={entry} result={result} onDecide={decide} />
      <div className='flex h-7 items-center justify-between gap-2 px-1'>
        <span className='text-muted-foreground text-xs tabular-nums'>
          {stepLabel}
        </span>
        {isFinished && (
          <Button
            type='button'
            variant='ghost'
            size='sm'
            onClick={startOver}
            className='text-muted-foreground'
          >
            <RotateCcwIcon />
            Start over
          </Button>
        )}
      </div>
      <LiveRegion message={announcement} />
    </div>
  );
}
