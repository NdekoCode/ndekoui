'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useId, useImperativeHandle, useRef, useState } from 'react';

import {
  useAutoplay,
  type AutoplayStep,
} from '@/registry/ndeko/hooks/use-autoplay';
import { useKeptHeight } from '@/registry/ndeko/hooks/use-kept-height';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { useTimeouts } from '@/registry/ndeko/hooks/use-timeouts';
import {
  seriesColorOf,
  type RiskLevel,
  type RunAgent,
} from '@/registry/ndeko/lib/agent-run';
import {
  hold,
  PRESS_LEAD_MS,
  pressedSolidOf,
  spokenUnless,
  usePress,
} from '@/registry/ndeko/lib/demonstration';
import { LockIcon, RotateCcwIcon, XIcon } from '@/registry/ndeko/lib/icons';
import { fadePresence } from '@/registry/ndeko/lib/motion-presets';
import { cn } from '@/registry/ndeko/lib/utils';
import { countOf } from '@/registry/ndeko/lib/words';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Button } from '@/registry/ndeko/ui/button';
import { Fold } from '@/registry/ndeko/ui/chat-motion';
import { CompanyMark } from '@/registry/ndeko/ui/company-mark';
import { DrawnCheck } from '@/registry/ndeko/ui/drawn-check';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { MeshTile } from '@/registry/ndeko/ui/mesh-tile';
import { MorphButton, type MorphState } from '@/registry/ndeko/ui/morph-button';
import { Switch } from '@/registry/ndeko/ui/switch';

import { RiskBadge } from './_parts/risk-badge';
import { SettledLine } from './_parts/settled-line';
import { useContainerWidth } from './_parts/use-container-width';
import { useFocusHandOff } from './_parts/use-focus-hand-off';

export type AppScope = {
  id: string;
  title: string;
  description: string;
  risk: RiskLevel;
  /** A person can switch it off. A scope that is not optional is always asked for. */
  isOptional?: boolean;
  /** What stops working while it is off. */
  without?: string;
};

export type ConnectPhase = 'asking' | 'connecting' | 'connected' | 'declined';

/** The control a demonstration holds down: Connect, Disconnect or a scope by its id. */
export type ConnectAppPress = 'connect' | 'disconnect' | `scope-${string}`;

export type ConnectAppHandle = {
  toggleScope: (scopeId: string) => void;
  connect: () => void;
  disconnect: () => void;
};

const HANDSHAKE_MS = 1500;

const DOT_PX = 8;

const TILE = 'size-12 rounded-xl';

function connectLabelsOf(count: number): Record<MorphState, string> {
  return {
    idle: `Connect with ${countOf(count, 'permission')}`,
    busy: 'Connecting',
    done: 'Connected',
  };
}

function connectStateOf(phase: ConnectPhase): MorphState {
  if (phase === 'connecting') {
    return 'busy';
  }
  return 'idle';
}

function viewOf(phase: ConnectPhase) {
  if (phase === 'connected') {
    return 'connected';
  }
  if (phase === 'declined') {
    return 'declined';
  }
  return 'asking';
}

function isLinkedPhase(phase: ConnectPhase) {
  const isConnecting = phase === 'connecting';
  const isConnected = phase === 'connected';
  return isConnecting || isConnected;
}

function toggled(ids: string[], id: string) {
  if (ids.includes(id)) {
    return ids.filter((entry) => entry !== id);
  }
  return [...ids, id];
}

function lineScaleOf(isLinked: boolean) {
  if (isLinked) {
    return 'scale-x-100';
  }
  return 'scale-x-0';
}

function dashedToneOf(isLinked: boolean) {
  if (isLinked) {
    return 'opacity-0';
  }
  return 'opacity-100';
}

function dotTargetOf(phase: ConnectPhase, travel: number, isReduced: boolean) {
  const isConnecting = phase === 'connecting';
  if (isConnecting && !isReduced) {
    return { x: [0, travel], opacity: [0, 1, 1, 0] };
  }
  if (isLinkedPhase(phase)) {
    return { x: travel, opacity: 0 };
  }
  return { x: 0, opacity: 0 };
}

function dotTransitionOf(phase: ConnectPhase) {
  if (phase === 'connecting') {
    return {
      duration: 0.8,
      delay: 0.2,
      times: [0, 0.12, 0.85, 1],
      ease: 'easeInOut' as const,
    };
  }
  return { duration: 0 };
}

function settleTargetOf(phase: ConnectPhase, isReduced: boolean) {
  const isConnecting = phase === 'connecting';
  if (isConnecting && !isReduced) {
    return { scale: [1, 1.06, 1] };
  }
  return { scale: 1 };
}

function settleTransitionOf(phase: ConnectPhase) {
  if (phase === 'connecting') {
    return { duration: 0.4, delay: 1 };
  }
  return { duration: 0 };
}

function rowPressedOf(isPressed: boolean) {
  if (isPressed) {
    return 'scale-[0.985] bg-foreground/[0.06]';
  }
  return undefined;
}

function offToneOf(isOn: boolean) {
  if (isOn) {
    return undefined;
  }
  return 'opacity-60';
}

type TileSideProps = {
  name: string;
  phase: ConnectPhase;
  children: React.ReactNode;
};

function TileSide({ name, phase, children }: TileSideProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const target = settleTargetOf(phase, shouldReduceMotion);
  const transition = settleTransitionOf(phase);

  return (
    <span className='flex w-20 flex-col items-center gap-1.5 @sm:w-28'>
      <motion.span
        animate={target}
        transition={transition}
        className='inline-flex'
      >
        {children}
      </motion.span>
      <span className='text-muted-foreground max-w-full truncate text-xs'>
        {name}
      </span>
    </span>
  );
}

type HandshakeProps = {
  agent: Pick<RunAgent, 'name' | 'series'>;
  appName: string;
  phase: ConnectPhase;
};

function Handshake({ agent, appName, phase }: HandshakeProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const [line, setLine] = useState<HTMLSpanElement | null>(null);
  const width = useContainerWidth(line, 96);
  const travel = Math.max(0, width - DOT_PX);
  const isLinked = isLinkedPhase(phase);
  const dotTarget = dotTargetOf(phase, travel, shouldReduceMotion);
  const dotTransition = dotTransitionOf(phase);

  return (
    <div aria-hidden='true' className='flex items-start justify-center'>
      <TileSide name={agent.name} phase={phase}>
        <MeshTile
          seed={agent.name}
          color={seriesColorOf(agent.series)}
          className={TILE}
        />
      </TileSide>
      <span
        ref={setLine}
        className='relative mt-6 h-px max-w-40 min-w-12 flex-1'
      >
        <span
          className={cn(
            'border-foreground/25 absolute inset-x-0 top-0 border-t border-dashed transition-opacity duration-300',
            dashedToneOf(isLinked)
          )}
        />
        <span
          className={cn(
            'bg-primary absolute inset-x-0 top-0 h-px origin-left transition-[scale] duration-500 ease-(--ease-out-strong)',
            lineScaleOf(isLinked)
          )}
        />
        <motion.span
          initial={false}
          animate={dotTarget}
          transition={dotTransition}
          className='bg-primary absolute start-0 top-1/2 size-2 -translate-y-1/2 rounded-full'
        />
      </span>
      <TileSide name={appName} phase={phase}>
        <CompanyMark seed={appName} className={TILE} />
      </TileSide>
    </div>
  );
}

type ScopeRowProps = {
  scope: AppScope;
  isOn: boolean;
  isLocked: boolean;
  isPressed: boolean;
  onToggle: (scopeId: string) => void;
};

function ScopeRow({
  scope,
  isOn,
  isLocked,
  isPressed,
  onToggle,
}: ScopeRowProps) {
  const isOptional = scope.isOptional === true;
  const hasWithout = scope.without !== undefined;
  const showsWithout = hasWithout && !isOn;

  return (
    <li
      className={cn(
        'flex flex-col rounded-md px-2 py-2 transition-[background-color,scale] duration-150 ease-(--ease-out-strong)',
        rowPressedOf(isPressed)
      )}
    >
      <div className='flex items-start gap-3'>
        <span className='mt-0.5 flex h-5 w-8 shrink-0 items-center justify-center'>
          {isOptional && (
            <Switch
              checked={isOn}
              disabled={isLocked}
              aria-label={`Allow ${scope.title}`}
              onCheckedChange={() => onToggle(scope.id)}
            />
          )}
          {!isOptional && (
            <>
              <LockIcon
                aria-hidden='true'
                className='text-muted-foreground size-3.5'
              />
              <span className='sr-only'>Required</span>
            </>
          )}
        </span>
        <span
          className={cn(
            'flex min-w-0 flex-1 flex-col gap-0.5 transition-opacity duration-150',
            offToneOf(isOn)
          )}
        >
          <span className='text-[13px] font-medium'>{scope.title}</span>
          <span className='text-muted-foreground text-xs leading-5'>
            {scope.description}
          </span>
          <RiskBadge risk={scope.risk} className='mt-1 @sm:hidden' />
        </span>
        <RiskBadge
          risk={scope.risk}
          className='mt-0.5 hidden @sm:inline-flex'
        />
      </div>
      <Fold open={showsWithout}>
        <p className='text-muted-foreground ps-11 pt-1 text-xs leading-5'>
          Without it: {scope.without}
        </p>
      </Fold>
    </li>
  );
}

export type ConnectAppProps = {
  agent: Pick<RunAgent, 'name' | 'series'>;
  appName: string;
  scopes: AppScope[];
  /** The scopes switched on when the card first shows. All of them by default. */
  defaultGrantedIds?: string[];
  defaultPhase?: 'asking' | 'connected';
  onConnect?: (grantedIds: string[]) => void;
  onDisconnect?: () => void;
  onDecline?: () => void;
  /** Putting the card back to its first state: change this number. */
  resetToken?: number;
  handleRef?: React.Ref<ConnectAppHandle>;
  pressed?: ConnectAppPress | null;
  /** A demonstration is not read aloud. */
  isDemonstrating?: boolean;
  className?: string;
};

export function ConnectApp({
  agent,
  appName,
  scopes,
  defaultGrantedIds,
  defaultPhase = 'asking',
  onConnect,
  onDisconnect,
  onDecline,
  resetToken = 0,
  handleRef,
  pressed = null,
  isDemonstrating = false,
  className,
}: ConnectAppProps) {
  const allIds = scopes.map((scope) => scope.id);
  const firstIds = defaultGrantedIds ?? allIds;
  const [grantedIds, setGrantedIds] = useState(firstIds);
  const [phase, setPhase] = useState<ConnectPhase>(defaultPhase);
  const [notice, setNotice] = useState('');
  const [seenToken, setSeenToken] = useState(resetToken);
  const titleId = useId();
  const { schedule, clearAll } = useTimeouts();
  const fade = fadePresence();
  const view = viewOf(phase);
  const { rootRef, markIfFocusInside } = useFocusHandOff(view);
  const requiredIds = scopes
    .filter((scope) => scope.isOptional !== true)
    .map((scope) => scope.id);
  const activeIds = allIds.filter((id) => {
    const isRequired = requiredIds.includes(id);
    const isGranted = grantedIds.includes(id);
    return isRequired || isGranted;
  });
  const isLocked = phase === 'connecting';
  const labels = connectLabelsOf(activeIds.length);

  useEffect(() => {
    clearAll();
  }, [resetToken, clearAll]);

  if (seenToken !== resetToken) {
    setSeenToken(resetToken);
    setGrantedIds(firstIds);
    setPhase(defaultPhase);
  }

  function toggleScope(scopeId: string) {
    const scope = scopes.find((entry) => entry.id === scopeId);
    const canToggle = scope?.isOptional === true && !isLocked;
    if (!canToggle) {
      return;
    }
    setGrantedIds((current) => toggled(current, scopeId));
  }

  function connect() {
    if (phase !== 'asking') {
      return;
    }
    const granted = activeIds;
    setPhase('connecting');
    setNotice(`Connecting to ${appName}`);
    schedule(() => {
      markIfFocusInside();
      setPhase('connected');
      setNotice(
        `Connected to ${appName} with ${countOf(granted.length, 'scope')}`
      );
      onConnect?.(granted);
    }, HANDSHAKE_MS);
  }

  function disconnect() {
    markIfFocusInside();
    setPhase('asking');
    setNotice(`Disconnected from ${appName}`);
    onDisconnect?.();
  }

  function decline() {
    markIfFocusInside();
    setPhase('declined');
    setNotice(`${appName} was not connected`);
    onDecline?.();
  }

  function reconsider() {
    markIfFocusInside();
    setPhase('asking');
  }

  useImperativeHandle(handleRef, () => ({ toggleScope, connect, disconnect }));

  return (
    <div
      ref={rootRef}
      className={cn(
        'surface-raised @container overflow-hidden rounded-xl',
        className
      )}
    >
      <div className='px-4 pt-5'>
        <Handshake agent={agent} appName={appName} phase={phase} />
      </div>
      <AnimatedSize>
        <AnimatePresence initial={false} mode='popLayout'>
          <motion.div key={view} {...fade}>
            {view === 'connected' && (
              <SettledLine
                icon={<DrawnCheck tone='success' entrance='draw' />}
                actionLabel='Disconnect'
                actionIcon={<XIcon />}
                onAction={disconnect}
                isActionPressed={pressed === 'disconnect'}
                className='pt-3'
              >
                <span className='font-medium'>
                  Connected, {countOf(activeIds.length, 'scope')}
                </span>
                <span className='text-muted-foreground'>
                  {' '}
                  for {agent.name} in {appName}
                </span>
              </SettledLine>
            )}
            {view === 'declined' && (
              <SettledLine
                icon={<XIcon className='text-muted-foreground size-4' />}
                actionLabel='Reconsider'
                actionIcon={<RotateCcwIcon />}
                onAction={reconsider}
                className='pt-3'
              >
                <span className='text-muted-foreground'>
                  Not connected, {agent.name} will not use {appName}
                </span>
              </SettledLine>
            )}
            {view === 'asking' && (
              <div
                role='group'
                aria-labelledby={titleId}
                className='flex flex-col gap-3 p-4'
              >
                <div className='flex flex-col gap-1 text-center'>
                  <p id={titleId} className='text-sm font-medium text-balance'>
                    {agent.name} wants to connect to {appName}
                  </p>
                  <p className='text-muted-foreground text-xs'>
                    Switch off what it should not do
                  </p>
                </div>
                <ul
                  aria-label='Permissions asked'
                  className='bg-foreground/[0.04] flex flex-col gap-0.5 rounded-lg p-1'
                >
                  {scopes.map((scope) => (
                    <ScopeRow
                      key={scope.id}
                      scope={scope}
                      isOn={activeIds.includes(scope.id)}
                      isLocked={isLocked}
                      isPressed={pressed === `scope-${scope.id}`}
                      onToggle={toggleScope}
                    />
                  ))}
                </ul>
                <div className='flex flex-wrap items-center gap-2'>
                  <MorphButton
                    type='button'
                    size='sm'
                    state={connectStateOf(phase)}
                    labels={labels}
                    onClick={connect}
                    className={pressedSolidOf(pressed === 'connect')}
                  />
                  <Button
                    type='button'
                    size='sm'
                    variant='outline'
                    disabled={isLocked}
                    onClick={decline}
                  >
                    Not now
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </AnimatedSize>
      <LiveRegion message={spokenUnless(isDemonstrating, notice)} />
    </div>
  );
}

const REVIEWER: Pick<RunAgent, 'name' | 'series'> = {
  name: 'Reviewer',
  series: 4,
};

const SCOPES: AppScope[] = [
  {
    id: 'invoices',
    title: 'Read invoices',
    description: 'See invoice lists, amounts and due dates',
    risk: 'low',
  },
  {
    id: 'contacts',
    title: 'Read customer contacts',
    description: 'See names, emails and phone numbers of customers',
    risk: 'medium',
    isOptional: true,
    without: 'it cannot tell who an invoice belongs to',
  },
  {
    id: 'drafts',
    title: 'Create draft invoices',
    description: 'Write drafts that stay private until you send them',
    risk: 'medium',
    isOptional: true,
    without: 'it can only read, so it cannot prepare a draft',
  },
  {
    id: 'send',
    title: 'Send invoices to customers',
    description: 'Email an invoice to a customer on your behalf',
    risk: 'high',
    isOptional: true,
    without: 'a draft waits for you to send it yourself',
  },
];

const RESTING_IDS = ['contacts', 'drafts'];

function restingIdsOf(isResting: boolean) {
  if (isResting) {
    return RESTING_IDS;
  }
  return undefined;
}

function restingPhaseOf(isResting: boolean) {
  if (isResting) {
    return 'connected';
  }
  return 'asking';
}

function ConnectDemo({ isResting }: { isResting: boolean }) {
  const [round, setRound] = useState(0);
  const card = useRef<ConnectAppHandle>(null);
  const { pressed, press } = usePress<ConnectAppPress>();

  function resetDemo() {
    setRound((current) => current + 1);
  }

  const steps: AutoplayStep[] = [
    { after: 1600, run: () => press('scope-send') },
    { after: PRESS_LEAD_MS, run: () => card.current?.toggleScope('send') },
    { after: 1900, run: () => press('connect') },
    { after: PRESS_LEAD_MS, run: () => card.current?.connect() },
    { after: 4200, run: hold },
  ];
  const { ref, isAutoplaying } = useAutoplay(steps, {
    loopAfter: 1800,
    onReset: resetDemo,
  });

  useKeptHeight(ref);

  return (
    <div ref={ref} className='flex min-h-[31rem] w-full max-w-[30rem] flex-col'>
      <ConnectApp
        agent={REVIEWER}
        appName='Kasai Ledger'
        scopes={SCOPES}
        defaultGrantedIds={restingIdsOf(isResting)}
        defaultPhase={restingPhaseOf(isResting)}
        resetToken={round}
        handleRef={card}
        pressed={pressed}
        isDemonstrating={isAutoplaying}
      />
    </div>
  );
}

export default function Review17() {
  const shouldReduceMotion = usePrefersReducedMotion();
  const restKey = String(shouldReduceMotion);

  return <ConnectDemo key={restKey} isResting={shouldReduceMotion} />;
}
