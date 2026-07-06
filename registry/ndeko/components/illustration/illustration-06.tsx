'use client';

import { seriesColorOf, type SeriesSlot } from '@/registry/ndeko/lib/agent-run';
import {
  MessageSquareTextIcon,
  MousePointerIcon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Avatar } from '@/registry/ndeko/ui/avatar';

import { delayWhile } from './_parts/delay';
import { useSceneFrames, type SceneFrame } from './_parts/use-scene-frames';
import { useScenePlay } from './_parts/use-scene-play';

export type FlowTask = {
  title: string;
  /** The person who owns the task. Their picture is drawn from this name. */
  owner: string;
};

export type FlowSubtask = {
  id: string;
  title: string;
  role: string;
  assignee: string;
  noteCount: number;
};

export type FlowCursor = {
  name: string;
  series: SeriesSlot;
};

type CardState = 'home' | 'held' | 'carried' | 'landed';

type CursorState = 'waiting' | 'near' | 'moved' | 'gone';

type Beat = {
  isBranched: boolean;
  hasCards: boolean;
  card: CardState;
  cursor: CursorState;
};

type Pose = {
  translate: string;
  rotate: string;
  scale: string;
  transitionDuration: string;
};

type GemStyle = React.CSSProperties & { '--gem': string };

const TASK_PX = 56;

const ROWS_TOP_PX = 68;

const ROW_PX = 48;

const ROW_PITCH_PX = 56;

const CARD_STAGGER_MS = 110;

/** The branches to the subtasks start once the trunk is down, one after the other. */
const BRANCH_AFTER_MS = 200;

const BRANCH_STAGGER_MS = 100;

/** A card never lies quite straight once it is put down. */
const TILTS_DEG = [-1.2, 0.9, -0.7, 1.1];

const HIDDEN_HOME: Pose = {
  translate: '0px -6px',
  rotate: '0deg',
  scale: '1',
  transitionDuration: '200ms',
};

const REST: Beat = {
  isBranched: true,
  hasCards: true,
  card: 'landed',
  cursor: 'moved',
};

const GONE: Beat = {
  isBranched: false,
  hasCards: false,
  card: 'landed',
  cursor: 'gone',
};

const EMPTY: Beat = { ...GONE, card: 'home', cursor: 'waiting' };

const BRANCHED: Beat = { ...EMPTY, isBranched: true };

const SETTLED: Beat = { ...BRANCHED, hasCards: true };

/** The round ends on the card in the air above its slot: the first frame, back at rest, is the drop. */
const BEATS: SceneFrame<Beat>[] = [
  { state: REST, holdMs: 2800 },
  { state: GONE, holdMs: 420 },
  { state: EMPTY, holdMs: 260 },
  { state: BRANCHED, holdMs: 520 },
  { state: SETTLED, holdMs: 900 },
  { state: { ...SETTLED, cursor: 'near' }, holdMs: 820 },
  { state: { ...SETTLED, cursor: 'near', card: 'held' }, holdMs: 300 },
  { state: { ...SETTLED, cursor: 'moved', card: 'carried' }, holdMs: 980 },
];

function rowTopOf(index: number) {
  return ROWS_TOP_PX + index * ROW_PITCH_PX;
}

function rowMiddleOf(index: number) {
  return rowTopOf(index) + ROW_PX / 2;
}

function branchDelayOf(index: number) {
  return BRANCH_AFTER_MS + index * BRANCH_STAGGER_MS;
}

function tiltOf(index: number) {
  return TILTS_DEG[index % TILTS_DEG.length];
}

function settledPoseOf(isShown: boolean, tilt: number): Pose {
  if (isShown) {
    return {
      translate: '0px 0px',
      rotate: `${tilt}deg`,
      scale: '1',
      transitionDuration: '320ms',
    };
  }
  return HIDDEN_HOME;
}

/**
 * The pose of the card the cursor moves. Hidden at home it goes back without a transition: it returns
 * from the slot while nobody can see it.
 */
function movedPoseOf(
  card: CardState,
  isShown: boolean,
  tilt: number,
  carry: string
): Pose {
  if (card === 'held') {
    return {
      translate: '0px -2px',
      rotate: '1.5deg',
      scale: '1.03',
      transitionDuration: '240ms',
    };
  }
  if (card === 'carried') {
    return {
      translate: carry,
      rotate: '1.5deg',
      scale: '1.03',
      transitionDuration: '900ms',
    };
  }
  if (card === 'landed') {
    return {
      translate: carry,
      rotate: '-0.6deg',
      scale: '1',
      transitionDuration: '280ms',
    };
  }
  if (isShown) {
    return settledPoseOf(true, tilt);
  }
  return { ...HIDDEN_HOME, transitionDuration: '0ms' };
}

function cursorPoseOf(cursor: CursorState, carry: string) {
  if (cursor === 'near') {
    return { translate: '0px 0px', transitionDuration: '700ms' };
  }
  if (cursor === 'moved') {
    return { translate: carry, transitionDuration: '900ms' };
  }
  if (cursor === 'gone') {
    return { translate: carry, transitionDuration: '260ms' };
  }
  return { translate: '34px 40px', transitionDuration: '0ms' };
}

function isCursorSeen(cursor: CursorState) {
  const isNear = cursor === 'near';
  const hasMoved = cursor === 'moved';
  return isNear || hasMoved;
}

function isLifted(card: CardState) {
  const isHeld = card === 'held';
  const isCarried = card === 'carried';
  return isHeld || isCarried;
}

function isStillInList(card: CardState) {
  const isHome = card === 'home';
  const isHeld = card === 'held';
  return isHome || isHeld;
}

/** How far the last card travels to its slot: half the stage across, and up to the row its slot is on. */
function carryOf(lastIndex: number, slotIndex: number) {
  const rowsUp = lastIndex - slotIndex;
  const up = rowsUp * ROW_PITCH_PX;
  return `calc(50cqw + 2px) -${up}px`;
}

function subtaskCountOf(count: number) {
  if (count === 1) {
    return '1 subtask';
  }
  return `${count} subtasks`;
}

function labelOf(task: FlowTask, subtasks: FlowSubtask[], cursor: FlowCursor) {
  const titles = subtasks.map((subtask) => subtask.title);
  const moved = titles.at(-1);
  if (moved === undefined) {
    return task.title;
  }
  const list = titles.join(', ');
  return `${task.title} branches into ${list}. ${cursor.name} moves ${moved} to the next slot`;
}

const CARD =
  'bg-card hairline-ring ring-border absolute left-5 h-12 w-[calc(50%-26px)] rounded-lg opacity-0 shadow-[0_1px_2px_rgb(0_0_0/0.04)] transition-[translate,rotate,scale,opacity] ease-(--ease-in-out-strong) data-[shown=true]:opacity-100';

const LINE = 'bg-foreground/15 absolute left-2';

const DRAWN_DOWN =
  'w-px origin-top scale-y-0 transition-[scale,opacity] duration-200 ease-(--ease-out-strong) data-[drawn=true]:scale-y-100';

const DRAWN_ACROSS =
  'h-px w-3 origin-left scale-x-0 transition-[scale,opacity] duration-200 ease-(--ease-out-strong) data-[drawn=true]:scale-x-100';

function SubtaskFace({ subtask }: { subtask: FlowSubtask }) {
  return (
    <span className='flex h-full flex-col justify-center gap-1 px-2.5'>
      <span className='truncate text-xs leading-4 font-medium'>
        {subtask.title}
      </span>
      <span className='text-muted-foreground flex items-center gap-1.5 text-[11px] leading-4'>
        <Avatar seed={subtask.assignee} className='size-4' />
        <span className='min-w-0 flex-1 truncate'>{subtask.role}</span>
        <MessageSquareTextIcon className='size-3 shrink-0' />
        <span className='tabular-nums'>{subtask.noteCount}</span>
      </span>
    </span>
  );
}

type NamedCursorProps = {
  cursor: FlowCursor;
  state: CursorState;
  carry: string;
  top: number;
};

function NamedCursor({ cursor, state, carry, top }: NamedCursorProps) {
  const color = seriesColorOf(cursor.series);
  const plate: GemStyle = { '--gem': color };

  return (
    <span
      data-seen={isCursorSeen(state)}
      style={{ top, ...cursorPoseOf(state, carry) }}
      className='pointer-events-none absolute left-5 z-10 h-12 w-[calc(50%-26px)] opacity-0 transition-[translate,opacity] ease-(--ease-in-out-strong) data-[seen=true]:opacity-100'
    >
      <span className='absolute top-[55%] left-[38%] flex items-start'>
        <MousePointerIcon style={{ color }} className='size-4 fill-current' />
        <span
          style={plate}
          className='gem-plate mt-3 rounded-full px-2 py-0.5 text-[11px] leading-4 font-medium whitespace-nowrap'
        >
          {cursor.name}
        </span>
      </span>
    </span>
  );
}

export type TaskFlowProps = {
  task: FlowTask;
  /** The cursor moves the last one into the empty slot. */
  subtasks: FlowSubtask[];
  cursor: FlowCursor;
  className?: string;
};

export function TaskFlow({ task, subtasks, cursor, className }: TaskFlowProps) {
  const { ref, isPlaying, isStill } = useScenePlay();
  const beat = useSceneFrames(BEATS, { isPlaying, isStill });
  const count = subtasks.length;
  const lastIndex = Math.max(count - 1, 0);
  const slotIndex = Math.max(count - 2, 0);
  const carry = carryOf(lastIndex, slotIndex);
  const stageHeight = rowTopOf(lastIndex) + ROW_PX;
  const trunkHeight = rowMiddleOf(slotIndex) - TASK_PX;
  const lastTrunkHeight = rowMiddleOf(lastIndex) - rowMiddleOf(slotIndex);
  const isLastInList = isStillInList(beat.card);
  const isLastDrawn = beat.isBranched && isLastInList;
  const isLastHome = beat.card === 'home';
  const isLastEntering = beat.hasCards && isLastHome;
  const hasLanded = beat.card === 'landed';
  const isSlotFilled = beat.hasCards && hasLanded;
  const isSlotAimed = beat.card === 'carried';

  return (
    <div
      ref={ref}
      role='img'
      aria-label={labelOf(task, subtasks, cursor)}
      style={{ height: stageHeight }}
      className={cn('@container relative w-full max-w-[26rem]', className)}
    >
      <div className='bg-card hairline-ring ring-border absolute top-0 left-0 flex h-14 w-[66%] items-center gap-2 rounded-xl px-3 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
        <span className='flex min-w-0 flex-1 flex-col'>
          <span className='truncate text-[13px] leading-5 font-medium'>
            {task.title}
          </span>
          <span className='text-muted-foreground text-[11px] leading-4'>
            {subtaskCountOf(count)}
          </span>
        </span>
        <Avatar seed={task.owner} className='size-6' />
      </div>
      <span
        data-drawn={beat.isBranched}
        style={{ top: TASK_PX, height: trunkHeight }}
        className={cn(LINE, DRAWN_DOWN)}
      />
      <span
        data-drawn={isLastDrawn}
        style={{ top: rowMiddleOf(slotIndex), height: lastTrunkHeight }}
        className={cn(LINE, DRAWN_DOWN, 'data-[drawn=true]:delay-150')}
      />
      {subtasks.map((subtask, index) => {
        const isLast = index === lastIndex;
        const leadsToCard = !isLast || isLastInList;
        const isDrawn = beat.isBranched && leadsToCard;

        return (
          <span
            key={subtask.id}
            data-drawn={isDrawn}
            style={{
              top: rowMiddleOf(index),
              ...delayWhile(isDrawn, branchDelayOf(index)),
            }}
            className={cn(LINE, DRAWN_ACROSS)}
          />
        );
      })}
      <span
        data-aimed={isSlotAimed}
        data-filled={isSlotFilled}
        style={{ top: rowTopOf(slotIndex) }}
        className='hairline-border border-foreground/25 text-muted-foreground data-[aimed=true]:border-primary/60 data-[aimed=true]:bg-primary/[0.06] absolute right-1 flex h-12 w-[calc(50%-26px)] items-center justify-center rounded-lg border-dashed text-[11px] transition-[border-color,background-color,opacity] duration-200 data-[filled=true]:opacity-0'
      >
        Next up
      </span>
      {subtasks.map((subtask, index) => {
        const isLast = index === lastIndex;
        const tilt = tiltOf(index);
        const delayMs = index * CARD_STAGGER_MS;

        if (isLast) {
          return (
            <span
              key={subtask.id}
              data-shown={beat.hasCards}
              style={{
                top: rowTopOf(index),
                ...movedPoseOf(beat.card, beat.hasCards, tilt, carry),
                ...delayWhile(isLastEntering, delayMs),
              }}
              className={cn(CARD, 'z-5')}
            >
              <span
                data-lifted={isLifted(beat.card)}
                className='absolute inset-0 rounded-[inherit] opacity-0 shadow-[0_4px_8px_-2px_rgb(0_0_0/0.06),0_12px_32px_-4px_rgb(0_0_0/0.12)] transition-opacity duration-200 data-[lifted=true]:opacity-100'
              />
              <SubtaskFace subtask={subtask} />
            </span>
          );
        }
        return (
          <span
            key={subtask.id}
            data-shown={beat.hasCards}
            style={{
              top: rowTopOf(index),
              ...settledPoseOf(beat.hasCards, tilt),
              ...delayWhile(beat.hasCards, delayMs),
            }}
            className={CARD}
          >
            <SubtaskFace subtask={subtask} />
          </span>
        );
      })}
      <NamedCursor
        cursor={cursor}
        state={beat.cursor}
        carry={carry}
        top={rowTopOf(lastIndex)}
      />
    </div>
  );
}

const TASK: FlowTask = {
  title: 'Launch pricing page',
  owner: 'Ines Moreau',
};

const SUBTASKS: FlowSubtask[] = [
  {
    id: 'plans',
    title: 'Plan table',
    role: 'Design',
    assignee: 'Maya Okafor',
    noteCount: 2,
  },
  {
    id: 'faq',
    title: 'Write the FAQ',
    role: 'Copy',
    assignee: 'Jonas Weber',
    noteCount: 1,
  },
  {
    id: 'checkout',
    title: 'Wire checkout',
    role: 'Build',
    assignee: 'Priya Nair',
    noteCount: 3,
  },
];

const CURSOR: FlowCursor = { name: 'Ines', series: 5 };

export default function Illustration06() {
  return <TaskFlow task={TASK} subtasks={SUBTASKS} cursor={CURSOR} />;
}
