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
import { FileIcon, PlusIcon } from '@/registry/ndeko/lib/icons';
import { rowPresenceOf } from '@/registry/ndeko/lib/motion-presets';
import { cn } from '@/registry/ndeko/lib/utils';
import { BrandTile } from '@/registry/ndeko/ui/brand-tile';
import { Button } from '@/registry/ndeko/ui/button';
import { ClockGate } from '@/registry/ndeko/ui/live-duration';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';

import {
  countOfKind,
  fileLinesOf,
  GUARD_KEYS,
  numbered,
  PULL_REQUEST,
  type LineKind,
  type NumberedLine,
} from './data';
import {
  APPLY_MS,
  hasGuardOf,
  INITIAL,
  LOOP_AFTER_MS,
  reducer,
  REPLY_MS,
  RESTING,
  SCRIPT,
  type ReviewState,
} from './session';
import { ReviewThread } from './thread';

const SESSION = {
  reducer,
  initial: INITIAL,
  resting: RESTING,
  script: SCRIPT,
  loopAfter: LOOP_AFTER_MS,
};

const SIGN: Record<LineKind, string> = { same: ' ', added: '+', removed: '-' };

const LINE_TINT: Record<LineKind, string> = {
  same: '',
  added: 'bg-success/10',
  removed: 'bg-destructive/10',
};

const LINE_WORD: Record<LineKind, string> = {
  same: '',
  added: 'Added: ',
  removed: 'Removed: ',
};

function openCountOf(state: ReviewState) {
  const open = state.threads.filter((thread) => !thread.isResolved);
  return open.length;
}

function conversationsOf(count: number) {
  if (count === 0) {
    return 'Every conversation is resolved';
  }
  if (count === 1) {
    return '1 open conversation';
  }
  return `${count} open conversations`;
}

function plusClassOf(isPressed: boolean) {
  if (isPressed) {
    return 'scale-90 opacity-100';
  }
  return 'opacity-0';
}

/** The lines a suggestion just added light for a moment, then keep the tint of an added line. */
function freshClassOf(isFresh: boolean) {
  if (isFresh) {
    return 'transition-colors duration-1000 ease-out starting:bg-primary/30';
  }
  return undefined;
}

function lineNumberOf(line: NumberedLine) {
  return line.newNumber ?? line.oldNumber;
}

type DiffRowProps = {
  line: NumberedLine;
  canComment: boolean;
  isPlusPressed: boolean;
  onOpen: (lineKey: string) => void;
};

function DiffRow({ line, canComment, isPlusPressed, onOpen }: DiffRowProps) {
  const isFresh = GUARD_KEYS.has(line.key);
  const number = lineNumberOf(line);

  return (
    <div
      className={cn(
        'group/row flex items-start font-mono text-xs leading-6',
        LINE_TINT[line.kind],
        freshClassOf(isFresh)
      )}
    >
      <span className='flex h-6 w-7 shrink-0 items-center justify-center'>
        {canComment && (
          <button
            type='button'
            aria-label={`Comment on line ${number}`}
            onClick={() => onOpen(line.key)}
            className={cn(
              'bg-primary text-primary-foreground flex size-5 cursor-pointer items-center justify-center rounded-md transition-[opacity,scale] duration-150 outline-none group-hover/row:opacity-100 focus-visible:opacity-100 active:scale-[0.97] [@media(hover:none)]:opacity-60',
              plusClassOf(isPlusPressed)
            )}
          >
            <PlusIcon className='size-3.5' />
          </button>
        )}
      </span>
      <span className='text-muted-foreground/70 hidden w-8 shrink-0 text-end tabular-nums select-none @md:block'>
        {line.oldNumber}
      </span>
      <span className='text-muted-foreground/70 w-8 shrink-0 text-end tabular-nums select-none'>
        {line.newNumber}
      </span>
      <span
        aria-hidden='true'
        className='text-muted-foreground w-6 shrink-0 text-center select-none'
      >
        {SIGN[line.kind]}
      </span>
      <span className='sr-only'>{LINE_WORD[line.kind]}</span>
      <code className='min-w-0 flex-1 pe-3 break-all whitespace-pre-wrap'>
        {line.text}
      </code>
    </div>
  );
}

type CommentFieldProps = {
  draft: string;
  shouldFocus: boolean;
  isPostPressed: boolean;
  onChange: (text: string) => void;
  onPost: () => void;
  onCancel: () => void;
};

function CommentField({
  draft,
  shouldFocus,
  isPostPressed,
  onChange,
  onPost,
  onCancel,
}: CommentFieldProps) {
  const canPost = draft.trim() !== '';

  function handleKeys(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Escape') {
      onCancel();
      return;
    }
    const hasModifier = event.metaKey || event.ctrlKey;
    const isPostKey = event.key === 'Enter' && hasModifier;
    if (isPostKey && canPost) {
      onPost();
    }
  }

  return (
    <div className='bg-card hairline-ring ring-foreground/12 has-[textarea:focus-visible]:ring-ring/25 dark:bg-foreground/[0.04] flex flex-col gap-2 rounded-lg p-2 font-sans shadow-[0_1px_2px_rgb(0_0_0/0.05)] transition-[box-shadow] duration-150 has-[textarea:focus-visible]:ring-[3px]'>
      <textarea
        value={draft}
        rows={2}
        autoFocus={shouldFocus}
        aria-label='Comment on this line'
        placeholder='Leave a comment for Coder'
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeys}
        className='placeholder:text-muted-foreground/75 resize-none bg-transparent px-1.5 py-1 text-base leading-normal outline-none md:text-[13px]'
      />
      <div className='flex items-center justify-end gap-2'>
        <Button type='button' variant='ghost' size='sm' onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type='button'
          size='sm'
          disabled={!canPost}
          onClick={onPost}
          className={pressedSolidOf(isPostPressed)}
        >
          Post comment
        </Button>
      </div>
    </div>
  );
}

export default function AgentReview02() {
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
  const hasGuard = hasGuardOf(state);
  const fileLines = fileLinesOf(hasGuard);
  const lines = numbered(fileLines);
  const additions = countOfKind(fileLines, 'added');
  const deletions = countOfKind(fileLines, 'removed');
  const openCount = openCountOf(state);
  const conversations = conversationsOf(openCount);
  const message = spokenUnless(isAutoplaying, conversations);
  const canReplay = isFinished && !isAutoplaying;

  function post() {
    const lineKey = state.openLine;
    act({ type: 'posted' });
    if (lineKey !== null) {
      schedule(() => act({ type: 'replied', lineKey }), REPLY_MS);
    }
  }

  function apply(lineKey: string) {
    act({ type: 'applying', lineKey });
    schedule(() => act({ type: 'applied', lineKey }), APPLY_MS);
  }

  return (
    <ClockGate isActive={isInView}>
      <div
        ref={ref}
        className='bg-background text-foreground @container min-h-dvh w-full p-3 @3xl:p-8'
      >
        <div className='mx-auto flex max-w-3xl flex-col gap-4'>
          <header className='flex flex-wrap items-center gap-x-3 gap-y-2'>
            <BrandTile brand='github' size='lg' title='GitHub' />
            <div className='flex min-w-40 flex-1 flex-col leading-tight'>
              <h1 className='text-sm font-medium'>{PULL_REQUEST.title}</h1>
              <span className='text-muted-foreground text-xs'>
                {conversations}
              </span>
            </div>
            <ReplayButton
              isShown={canReplay}
              onReplay={restart}
              label='Replay the review'
            />
          </header>

          <section
            aria-label={`Changes in ${PULL_REQUEST.file}`}
            className='bg-card hairline-ring ring-border dark:bg-foreground/[0.03] overflow-hidden rounded-xl shadow-[0_1px_2px_rgb(0_0_0/0.04)]'
          >
            <div className='flex h-10 items-center gap-2 px-3'>
              <FileIcon className='text-muted-foreground size-4 shrink-0' />
              <span className='min-w-0 flex-1 truncate font-mono text-xs'>
                {PULL_REQUEST.file}
              </span>
              <span className='flex items-center gap-2 text-xs font-medium'>
                <MotionNumber
                  value={additions}
                  prefix='+'
                  className='text-success-foreground'
                />
                <MotionNumber
                  value={deletions}
                  prefix='-'
                  className='text-destructive-ink'
                />
              </span>
            </div>
            <ol className='pb-2'>
              {lines.map((line) => {
                const thread = state.threads.find(
                  (candidate) => candidate.lineKey === line.key
                );
                const isFieldOpen = state.openLine === line.key;
                const canComment = thread === undefined;
                return (
                  <li key={line.key}>
                    <DiffRow
                      line={line}
                      canComment={canComment}
                      isPlusPressed={pressed === `plus-${line.key}`}
                      onOpen={(lineKey) => act({ type: 'opened', lineKey })}
                    />
                    <AnimatePresence initial={false}>
                      {isFieldOpen && (
                        <motion.div
                          key='field'
                          className='overflow-hidden'
                          {...rowPresence}
                        >
                          <div className='p-2 @md:ps-9'>
                            <CommentField
                              draft={state.draft}
                              shouldFocus={!isAutoplaying}
                              isPostPressed={pressed === 'post'}
                              onChange={(text) => act({ type: 'typed', text })}
                              onPost={post}
                              onCancel={() => act({ type: 'closed' })}
                            />
                          </div>
                        </motion.div>
                      )}
                      {thread && (
                        <motion.div
                          key='thread'
                          className='overflow-hidden'
                          {...rowPresence}
                        >
                          <div className='p-2 @md:ps-9'>
                            <ReviewThread
                              thread={thread}
                              pressed={pressed}
                              onApply={apply}
                              onResolve={(lineKey) =>
                                act({ type: 'resolved', lineKey })
                              }
                              onToggleFold={(lineKey) =>
                                act({ type: 'folded', lineKey })
                              }
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </li>
                );
              })}
            </ol>
          </section>
        </div>
        <LiveRegion message={message} />
      </div>
    </ClockGate>
  );
}
