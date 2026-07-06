'use client';

import { useKeptHeight } from '@/registry/ndeko/hooks/use-kept-height';
import { useSession } from '@/registry/ndeko/hooks/use-session';
import {
  pressedQuietOf,
  spokenUnless,
} from '@/registry/ndeko/lib/demonstration';
import { CheckIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Checkbox } from '@/registry/ndeko/ui/checkbox';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { SettleItem } from '@/registry/ndeko/ui/settle';

import {
  HERO_LOOKS,
  NOTES,
  NOTES_ANCHOR,
  NOTES_SECTION,
  NOTES_TAKE,
  type Note,
} from './data';
import { SESSION, resolvePressKeyOf, type PinsState } from './pins-session';
import { Reveal } from './reveal';
import { MugScene } from './scenes';

const NOTES_LOOK = HERO_LOOKS[1];

function isShownAt(state: PinsState, index: number) {
  return index < state.shownCount;
}

function pinMotionOf(isShown: boolean) {
  if (isShown) {
    return 'scale-100 opacity-100';
  }
  return 'pointer-events-none scale-50 opacity-0';
}

function pinToneOf(isResolved: boolean, isActive: boolean) {
  if (isResolved) {
    return 'bg-card text-muted-foreground ring-foreground/20';
  }
  if (isActive) {
    return 'bg-primary text-primary-foreground ring-primary/40 ring-4';
  }
  return 'bg-primary text-primary-foreground ring-card ring-2';
}

function rowToneOf(isActive: boolean) {
  if (isActive) {
    return 'bg-foreground/[0.04]';
  }
  return 'bg-transparent';
}

function hiddenUnless(isShown: boolean) {
  if (isShown) {
    return undefined;
  }
  return true;
}

function tabIndexOf(isShown: boolean) {
  if (isShown) {
    return 0;
  }
  return -1;
}

function noteMotionOf(isShown: boolean) {
  if (isShown) {
    return 'translate-y-0 opacity-100';
  }
  return 'translate-y-1 opacity-0';
}

function announcementOf(state: PinsState) {
  const resolvedCount = state.resolvedIds.length;
  return `${state.shownCount} notes pinned, ${resolvedCount} done`;
}

type PinButtonProps = {
  note: Note;
  position: number;
  isShown: boolean;
  isActive: boolean;
  isResolved: boolean;
  onPick: (id: string) => void;
};

function PinButton({
  note,
  position,
  isShown,
  isActive,
  isResolved,
  onPick,
}: PinButtonProps) {
  function pick() {
    onPick(note.id);
  }

  return (
    <button
      type='button'
      aria-label={`Note ${position}: ${note.text}`}
      aria-pressed={isActive}
      aria-hidden={hiddenUnless(isShown)}
      tabIndex={tabIndexOf(isShown)}
      onClick={pick}
      style={{ left: `${note.x}%`, top: `${note.y}%` }}
      className={cn(
        'focus-visible:ring-ring absolute flex size-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-xs font-semibold tabular-nums shadow-[0_1px_3px_rgb(0_0_0/0.2)] transition-[scale,opacity,background-color,box-shadow] duration-300 ease-(--ease-out-strong) outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        pinMotionOf(isShown),
        pinToneOf(isResolved, isActive)
      )}
    >
      {isResolved && <CheckIcon className='size-3.5' strokeWidth={2.5} />}
      {!isResolved && position}
    </button>
  );
}

type NoteRowProps = {
  note: Note;
  position: number;
  isShown: boolean;
  isActive: boolean;
  isResolved: boolean;
  isResolvePressed: boolean;
  onPick: (id: string) => void;
  onToggle: (id: string) => void;
};

function NoteRow({
  note,
  position,
  isShown,
  isActive,
  isResolved,
  isResolvePressed,
  onPick,
  onToggle,
}: NoteRowProps) {
  function pick() {
    onPick(note.id);
  }

  function toggle() {
    onToggle(note.id);
  }

  return (
    <li
      aria-hidden={hiddenUnless(isShown)}
      inert={!isShown}
      className={cn(
        'flex items-center gap-3 rounded-xl p-3 transition-[background-color,opacity,translate] duration-300 ease-(--ease-out-strong)',
        rowToneOf(isActive),
        noteMotionOf(isShown)
      )}
    >
      <Checkbox
        checked={isResolved}
        onCheckedChange={toggle}
        aria-label={`Mark note ${position} as done`}
        className={cn('size-5', pressedQuietOf(isResolvePressed))}
      />
      <button
        type='button'
        onClick={pick}
        className={cn(
          'focus-visible:ring-ring/25 min-w-0 flex-1 rounded-md text-start text-[13px] transition-colors outline-none focus-visible:ring-[3px]',
          isResolved && 'text-muted-foreground line-through'
        )}
      >
        {note.text}
      </button>
      <Badge variant='secondary' className='tabular-nums'>
        {position}
      </Badge>
    </li>
  );
}

export function Pins() {
  const { ref, isAutoplaying, state, act, pressed } = useSession(SESSION);
  const message = spokenUnless(isAutoplaying, announcementOf(state));
  useKeptHeight(ref);

  function pick(id: string) {
    act({ type: 'picked', id });
  }

  function toggle(id: string) {
    act({ type: 'resolveToggled', id });
  }

  return (
    <section
      id={NOTES_ANCHOR}
      className='px-4 py-16 @sm:px-6 @sm:py-20 @5xl:px-8'
    >
      <Reveal
        className='mx-auto max-w-6xl'
        groupClassName='flex flex-col gap-8'
      >
        <SettleItem className='flex max-w-2xl flex-col gap-3'>
          <h2 className='text-2xl font-semibold text-balance @2xl:text-3xl'>
            {NOTES_SECTION.title}
          </h2>
          <p className='text-muted-foreground text-base text-pretty'>
            {NOTES_SECTION.description}
          </p>
        </SettleItem>
        <SettleItem>
          <div
            ref={ref}
            className='bg-foreground/[0.03] grid min-h-[30rem] gap-2 rounded-2xl p-2 @3xl:min-h-[22rem] @3xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] @3xl:gap-3 @3xl:p-3'
          >
            <figure className='bg-card hairline-ring ring-border dark:bg-foreground/[0.04] flex flex-col gap-3 rounded-xl p-3 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
              <div className='hairline-ring ring-border relative aspect-[4/3] overflow-hidden rounded-lg'>
                <MugScene look={NOTES_LOOK} />
                {NOTES.map((note, index) => (
                  <PinButton
                    key={note.id}
                    note={note}
                    position={index + 1}
                    isShown={isShownAt(state, index)}
                    isActive={state.activeId === note.id}
                    isResolved={state.resolvedIds.includes(note.id)}
                    onPick={pick}
                  />
                ))}
              </div>
              <figcaption className='text-muted-foreground flex items-center justify-between gap-3 text-xs'>
                <span className='truncate'>{NOTES_TAKE.title}</span>
                <span className='tabular-nums'>Seed {NOTES_TAKE.seed}</span>
              </figcaption>
            </figure>
            <ul className='flex flex-col gap-1 self-center'>
              {NOTES.map((note, index) => (
                <NoteRow
                  key={note.id}
                  note={note}
                  position={index + 1}
                  isShown={isShownAt(state, index)}
                  isActive={state.activeId === note.id}
                  isResolved={state.resolvedIds.includes(note.id)}
                  isResolvePressed={pressed === resolvePressKeyOf(note.id)}
                  onPick={pick}
                  onToggle={toggle}
                />
              ))}
            </ul>
            <LiveRegion message={message} />
          </div>
        </SettleItem>
      </Reveal>
    </section>
  );
}
