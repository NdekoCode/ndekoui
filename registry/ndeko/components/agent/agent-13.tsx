'use client';

import { useId } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { useKeptHeight } from '@/registry/ndeko/hooks/use-kept-height';
import {
  useSession,
  type SessionStep,
} from '@/registry/ndeko/hooks/use-session';
import { useTimeouts } from '@/registry/ndeko/hooks/use-timeouts';
import type { BrandSlug } from '@/registry/ndeko/lib/brand-logos';
import {
  pressedQuietOf,
  spokenUnless,
} from '@/registry/ndeko/lib/demonstration';
import {
  ChevronDownIcon,
  LoaderIcon,
  RefreshCwIcon,
} from '@/registry/ndeko/lib/icons';
import { restingOf } from '@/registry/ndeko/lib/run-session';
import { cn } from '@/registry/ndeko/lib/utils';
import { countOf } from '@/registry/ndeko/lib/words';
import { BrandTile } from '@/registry/ndeko/ui/brand-tile';
import { Button } from '@/registry/ndeko/ui/button';
import { Fold, Swap } from '@/registry/ndeko/ui/chat-motion';
import { CompanyMark } from '@/registry/ndeko/ui/company-mark';
import { ClockGate } from '@/registry/ndeko/ui/live-duration';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';
import { Switch } from '@/registry/ndeko/ui/switch';

export type ServerStatus =
  'connected' | 'needs-sign-in' | 'asking' | 'connecting' | 'failed';

export type ServerTool = {
  id: string;
  name: string;
  /** How many times the agent called it this week. */
  calls: number;
  isOn: boolean;
};

export type ToolServer = {
  id: string;
  name: string;
  /** A known product wears its real mark. Without one, the server wears a mark drawn from its name. */
  brand?: BrandSlug;
  status: ServerStatus;
  /** True for the moment after a sign-in went through: the status says "Signed in". */
  isSignedIn?: boolean;
  failure?: string;
  tools: ServerTool[];
};

const STATUS_WORD: Record<ServerStatus, string> = {
  connected: 'Connected',
  'needs-sign-in': 'Needs sign-in',
  asking: 'Asking for sign-in',
  connecting: 'Connecting',
  failed: 'Failed',
};

const STATUS_DOT: Record<ServerStatus, string> = {
  connected: 'bg-success',
  'needs-sign-in': 'bg-warning',
  asking: 'bg-info',
  connecting: 'bg-info',
  failed: 'bg-destructive',
};

function chevronTurnOf(isOpen: boolean) {
  if (isOpen) {
    return 'rotate-180';
  }
  return 'rotate-0';
}

function statusWordOf(server: ToolServer) {
  if (server.status === 'connected' && server.isSignedIn) {
    return 'Signed in';
  }
  return STATUS_WORD[server.status];
}

function actionLabelOf(status: ServerStatus) {
  if (status === 'needs-sign-in') {
    return 'Reconnect';
  }
  if (status === 'failed') {
    return 'Retry';
  }
  return null;
}

function isBusy(status: ServerStatus) {
  const isAsking = status === 'asking';
  const isConnecting = status === 'connecting';
  return isAsking || isConnecting;
}

function onCountOf(server: ToolServer) {
  return server.tools.filter((tool) => tool.isOn).length;
}

function ServerMark({ server }: { server: ToolServer }) {
  if (server.brand) {
    return <BrandTile brand={server.brand} size='lg' />;
  }
  return <CompanyMark seed={server.name} size='lg' />;
}

function StatusLine({ server }: { server: ToolServer }) {
  const word = statusWordOf(server);
  const isWorking = isBusy(server.status);

  return (
    <span className='text-muted-foreground flex items-center gap-1.5 text-xs'>
      <Swap swapKey={String(isWorking)}>
        {isWorking && <LoaderIcon className='size-3 animate-spin' />}
        {!isWorking && (
          <span
            aria-hidden='true'
            className={cn('size-1.5 rounded-full', STATUS_DOT[server.status])}
          />
        )}
      </Swap>
      <Swap swapKey={word}>{word}</Swap>
    </span>
  );
}

function ToolCount({ server }: { server: ToolServer }) {
  const total = server.tools.length;
  if (server.status === 'connected') {
    return (
      <span className='text-muted-foreground shrink-0 text-xs'>
        <MotionNumber value={onCountOf(server)} /> of {countOf(total, 'tool')}{' '}
        on
      </span>
    );
  }
  return (
    <span className='text-muted-foreground shrink-0 text-xs tabular-nums'>
      {countOf(total, 'tool')}
    </span>
  );
}

type ToolRowsProps = {
  server: ToolServer;
  onToolChange: (serverId: string, toolId: string, isOn: boolean) => void;
};

function ToolRows({ server, onToolChange }: ToolRowsProps) {
  const isConnected = server.status === 'connected';

  return (
    <ul aria-label={`${server.name} tools`} className='flex flex-col'>
      {server.tools.map((tool) => (
        <li key={tool.id} className='flex min-h-9 items-center gap-3'>
          <span
            className={cn(
              'min-w-0 flex-1 truncate font-mono text-xs transition-opacity duration-200',
              toolToneOf(isConnected, tool.isOn)
            )}
          >
            {tool.name}
          </span>
          <span className='text-muted-foreground shrink-0 text-xs tabular-nums'>
            {countOf(tool.calls, 'call')}
          </span>
          <Switch
            checked={tool.isOn}
            disabled={!isConnected}
            aria-label={`Allow ${tool.name}`}
            onCheckedChange={(isOn) => onToolChange(server.id, tool.id, isOn)}
          />
        </li>
      ))}
    </ul>
  );
}

function toolToneOf(isConnected: boolean, isOn: boolean) {
  if (!isConnected) {
    return 'opacity-50';
  }
  if (!isOn) {
    return 'opacity-60';
  }
  return 'opacity-100';
}

function DrawerNote({ server }: { server: ToolServer }) {
  if (server.status === 'failed') {
    return (
      <p className='text-destructive-ink text-xs leading-5'>{server.failure}</p>
    );
  }
  if (server.status === 'needs-sign-in') {
    return (
      <p className='text-muted-foreground text-xs leading-5'>
        Sign in to {server.name} so the agent can use these tools.
      </p>
    );
  }
  if (isBusy(server.status)) {
    return (
      <p className='text-muted-foreground text-xs leading-5'>
        Waiting for {server.name} to answer.
      </p>
    );
  }
  return (
    <p className='text-muted-foreground text-xs leading-5'>
      The agent only calls the tools that are on.
    </p>
  );
}

type ServerRowProps = {
  server: ToolServer;
  isOpen: boolean;
  isPressed: boolean;
  isActionPressed: boolean;
  onToggle: (serverId: string) => void;
  onToolChange: (serverId: string, toolId: string, isOn: boolean) => void;
  onReconnect: (serverId: string) => void;
};

function ServerRow({
  server,
  isOpen,
  isPressed,
  isActionPressed,
  onToggle,
  onToolChange,
  onReconnect,
}: ServerRowProps) {
  const drawerId = useId();
  const actionLabel = actionLabelOf(server.status);
  const hasAction = actionLabel !== null;

  function toggle() {
    onToggle(server.id);
  }

  function reconnect() {
    onReconnect(server.id);
  }

  return (
    <li
      data-status={server.status}
      className={cn(
        'rounded-lg transition-colors duration-200',
        surfaceOf(isOpen)
      )}
    >
      <div className='flex flex-wrap items-center gap-x-2 gap-y-1 ps-1 pe-2'>
        <button
          type='button'
          aria-expanded={isOpen}
          aria-controls={drawerId}
          onClick={toggle}
          className={cn(
            'focus-visible:ring-ring/25 hover:bg-foreground/[0.03] flex min-h-12 min-w-0 flex-1 basis-56 cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-start transition-[background-color,scale] outline-none focus-visible:ring-[3px]',
            pressedQuietOf(isPressed)
          )}
        >
          <ServerMark server={server} />
          <span className='flex min-w-0 flex-1 flex-col'>
            <span className='truncate text-[13px] font-medium'>
              {server.name}
            </span>
            <StatusLine server={server} />
          </span>
          <ToolCount server={server} />
          <ChevronDownIcon
            className={cn(
              'text-muted-foreground size-4 shrink-0 transition-transform duration-200 ease-(--ease-out-strong)',
              chevronTurnOf(isOpen)
            )}
          />
        </button>
        {hasAction && (
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={reconnect}
            aria-label={`${actionLabel} ${server.name}`}
            className={pressedQuietOf(isActionPressed)}
          >
            <RefreshCwIcon />
            {actionLabel}
          </Button>
        )}
      </div>
      <Fold open={isOpen} id={drawerId}>
        <div className='flex flex-col gap-1 px-3 ps-[3.75rem] pt-1 pb-3'>
          <DrawerNote server={server} />
          <ToolRows server={server} onToolChange={onToolChange} />
        </div>
      </Fold>
    </li>
  );
}

function surfaceOf(isOpen: boolean) {
  if (isOpen) {
    return 'bg-foreground/[0.04] dark:bg-foreground/[0.06]';
  }
  return 'bg-transparent';
}

export type ToolServersProps = {
  servers: ToolServer[];
  /** The server whose tools show, or null when every drawer is closed. */
  openId: string | null;
  onOpenChange: (serverId: string | null) => void;
  onToolChange: (serverId: string, toolId: string, isOn: boolean) => void;
  /** Reconnect for a server that needs signing in, Retry for one that failed. */
  onReconnect: (serverId: string) => void;
  /** The control a demonstration holds down: `row:github`, `reconnect:notion`. */
  pressedKey?: string | null;
  className?: string;
};

export function ToolServers({
  servers,
  openId,
  onOpenChange,
  onToolChange,
  onReconnect,
  pressedKey = null,
  className,
}: ToolServersProps) {
  function toggle(serverId: string) {
    if (openId === serverId) {
      onOpenChange(null);
      return;
    }
    onOpenChange(serverId);
  }

  return (
    <section
      aria-label='Tool servers'
      className={cn(
        'bg-card hairline-ring ring-border rounded-xl p-2 shadow-[0_1px_2px_rgb(0_0_0/0.04)]',
        className
      )}
    >
      <ul className='flex flex-col gap-1'>
        {servers.map((server) => (
          <ServerRow
            key={server.id}
            server={server}
            isOpen={openId === server.id}
            isPressed={pressedKey === `row:${server.id}`}
            isActionPressed={pressedKey === `reconnect:${server.id}`}
            onToggle={toggle}
            onToolChange={onToolChange}
            onReconnect={onReconnect}
          />
        ))}
      </ul>
    </section>
  );
}

const SIGN_IN_MS = 1600;

function toolsOf(names: [string, number][], idPrefix: string): ServerTool[] {
  return names.map(([name, calls]) => ({
    id: `${idPrefix}-${name}`,
    name,
    calls,
    isOn: true,
  }));
}

const SERVERS: ToolServer[] = [
  {
    id: 'github',
    name: 'GitHub',
    brand: 'github',
    status: 'connected',
    tools: toolsOf(
      [
        ['search_issues', 18],
        ['read_file', 41],
        ['list_commits', 7],
        ['create_pull_request', 3],
        ['add_comment', 5],
      ],
      'github'
    ),
  },
  {
    id: 'notion',
    name: 'Notion',
    brand: 'notion',
    status: 'needs-sign-in',
    tools: toolsOf(
      [
        ['search_pages', 12],
        ['read_page', 9],
        ['create_page', 4],
        ['query_database', 6],
      ],
      'notion'
    ),
  },
  {
    id: 'postgres',
    name: 'Postgres',
    brand: 'postgresql',
    status: 'connected',
    tools: toolsOf(
      [
        ['run_query', 26],
        ['list_tables', 9],
        ['describe_table', 14],
      ],
      'postgres'
    ),
  },
  {
    id: 'brightmoor',
    name: 'Brightmoor ERP',
    status: 'failed',
    failure: 'The server did not answer within 10 seconds.',
    tools: toolsOf(
      [
        ['get_invoice', 8],
        ['list_orders', 2],
      ],
      'brightmoor'
    ),
  },
];

type ServersState = {
  servers: ToolServer[];
  openId: string | null;
};

type ServersAction =
  | { type: 'open'; serverId: string | null }
  | { type: 'tool'; serverId: string; toolId: string; isOn: boolean }
  | { type: 'reconnect'; serverId: string }
  | { type: 'settle'; serverId: string }
  | { type: 'hold' };

type ServersStep = SessionStep<ServersState, ServersAction>;

const INITIAL: ServersState = { servers: SERVERS, openId: null };

function withServer(
  state: ServersState,
  serverId: string,
  change: (server: ToolServer) => ToolServer
): ServersState {
  const servers = state.servers.map((server) => {
    if (server.id === serverId) {
      return change(server);
    }
    return server;
  });
  return { ...state, servers };
}

function withTool(
  server: ToolServer,
  toolId: string,
  isOn: boolean
): ToolServer {
  const tools = server.tools.map((tool) => {
    if (tool.id === toolId) {
      return { ...tool, isOn };
    }
    return tool;
  });
  return { ...server, tools };
}

function askedAgain(server: ToolServer): ToolServer {
  if (server.status === 'needs-sign-in') {
    return { ...server, status: 'asking' };
  }
  if (server.status === 'failed') {
    return { ...server, status: 'connecting', failure: undefined };
  }
  return server;
}

function settled(server: ToolServer): ToolServer {
  if (server.status === 'asking') {
    return { ...server, status: 'connected', isSignedIn: true };
  }
  if (server.status === 'connecting') {
    return { ...server, status: 'connected' };
  }
  return server;
}

function reducer(state: ServersState, action: ServersAction): ServersState {
  switch (action.type) {
    case 'open':
      return { ...state, openId: action.serverId };
    case 'tool':
      return withServer(state, action.serverId, (server) =>
        withTool(server, action.toolId, action.isOn)
      );
    case 'reconnect':
      return withServer(state, action.serverId, askedAgain);
    case 'settle':
      return withServer(state, action.serverId, settled);
    case 'hold':
      return state;
  }
}

const PULL_REQUEST_TOOL = 'github-create_pull_request';

const SCRIPT: ServersStep[] = [
  {
    after: 1600,
    by: 'demo',
    press: 'row:github',
    action: { type: 'open', serverId: 'github' },
  },
  {
    after: 1700,
    by: 'demo',
    action: {
      type: 'tool',
      serverId: 'github',
      toolId: PULL_REQUEST_TOOL,
      isOn: false,
    },
  },
  {
    after: 1800,
    by: 'demo',
    press: 'row:notion',
    action: { type: 'open', serverId: 'notion' },
  },
  {
    after: 1500,
    by: 'demo',
    press: 'reconnect:notion',
    action: { type: 'reconnect', serverId: 'notion' },
  },
  { after: SIGN_IN_MS, action: { type: 'settle', serverId: 'notion' } },
  { after: 3800, action: { type: 'hold' } },
];

const SESSION = {
  reducer,
  initial: INITIAL,
  resting: restingOf(INITIAL, SCRIPT, reducer),
  script: SCRIPT,
  loopAfter: 3000,
};

function announcementOf(state: ServersState) {
  const asking = state.servers.find((server) => server.status === 'asking');
  if (asking) {
    return `Asking ${asking.name} for sign-in`;
  }
  const signedIn = state.servers.find((server) => server.isSignedIn);
  if (signedIn) {
    return `Signed in to ${signedIn.name}`;
  }
  return '';
}

export default function Agent13() {
  const { schedule, clearAll } = useTimeouts();
  const {
    ref,
    isInView,
    isAutoplaying,
    state,
    act,
    pressed,
    isFinished,
    restart,
  } = useSession(SESSION);
  const hasSignedIn = state.servers.some((server) => server.isSignedIn);
  const canReplay = hasSignedIn && isFinished && !isAutoplaying;
  const announcement = announcementOf(state);

  function changeOpen(serverId: string | null) {
    act({ type: 'open', serverId });
  }

  function changeTool(serverId: string, toolId: string, isOn: boolean) {
    act({ type: 'tool', serverId, toolId, isOn });
  }

  function reconnect(serverId: string) {
    act({ type: 'reconnect', serverId });
    schedule(() => act({ type: 'settle', serverId }), SIGN_IN_MS);
  }

  function replay() {
    clearAll();
    restart();
  }

  useKeptHeight(ref);

  return (
    <div
      ref={ref}
      className='flex min-h-[28rem] w-full max-w-[32rem] flex-col gap-2'
    >
      <ClockGate isActive={isInView}>
        <ToolServers
          servers={state.servers}
          openId={state.openId}
          onOpenChange={changeOpen}
          onToolChange={changeTool}
          onReconnect={reconnect}
          pressedKey={pressed}
        />
      </ClockGate>
      <div className='flex h-7 items-center justify-end'>
        <ReplayButton isShown={canReplay} onReplay={replay} />
      </div>
      <LiveRegion message={spokenUnless(isAutoplaying, announcement)} />
    </div>
  );
}
