'use client';

import { useEffect, useId, useState } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { useSession } from '@/registry/ndeko/hooks/use-session';
import { spokenUnless } from '@/registry/ndeko/lib/demonstration';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';

import { SECTION, TOOLS, toolOf, type ToolId } from './data';
import { DriftRows } from './drift-rows';
import { Glass } from './glass';
import {
  CONNECT_MS,
  INITIAL,
  LOOP_AFTER_MS,
  reducer,
  RESTING,
  SCRIPT,
  type ToolsState,
} from './session';
import { ToolPills } from './tool-pills';

const SESSION = {
  reducer,
  initial: INITIAL,
  resting: RESTING,
  script: SCRIPT,
  loopAfter: LOOP_AFTER_MS,
};

function spokenLineOf(state: ToolsState) {
  if (state.openId === null) {
    return '';
  }
  const tool = toolOf(state.openId);
  if (!tool) {
    return '';
  }
  if (state.isConnecting) {
    return `Connecting ${tool.name}`;
  }
  if (state.connected.includes(tool.id)) {
    return `${tool.name} is connected`;
  }
  return `${tool.name}: ${tool.summary}`;
}

function isConnectedTool(openId: ToolId | null, connected: ToolId[]) {
  if (openId === null) {
    return false;
  }
  return connected.includes(openId);
}

function openToolOf(openId: ToolId | null) {
  if (openId === null) {
    return null;
  }
  return toolOf(openId) ?? null;
}

export default function Integrations04() {
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
  const glassId = useId();
  const [isHovering, setIsHovering] = useState(false);
  const { openId, isConnecting, connected } = state;
  const openTool = openToolOf(openId);
  const isOpen = openId !== null;
  const isOffScreen = !isInView;
  const isHeld = isOffScreen || isHovering || isOpen;
  const isOpenConnected = isConnectedTool(openId, connected);
  const message = spokenUnless(isAutoplaying, spokenLineOf(state));
  const canReplay = isFinished && !isAutoplaying;

  useEffect(() => {
    if (!isConnecting) {
      return;
    }
    const timer = setTimeout(() => act({ type: 'connected' }), CONNECT_MS);
    return () => clearTimeout(timer);
  }, [isConnecting, act]);

  function focusLater(selector: string) {
    requestAnimationFrame(() => {
      const target = ref.current?.querySelector<HTMLElement>(selector);
      target?.focus();
    });
  }

  function openByPerson(id: ToolId) {
    act({ type: 'opened', id });
    focusLater('[data-connect]');
  }

  function closeByPerson() {
    const closing = openId;
    act({ type: 'closed' });
    if (closing !== null) {
      focusLater(`[data-tool="${closing}"]`);
    }
  }

  function disconnectOpen() {
    if (openId !== null) {
      act({ type: 'disconnected', id: openId });
    }
  }

  function closeOnEscape(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape' && isOpen) {
      event.preventDefault();
      closeByPerson();
    }
  }

  function holdWhileHovering(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType === 'mouse') {
      setIsHovering(true);
    }
  }

  function releaseHover() {
    setIsHovering(false);
  }

  return (
    <div ref={ref} onKeyDown={closeOnEscape} className='@container'>
      <section className='px-4 py-16 @2xl:px-6 @2xl:py-24 @5xl:px-8'>
        <div className='mx-auto flex max-w-4xl flex-col items-center gap-10'>
          <header className='flex max-w-xl flex-col items-center gap-3 text-center'>
            <h2 className='text-2xl font-semibold text-balance @2xl:text-3xl'>
              {SECTION.title}
            </h2>
            <p className='text-muted-foreground text-base text-pretty'>
              {SECTION.description}
            </p>
          </header>
          <div
            data-held={isHeld}
            onPointerEnter={holdWhileHovering}
            onPointerLeave={releaseHover}
            className='group/reel relative h-52 w-full'
          >
            <div
              aria-hidden='true'
              className='absolute inset-0 mask-x-from-85% motion-reduce:mask-none'
            >
              <DriftRows
                layer='grey'
                connected={connected}
                onPick={openByPerson}
              />
            </div>
            <div
              aria-hidden='true'
              data-open={isOpen}
              className='pointer-events-none absolute inset-0 transition-opacity delay-200 duration-200 [clip-path:inset(0_calc(50%_-_3rem)_round_3rem)] data-[open=true]:opacity-0 data-[open=true]:delay-0 data-[open=true]:duration-100'
            >
              <DriftRows layer='colour' connected={connected} />
            </div>
            <Glass
              layoutId={glassId}
              tool={openTool}
              isConnected={isOpenConnected}
              isConnecting={isConnecting}
              isConnectPressed={pressed === 'connect'}
              onConnect={() => act({ type: 'connectStarted' })}
              onDisconnect={disconnectOpen}
              onClose={closeByPerson}
            />
          </div>
          <div className='flex flex-col items-center gap-3'>
            <p className='text-muted-foreground flex items-baseline gap-1 text-xs tabular-nums'>
              <MotionNumber value={connected.length} />
              <span>of {TOOLS.length} connected</span>
            </p>
            <ToolPills
              connected={connected}
              openId={openId}
              pressed={pressed}
              onPick={openByPerson}
            />
            <ReplayButton
              isShown={canReplay}
              onReplay={restart}
              label='Replay'
            />
          </div>
        </div>
      </section>
      <LiveRegion message={message} />
    </div>
  );
}
