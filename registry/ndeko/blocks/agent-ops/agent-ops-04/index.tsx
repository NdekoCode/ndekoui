'use client';

import { AnimatePresence, motion } from 'motion/react';

import { MotionNumber } from '@/components/core/motion-number';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { useSession } from '@/registry/ndeko/hooks/use-session';
import { useTimeouts } from '@/registry/ndeko/hooks/use-timeouts';
import {
  pressedSolidOf,
  spokenUnless,
} from '@/registry/ndeko/lib/demonstration';
import { PlusIcon } from '@/registry/ndeko/lib/icons';
import { rowPresenceOf } from '@/registry/ndeko/lib/motion-presets';
import { countOf } from '@/registry/ndeko/lib/words';
import { Badge } from '@/registry/ndeko/ui/badge';
import { BrandTile } from '@/registry/ndeko/ui/brand-tile';
import { Button } from '@/registry/ndeko/ui/button';
import { ClockGate } from '@/registry/ndeko/ui/live-duration';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';

import { AddServerDialog } from './add-server-dialog';
import { AGENT_NAME } from './data';
import { ServerRow } from './server-row';
import {
  INITIAL,
  LOOP_AFTER_MS,
  RECONNECT_MS,
  reducer,
  RESTING,
  SCRIPT,
  SETTLE_MS,
  TEST_MS,
  type McpState,
  type ServerLive,
} from './session';

const SESSION = {
  reducer,
  initial: INITIAL,
  resting: RESTING,
  script: SCRIPT,
  loopAfter: LOOP_AFTER_MS,
};

type Reach = {
  connected: number;
  toolsOn: number;
  askFirst: number;
};

function isConnected(live: ServerLive) {
  const isSteady = live.status === 'connected';
  const isRestored = live.status === 'restored';
  return isSteady || isRestored;
}

/** Only the tools of connected servers count: the agent cannot call the others. */
function reachOf(state: McpState): Reach {
  const reach: Reach = { connected: 0, toolsOn: 0, askFirst: 0 };
  for (const server of state.servers) {
    const live = state.live[server.id];
    if (!isConnected(live)) {
      continue;
    }
    reach.connected += 1;
    for (const setting of Object.values(live.tools)) {
      if (!setting.isEnabled) {
        continue;
      }
      reach.toolsOn += 1;
      if (setting.asksFirst) {
        reach.askFirst += 1;
      }
    }
  }
  return reach;
}

function reachLineOf(reach: Reach, total: number) {
  const servers = countOf(total, 'server');
  const tools = countOf(reach.toolsOn, 'tool');
  return `${reach.connected} of ${servers} connected, ${tools} on, ${reach.askFirst} ask first`;
}

type ReachFigureProps = {
  label: string;
  value: number;
  suffix?: string;
};

function ReachFigure({ label, value, suffix }: ReachFigureProps) {
  return (
    <div className='flex min-w-0 flex-col gap-0.5'>
      <dt className='text-muted-foreground text-xs'>{label}</dt>
      <dd className='flex items-baseline gap-1.5'>
        <MotionNumber
          value={value}
          className='text-2xl leading-8 font-semibold'
        />
        {suffix && (
          <span className='text-muted-foreground text-xs tabular-nums'>
            {suffix}
          </span>
        )}
      </dd>
    </div>
  );
}

export default function AgentOps04() {
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
  const { schedule } = useTimeouts();
  const shouldReduceMotion = usePrefersReducedMotion();
  const rowPresence = rowPresenceOf(shouldReduceMotion);
  const reach = reachOf(state);
  const serverCount = state.servers.length;
  const isEmpty = serverCount === 0;
  const reachLine = reachLineOf(reach, serverCount);
  const message = spokenUnless(isAutoplaying, reachLine);
  const canReplay = isFinished && !isAutoplaying;

  function focusLater(selector: string) {
    requestAnimationFrame(() => {
      const target = ref.current?.querySelector<HTMLElement>(selector);
      target?.focus();
    });
  }

  function reconnect(id: string) {
    act({ type: 'reconnect', id });
    schedule(() => act({ type: 'reconnected', id }), RECONNECT_MS);
    schedule(() => act({ type: 'settled', id }), RECONNECT_MS + SETTLE_MS);
  }

  function test() {
    act({ type: 'test' });
    schedule(() => act({ type: 'tested' }), TEST_MS);
  }

  function openDialog() {
    act({ type: 'dialogOpened' });
    focusLater('[data-dialog-first]');
  }

  function closeDialog() {
    act({ type: 'dialogClosed' });
    focusLater('[data-add-server]');
  }

  function addServer() {
    act({ type: 'added' });
    focusLater('[data-add-server]');
  }

  return (
    <ClockGate isActive={isInView}>
      <div
        ref={ref}
        className='bg-background text-foreground @container relative h-dvh min-h-[40rem] w-full overflow-hidden'
      >
        <div inert={state.dialog.isOpen} className='h-full overflow-y-auto'>
          <div className='mx-auto flex max-w-3xl flex-col gap-5 p-4 @3xl:p-8'>
            <header className='flex flex-wrap items-center gap-x-3 gap-y-2'>
              <BrandTile brand='mcp' size='lg' />
              <div className='flex min-w-40 flex-1 flex-col leading-tight'>
                <h1 className='text-lg font-semibold text-balance'>
                  MCP servers
                </h1>
                <p className='text-muted-foreground text-xs'>
                  What the {AGENT_NAME} can reach
                </p>
              </div>
              <ReplayButton
                isShown={canReplay}
                onReplay={restart}
                label='Replay the setup'
              />
              <Button
                type='button'
                data-add-server
                onClick={openDialog}
                className={pressedSolidOf(pressed === 'add')}
              >
                <PlusIcon />
                Add server
              </Button>
            </header>

            <dl className='grid grid-cols-3 gap-3'>
              <ReachFigure
                label='Connected'
                value={reach.connected}
                suffix={`of ${serverCount}`}
              />
              <ReachFigure label='Tools on' value={reach.toolsOn} />
              <ReachFigure label='Ask first' value={reach.askFirst} />
            </dl>

            <section
              aria-label='Servers'
              className='bg-card hairline-ring ring-border dark:bg-foreground/[0.03] flex flex-col rounded-xl p-1 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'
            >
              <ul className='flex flex-col'>
                <AnimatePresence initial={false}>
                  {state.servers.map((server) => (
                    <motion.li
                      key={server.id}
                      className='overflow-hidden'
                      {...rowPresence}
                    >
                      <ServerRow
                        server={server}
                        live={state.live[server.id]}
                        isOpen={state.openId === server.id}
                        isRemoving={state.removingId === server.id}
                        pressed={pressed}
                        onAction={act}
                        onReconnect={reconnect}
                      />
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
              {isEmpty && (
                <div className='flex flex-col items-start gap-3 p-3 transition-opacity duration-300 starting:opacity-0'>
                  <p className='text-muted-foreground text-[13px]'>
                    No server is connected, so the agent has no tools. Add one
                    to give it something to work with.
                  </p>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={openDialog}
                  >
                    <PlusIcon />
                    Add server
                  </Button>
                </div>
              )}
            </section>

            <Badge variant='secondary' className='self-start'>
              Illustrative tool lists
            </Badge>
          </div>
        </div>

        <AddServerDialog
          dialog={state.dialog}
          pressed={pressed}
          onAction={act}
          onTest={test}
          onAdd={addServer}
          onClose={closeDialog}
        />
        <LiveRegion message={message} />
      </div>
    </ClockGate>
  );
}
