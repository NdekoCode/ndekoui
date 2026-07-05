'use client';

import {
  AnimatePresence,
  motion,
  useDragControls,
  useInView,
  type MotionProps,
  type PanInfo,
} from 'motion/react';
import { useRef, useState } from 'react';

import { WordRoll } from '@/components/core/word-roll';
import {
  useRunScript,
  type RunScriptStep,
} from '@/registry/ndeko/hooks/use-agent-run';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import {
  emptyRun,
  seriesColorOf,
  type RunAgent,
  type RunSnapshot,
  type ToolCall,
} from '@/registry/ndeko/lib/agent-run';
import {
  CheckIcon,
  GripVerticalIcon,
  LoaderIcon,
  ShuffleIcon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import { Swap } from '@/registry/ndeko/ui/chat-motion';
import { Chip } from '@/registry/ndeko/ui/chip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroupLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuGroup,
  DropdownMenuTrigger,
} from '@/registry/ndeko/ui/dropdown-menu';

import { ClockGate, LiveDuration } from '@/registry/ndeko/ui/live-duration';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import {
  EASE_IN_OUT_STRONG,
  rowPresenceOf,
} from '@/registry/ndeko/lib/motion-presets';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';
import { AgentTile } from './_parts/agent-tile';
import {
  CODER,
  CREW,
  PLANNER,
  RESEARCHER,
  RUN_TITLE,
  WRITER,
} from './_parts/crew';
import { countOf } from './_parts/words';

export type HandoffItem = {
  id: string;
  label: string;
  /** False when the item did not reach the next agent: it stays in the view, struck through. */
  isPassed: boolean;
};

export type RelayStation = {
  id: string;
  agent: RunAgent;
  /** The agent the station had before the person moved it. */
  reassignedFrom?: RunAgent;
};

export type HandoffEntry = {
  /** The hand-off as a call: its label is the note passed along, its status the delivery. */
  call: ToolCall;
  toStationId: string;
  items: HandoffItem[];
};

type StationState = 'holding' | 'handing-off' | 'handed-off' | 'upcoming';

const STATE_WORD: Record<StationState, string> = {
  holding: 'Working',
  'handing-off': 'Handing off',
  'handed-off': 'Handed off',
  upcoming: 'Next',
};

const STATE_WORDS = Object.values(STATE_WORD);

type LightMotion = Pick<MotionProps, 'initial' | 'animate' | 'transition'>;

const LIGHT_TRAVEL: LightMotion = {
  initial: { y: '-100%' },
  animate: { y: '100%' },
  transition: { duration: 1.1, ease: EASE_IN_OUT_STRONG },
};

const LIGHT_FLASH: LightMotion = {
  initial: { opacity: 0 },
  animate: { opacity: [0, 1, 0] },
  transition: { duration: 1.1 },
};

function lightOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return LIGHT_FLASH;
  }
  return LIGHT_TRAVEL;
}

function incomingOf(handoffs: HandoffEntry[], stationId: string) {
  return handoffs.find((handoff) => handoff.toStationId === stationId);
}

function outgoingOf(
  handoffs: HandoffEntry[],
  stations: RelayStation[],
  index: number
) {
  const next = stations[index + 1];
  if (!next) {
    return undefined;
  }
  return incomingOf(handoffs, next.id);
}

function hasReceived(
  handoffs: HandoffEntry[],
  station: RelayStation,
  index: number,
  hasStarted: boolean
) {
  if (index === 0) {
    return hasStarted;
  }
  const incoming = incomingOf(handoffs, station.id);
  return incoming?.call.status === 'done';
}

function stateOf(
  isReceived: boolean,
  outgoing: HandoffEntry | undefined
): StationState {
  if (!isReceived) {
    return 'upcoming';
  }
  if (outgoing?.call.status === 'done') {
    return 'handed-off';
  }
  if (outgoing?.call.status === 'running') {
    return 'handing-off';
  }
  return 'holding';
}

/** The first station that has not received the work yet: the only one a person can still move. */
function nextStationIndexOf(
  stations: RelayStation[],
  handoffs: HandoffEntry[]
) {
  return stations.findIndex((station, index) => {
    if (index === 0) {
      return false;
    }
    const incoming = incomingOf(handoffs, station.id);
    return incoming === undefined;
  });
}

function candidatesFor(
  agents: RunAgent[],
  giver: RunAgent | undefined,
  current: RunAgent
) {
  return agents.filter((agent) => {
    const isGiver = agent.id === giver?.id;
    const isCurrent = agent.id === current.id;
    return !isGiver && !isCurrent;
  });
}

function dropTargetAt(point: { x: number; y: number }) {
  const clientX = point.x - window.scrollX;
  const clientY = point.y - window.scrollY;
  const stack = document.elementsFromPoint(clientX, clientY);
  const target = stack.find((element) =>
    element.hasAttribute('data-drop-agent')
  );
  return target?.getAttribute('data-drop-agent') ?? null;
}

const DELIVERY_WORDS = ['Handing off to', 'Received by'];

function deliveryWordOf(isRunning: boolean) {
  if (isRunning) {
    return 'Handing off to';
  }
  return 'Received by';
}

function ItemChip({ item }: { item: HandoffItem }) {
  if (item.isPassed) {
    return (
      <span className='bg-foreground/[0.05] dark:bg-foreground/[0.08] inline-flex h-6 items-center rounded-md px-2 text-xs'>
        {item.label}
      </span>
    );
  }
  return (
    <span className='bg-destructive/[0.06] inline-flex h-6 items-center gap-1.5 rounded-md px-2 text-xs'>
      <span className='text-muted-foreground decoration-muted-foreground/70 line-through'>
        {item.label}
      </span>
      <span className='text-destructive-ink'>Not passed</span>
    </span>
  );
}

function HandoffBlock({
  handoff,
  receiver,
}: {
  handoff: HandoffEntry;
  receiver: RunAgent;
}) {
  const isRunning = handoff.call.status === 'running';
  const lostItems = handoff.items.filter((item) => !item.isPassed);
  const lostCount = lostItems.length;
  const hasLost = lostCount > 0;
  const passedCount = handoff.items.length - lostCount;

  return (
    <div className='bg-foreground/[0.025] dark:bg-foreground/[0.04] mt-2 flex flex-col gap-2 rounded-lg p-3'>
      <p className='text-muted-foreground flex items-center gap-1.5 text-xs'>
        <Swap swapKey={handoff.call.status} className='size-3.5'>
          {isRunning && <LoaderIcon className='size-3.5 animate-spin' />}
          {!isRunning && (
            <CheckIcon className='text-success-foreground size-3.5' />
          )}
        </Swap>
        <span className='inline-flex items-baseline gap-1'>
          <WordRoll text={deliveryWordOf(isRunning)} labels={DELIVERY_WORDS} />
          <WordRoll text={receiver.name} />
        </span>
      </p>
      <p className='text-[13px] leading-5 text-pretty'>
        &ldquo;{handoff.call.label}&rdquo;
      </p>
      <ul
        aria-label={`Context: ${countOf(passedCount, 'item')} passed`}
        className='flex flex-wrap gap-1.5'
      >
        {handoff.items.map((item) => (
          <li key={item.id}>
            <ItemChip item={item} />
          </li>
        ))}
      </ul>
      {hasLost && (
        <p className='text-muted-foreground text-xs leading-5'>
          {countOf(lostCount, 'item')} did not make it to {receiver.name}.
        </p>
      )}
    </div>
  );
}

type NextStationProps = {
  station: RelayStation;
  giver: RunAgent | undefined;
  candidates: RunAgent[];
  onReassign?: (stationId: string, agentId: string) => void;
  onInteractionChange?: (isInteracting: boolean) => void;
};

function NextStation({
  station,
  giver,
  candidates,
  onReassign,
  onInteractionChange,
}: NextStationProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [overId, setOverId] = useState<string | null>(null);
  const dragControls = useDragControls();
  const shouldReduceMotion = usePrefersReducedMotion();
  const options = [station.agent, ...candidates];

  function pickUp(event: React.PointerEvent<HTMLDivElement>) {
    const isMouse = event.pointerType === 'mouse';
    const isOnGrip = isGripTarget(event.target);
    if (isMouse || isOnGrip) {
      dragControls.start(event);
    }
  }

  function startDrag() {
    setIsDragging(true);
    onInteractionChange?.(true);
  }

  function trackDrag(
    _event: PointerEvent | MouseEvent | TouchEvent,
    info: PanInfo
  ) {
    const target = dropTargetAt(info.point);
    setOverId(target);
  }

  function endDrag(
    _event: PointerEvent | MouseEvent | TouchEvent,
    info: PanInfo
  ) {
    const target = dropTargetAt(info.point);
    setIsDragging(false);
    setOverId(null);
    onInteractionChange?.(false);
    if (target) {
      onReassign?.(station.id, target);
    }
  }

  function changeAgent(value: unknown) {
    const agent = options.find((option) => option.id === value);
    const isNewAgent = agent !== undefined && agent.id !== station.agent.id;
    if (isNewAgent) {
      onReassign?.(station.id, agent.id);
    }
  }

  return (
    <div className='flex flex-col gap-2'>
      <motion.div
        drag
        dragControls={dragControls}
        dragListener={false}
        onPointerDown={pickUp}
        dragSnapToOrigin
        dragElastic={0.18}
        dragMomentum={false}
        onDragStart={startDrag}
        onDrag={trackDrag}
        onDragEnd={endDrag}
        whileDrag={dragLookOf(shouldReduceMotion)}
        className={cn(
          'bg-card hairline-ring ring-border relative z-20 flex cursor-grab items-center gap-2 rounded-lg py-1.5 ps-1 pe-2 shadow-[0_1px_2px_rgb(0_0_0/0.04)] active:cursor-grabbing',
          isDragging && 'surface-raised'
        )}
      >
        <span
          data-drag-grip
          aria-hidden='true'
          className='text-muted-foreground flex size-7 shrink-0 touch-none items-center justify-center'
        >
          <GripVerticalIcon className='size-4' />
        </span>
        <span className='min-w-0 flex-1 text-[13px] font-medium'>
          <WordRoll text={station.agent.name} />
        </span>
        <DropdownMenu onOpenChange={(isOpen) => onInteractionChange?.(isOpen)}>
          <DropdownMenuTrigger
            render={
              <Button
                type='button'
                variant='ghost'
                size='sm'
                className='text-muted-foreground -me-1'
                onPointerDown={(event) => event.stopPropagation()}
              />
            }
          >
            <ShuffleIcon />
            Reassign
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuGroup>
              <DropdownMenuGroupLabel>Who takes it next</DropdownMenuGroupLabel>
              <DropdownMenuRadioGroup
                value={station.agent.id}
                onValueChange={changeAgent}
              >
                {options.map((option) => (
                  <DropdownMenuRadioItem key={option.id} value={option.id}>
                    <AgentTile
                      name={option.name}
                      series={option.series}
                      size='sm'
                    />
                    {option.name}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </motion.div>
      <div aria-hidden='true' className='flex flex-wrap items-center gap-1.5'>
        <span className='text-muted-foreground text-xs'>Or drop it on</span>
        {candidates.map((candidate) => {
          const isOver = overId === candidate.id;
          return (
            <span
              key={candidate.id}
              data-drop-agent={candidate.id}
              className={cn(
                'rounded-md transition-[scale,box-shadow] duration-150 ease-(--ease-out-strong)',
                isOver && 'ring-primary/40 scale-105 ring-2'
              )}
            >
              <Chip color={seriesColorOf(candidate.series)} className='h-6'>
                {candidate.name}
              </Chip>
            </span>
          );
        })}
      </div>
      {giver && (
        <p className='sr-only'>
          {giver.name} hands the work to {station.agent.name} next. Use Reassign
          to choose another agent.
        </p>
      )}
    </div>
  );
}

/** On touch the card scrolls the page; only its grip picks it up. A mouse can take it anywhere. */
function isGripTarget(target: EventTarget) {
  if (!(target instanceof Element)) {
    return false;
  }
  const grip = target.closest('[data-drag-grip]');
  return grip !== null;
}

const DRAG_LOOK = { scale: 1.03 };

const NO_DRAG_LOOK = { scale: 1 };

function dragLookOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return NO_DRAG_LOOK;
  }
  return DRAG_LOOK;
}

function timingOf(
  isReceived: boolean,
  incoming: HandoffEntry | undefined,
  outgoing: HandoffEntry | undefined,
  startedAt: number | undefined
) {
  if (!isReceived) {
    return null;
  }
  const receivedAt = incoming?.call.endedAt ?? startedAt;
  const handedAt = outgoing?.call.startedAt;
  return { startedAt: receivedAt, endedAt: handedAt };
}

function wordOf(state: StationState) {
  return STATE_WORD[state];
}

function railToneOf(state: StationState) {
  if (state === 'upcoming') {
    return 'opacity-55';
  }
  return 'opacity-100';
}

export type AgentHandoffProps = {
  stations: RelayStation[];
  handoffs: HandoffEntry[];
  /** Agents who can take the next station. */
  agents: RunAgent[];
  startedAt?: number;
  isLive?: boolean;
  onReassign?: (stationId: string, agentId: string) => void;
  /** True while a person drags the next station or has its menu open. */
  onInteractionChange?: (isInteracting: boolean) => void;
  className?: string;
};

export function AgentHandoff({
  stations,
  handoffs,
  agents,
  startedAt,
  isLive = false,
  onReassign,
  onInteractionChange,
  className,
}: AgentHandoffProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const rowPresence = rowPresenceOf(shouldReduceMotion);
  const light = lightOf(shouldReduceMotion);
  const hasStarted = startedAt !== undefined;
  const nextIndex = nextStationIndexOf(stations, handoffs);

  return (
    <ol aria-label='Relay of agents' className={cn('flex flex-col', className)}>
      {stations.map((station, index) => {
        const isLast = index === stations.length - 1;
        const incoming = incomingOf(handoffs, station.id);
        const outgoing = outgoingOf(handoffs, stations, index);
        const isReceived = hasReceived(handoffs, station, index, hasStarted);
        const state = stateOf(isReceived, outgoing);
        const isNext = index === nextIndex;
        const receiver = stations[index + 1]?.agent;
        const giver = stations[index - 1]?.agent;
        const showsHandoff = outgoing !== undefined && receiver !== undefined;
        const timing = timingOf(isReceived, incoming, outgoing, startedAt);
        const isHolding = state === 'holding';
        const isTicking = isHolding && isLive;
        const series = seriesColorOf(station.agent.series);
        const outgoingKey = outgoing?.call.id ?? 'none';
        const isOutgoingLive = outgoing?.call.status === 'running';
        const candidates = candidatesFor(agents, giver, station.agent);

        return (
          <li key={station.id} className='relative flex gap-3 pb-5 last:pb-0'>
            {!isLast && (
              <span
                aria-hidden='true'
                className='bg-border absolute start-[11.5px] top-7 bottom-1 w-px'
              >
                <span className='absolute -inset-x-px inset-y-0 overflow-hidden'>
                  <AnimatePresence initial={false}>
                    {isOutgoingLive && (
                      <motion.span
                        key={outgoingKey}
                        className='absolute inset-x-0 h-full'
                        style={{
                          backgroundImage: `linear-gradient(to bottom, transparent, ${series} 45%, ${series} 55%, transparent)`,
                        }}
                        {...light}
                      />
                    )}
                  </AnimatePresence>
                </span>
              </span>
            )}
            <span className={cn('relative z-10 pt-0.5', railToneOf(state))}>
              <AgentTile
                name={station.agent.name}
                series={station.agent.series}
              />
            </span>
            <div className='min-w-0 flex-1'>
              {isNext && (
                <NextStation
                  station={station}
                  giver={giver}
                  candidates={candidates}
                  onReassign={onReassign}
                  onInteractionChange={onInteractionChange}
                />
              )}
              {!isNext && (
                <div className='flex min-h-7 items-baseline justify-between gap-3'>
                  <p
                    className={cn(
                      'text-[13px] font-medium',
                      state === 'upcoming' && 'text-muted-foreground'
                    )}
                  >
                    <WordRoll text={station.agent.name} />
                  </p>
                  <p className='text-muted-foreground flex items-baseline gap-1.5 text-xs'>
                    <WordRoll text={wordOf(state)} labels={STATE_WORDS} />
                    {timing && (
                      <LiveDuration
                        item={timing}
                        isRunning={isTicking}
                        className='tabular-nums'
                      />
                    )}
                  </p>
                </div>
              )}
              <AnimatePresence initial={false}>
                {station.reassignedFrom && (
                  <motion.p
                    key={station.reassignedFrom.id}
                    className='text-muted-foreground overflow-hidden text-xs'
                    {...rowPresence}
                  >
                    <span className='block pt-1'>
                      Reassigned by you, was {station.reassignedFrom.name}
                    </span>
                  </motion.p>
                )}
              </AnimatePresence>
              <AnimatePresence initial={false}>
                {showsHandoff && (
                  <motion.div
                    key={outgoingKey}
                    className='overflow-hidden'
                    {...rowPresence}
                  >
                    <HandoffBlock handoff={outgoing} receiver={receiver} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

type HandoffPlan = {
  id: string;
  toStationId: string;
  note: string;
  items: HandoffItem[];
};

const STATIONS: RelayStation[] = [
  { id: 'start', agent: PLANNER },
  { id: 'prices', agent: RESEARCHER },
  { id: 'compare', agent: CODER },
  { id: 'draft', agent: WRITER },
];

const HANDOFFS: HandoffPlan[] = [
  {
    id: 'to-prices',
    toStationId: 'prices',
    note: 'Find the Brightmoor list price for each of our 42 items',
    items: [
      { id: 'invoices', label: 'Q3 invoices', isPassed: true },
      { id: 'items', label: '42 item codes', isPassed: true },
      { id: 'budget', label: 'Budget: $40', isPassed: true },
    ],
  },
  {
    id: 'to-compare',
    toStationId: 'compare',
    note: 'Here are the 14 vendors with prices',
    items: [
      { id: 'price-lists', label: '14 price lists', isPassed: true },
      { id: 'contacts', label: 'Vendor contacts', isPassed: true },
      { id: 'page', label: 'Brightmoor pricing page', isPassed: false },
    ],
  },
  {
    id: 'to-draft',
    toStationId: 'draft',
    note: 'Six lines are above list price, $1,840.20 in total',
    items: [
      { id: 'table', label: 'Comparison table', isPassed: true },
      { id: 'script', label: 'compare_prices.py output', isPassed: true },
      { id: 'raw', label: '117 raw invoice lines', isPassed: false },
    ],
  },
];

function handoffStarted(plan: HandoffPlan): RunScriptStep['event'] {
  return {
    type: 'call.started',
    call: {
      id: plan.id,
      tool: 'handoff',
      label: plan.note,
      status: 'running',
      input: { to: plan.toStationId },
    },
  };
}

function handoffDone(plan: HandoffPlan): RunScriptStep['event'] {
  return { type: 'call.updated', id: plan.id, patch: { status: 'done' } };
}

const [TO_PRICES, TO_COMPARE, TO_DRAFT] = HANDOFFS;

const SCRIPT: RunScriptStep[] = [
  { after: 500, event: { type: 'run.started' } },
  { after: 1800, event: handoffStarted(TO_PRICES) },
  { after: 1300, event: handoffDone(TO_PRICES) },
  { after: 3200, event: handoffStarted(TO_COMPARE) },
  { after: 1300, event: handoffDone(TO_COMPARE) },
  { after: 3600, event: handoffStarted(TO_DRAFT) },
  { after: 1300, event: handoffDone(TO_DRAFT) },
  { after: 3200, event: { type: 'run.finished', status: 'done' } },
];

const INITIAL_RUN = emptyRun({ id: 'relay', title: RUN_TITLE, agents: CREW });

function entriesOf(calls: ToolCall[]): HandoffEntry[] {
  const entries: HandoffEntry[] = [];
  for (const call of calls) {
    const plan = HANDOFFS.find((candidate) => candidate.id === call.id);
    if (plan) {
      entries.push({ call, toStationId: plan.toStationId, items: plan.items });
    }
  }
  return entries;
}

function announcementOf(
  run: RunSnapshot,
  stations: RelayStation[],
  handoffs: HandoffEntry[]
) {
  const latest = handoffs.at(-1);
  if (run.status === 'done') {
    const last = stations.at(-1);
    return `${last?.agent.name ?? 'The last agent'} finished the work`;
  }
  if (!latest) {
    return `${stations[0].agent.name} starts the work`;
  }
  const receiver = stations.find(
    (station) => station.id === latest.toStationId
  );
  const name = receiver?.agent.name ?? '';
  const lost = latest.items.filter((item) => !item.isPassed);
  const lostNote = lostNoteOf(lost.length);
  if (latest.call.status === 'running') {
    return `Handing off to ${name}: ${latest.call.label}`;
  }
  return `${name} received the work.${lostNote}`;
}

function lostNoteOf(lostCount: number) {
  if (lostCount === 0) {
    return '';
  }
  return ` ${countOf(lostCount, 'item')} not passed.`;
}

export default function Agent04() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { amount: 0.3 });
  const [isInteracting, setIsInteracting] = useState(false);
  const [stations, setStations] = useState(STATIONS);
  const [message, setMessage] = useState('');
  const isFree = !isInteracting;
  const isActive = isInView && isFree;
  const { snapshot, restart } = useRunScript(SCRIPT, {
    initial: INITIAL_RUN,
    isActive,
  });
  const handoffs = entriesOf(snapshot.calls);
  const isEnded = snapshot.endedAt !== undefined;
  const isLive = snapshot.status === 'running';
  const runMessage = announcementOf(snapshot, stations, handoffs);

  function reassign(stationId: string, agentId: string) {
    const agent = CREW.find((candidate) => candidate.id === agentId);
    if (!agent) {
      return;
    }
    setStations((current) =>
      current.map((station) => {
        if (station.id !== stationId) {
          return station;
        }
        const original = station.reassignedFrom ?? station.agent;
        const isBack = original.id === agent.id;
        if (isBack) {
          return { id: station.id, agent };
        }
        return { id: station.id, agent, reassignedFrom: original };
      })
    );
    setMessage(`The next station goes to ${agent.name}`);
  }

  function replay() {
    setStations(STATIONS);
    setMessage('');
    restart();
  }

  return (
    <div ref={ref} className='flex w-full max-w-[30rem] flex-col gap-2'>
      <section
        aria-label='Hand-offs'
        className='bg-card hairline-ring ring-border flex flex-col gap-4 rounded-xl p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'
      >
        <header>
          <h3 className='text-sm font-medium'>{snapshot.title}</h3>
          <p className='text-muted-foreground text-xs'>
            Who handed what to whom
          </p>
        </header>
        <ClockGate isActive={isInView}>
          <AgentHandoff
            stations={stations}
            handoffs={handoffs}
            agents={CREW}
            startedAt={snapshot.startedAt}
            isLive={isLive}
            onReassign={reassign}
            onInteractionChange={setIsInteracting}
          />
        </ClockGate>
      </section>
      <div className='flex h-7 items-center justify-end'>
        <ReplayButton isShown={isEnded} onReplay={replay} />
      </div>
      <LiveRegion message={runMessage} />
      <LiveRegion message={message} />
    </div>
  );
}
