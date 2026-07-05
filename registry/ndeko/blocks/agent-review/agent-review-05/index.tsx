'use client';

import { useLayoutEffect, useRef } from 'react';

import { WordRoll } from '@/components/core/word-roll';
import { useSession } from '@/registry/ndeko/hooks/use-session';
import {
  pressedSolidOf,
  spokenUnless,
} from '@/registry/ndeko/lib/demonstration';
import { cn } from '@/registry/ndeko/lib/utils';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Button } from '@/registry/ndeko/ui/button';
import { Swap } from '@/registry/ndeko/ui/chat-motion';
import { ClockGate } from '@/registry/ndeko/ui/live-duration';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';
import { Segments, type Segment } from '@/registry/ndeko/ui/segments';

import {
  AGENT_ORDER,
  AGENTS,
  CHANGE_ORDER,
  CHANGES,
  COMMENT,
  DOC_TITLE,
  PARAGRAPHS,
  type AgentId,
} from './data';
import {
  AgentPointer,
  AgentTile,
  ParagraphRow,
  POINTER_REACH,
} from './doc-parts';
import {
  INITIAL,
  LOOP_AFTER_MS,
  pendingIdsOf,
  reducer,
  RESTING,
  SCRIPT,
  type ChangeStatus,
  type CommentStatus,
  type DocState,
  type DocView,
} from './session';

const SESSION = {
  reducer,
  initial: INITIAL,
  resting: RESTING,
  script: SCRIPT,
  loopAfter: LOOP_AFTER_MS,
};

const VIEW_SEGMENTS: Segment<DocView>[] = [
  { value: 'doc', label: 'Doc' },
  { value: 'table', label: 'Table' },
];

const CHANGE_WORD: Record<ChangeStatus, string> = {
  hidden: 'Not started',
  typing: 'Being written',
  pending: 'Suggested',
  accepted: 'Accepted',
  rejected: 'Rejected',
};

const CHANGE_VARIANT = {
  hidden: 'secondary',
  typing: 'secondary',
  pending: 'warning',
  accepted: 'success',
  rejected: 'secondary',
} as const;

const COMMENT_WORD: Record<CommentStatus, string> = {
  hidden: 'Not started',
  typing: 'Being written',
  posted: 'Open',
  resolved: 'Resolved',
};

const COMMENT_VARIANT = {
  hidden: 'secondary',
  typing: 'secondary',
  posted: 'warning',
  resolved: 'success',
} as const;

function pendingPhraseOf(count: number) {
  if (count === 0) {
    return 'No suggestion to decide';
  }
  if (count === 1) {
    return '1 suggestion to decide';
  }
  return `${count} suggestions to decide`;
}

function pointersHiddenOf(view: DocView) {
  if (view === 'table') {
    return 'hidden';
  }
  return undefined;
}

type TableRow = {
  key: string;
  summary: string;
  author: AgentId;
  kind: string;
  word: string;
  variant: 'secondary' | 'warning' | 'success';
};

function rowsOf(state: DocState): TableRow[] {
  const rows: TableRow[] = [];
  for (const id of CHANGE_ORDER) {
    const status = state.changes[id];
    if (status !== 'hidden') {
      rows.push({
        key: id,
        summary: CHANGES[id].summary,
        author: CHANGES[id].author,
        kind: 'Edit',
        word: CHANGE_WORD[status],
        variant: CHANGE_VARIANT[status],
      });
    }
  }
  if (state.comment !== 'hidden') {
    rows.push({
      key: 'comment',
      summary: COMMENT.summary,
      author: COMMENT.author,
      kind: 'Comment',
      word: COMMENT_WORD[state.comment],
      variant: COMMENT_VARIANT[state.comment],
    });
  }
  return rows;
}

function ChangeTable({ rows }: { rows: TableRow[] }) {
  if (rows.length === 0) {
    return (
      <p className='text-muted-foreground py-10 text-center text-[13px]'>
        No change yet. Suggestions and comments are listed here as the agents
        make them.
      </p>
    );
  }
  return (
    <table className='w-full text-start text-[13px]'>
      <thead>
        <tr className='text-muted-foreground text-xs'>
          <th className='pb-2 text-start font-normal'>Change</th>
          <th className='pb-2 text-start font-normal'>Author</th>
          <th className='pb-2 text-end font-normal'>State</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.key} className='hairline-t border-border'>
            <td className='py-2.5 pe-3'>
              <span className='flex flex-col leading-snug'>
                {row.summary}
                <span className='text-muted-foreground text-xs'>
                  {row.kind}
                </span>
              </span>
            </td>
            <td className='py-2.5 pe-3'>
              <span className='flex items-center gap-2'>
                <AgentTile agent={AGENTS[row.author]} />
                <span className='hidden @md:inline'>
                  {AGENTS[row.author].name}
                </span>
                <span className='sr-only @md:hidden'>
                  {AGENTS[row.author].name}
                </span>
              </span>
            </td>
            <td className='py-2.5 text-end'>
              <Badge variant={row.variant}>
                <Swap swapKey={row.word}>{row.word}</Swap>
              </Badge>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function AgentReview05() {
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
  const pageRef = useRef<HTMLDivElement>(null);
  const pendingCount = pendingIdsOf(state).length;
  const pendingPhrase = pendingPhraseOf(pendingCount);
  const hasPending = pendingCount > 0;
  const message = spokenUnless(isAutoplaying, pendingPhrase);
  const canReplay = isFinished && !isAutoplaying;
  const isDoc = state.view === 'doc';
  const writerTarget = state.pointers.writer.target;
  const reviewerTarget = state.pointers.reviewer.target;

  useLayoutEffect(() => {
    const page = pageRef.current;
    if (!page) {
      return;
    }
    const targets = { writer: writerTarget, reviewer: reviewerTarget };
    const place = () => {
      const bounds = page.getBoundingClientRect();
      for (const agent of AGENT_ORDER) {
        const pointer = page.querySelector<HTMLElement>(
          `[data-pointer='${agent}']`
        );
        const paragraph = page.querySelector(
          `[data-paragraph='${targets[agent]}']`
        );
        if (pointer && paragraph) {
          const box = paragraph.getBoundingClientRect();
          const x = box.left - bounds.left + box.width * POINTER_REACH[agent];
          const y = box.top - bounds.top + 18;
          pointer.style.translate = `${x}px ${y}px`;
        }
      }
    };
    place();
    const observer = new ResizeObserver(place);
    observer.observe(page);
    return () => observer.disconnect();
  }, [writerTarget, reviewerTarget, isDoc]);

  return (
    <ClockGate isActive={isInView}>
      <div
        ref={ref}
        className='bg-background text-foreground @container min-h-dvh w-full p-3 @3xl:p-8'
      >
        <div className='mx-auto flex max-w-4xl flex-col gap-3'>
          <div className='flex flex-wrap items-center gap-x-3 gap-y-2'>
            <Segments
              label='View'
              value={state.view}
              segments={VIEW_SEGMENTS}
              onValueChange={(view) => act({ type: 'view', view })}
            />
            <span className='text-muted-foreground min-w-40 flex-1 text-xs'>
              <WordRoll text={pendingPhrase} value={pendingCount} />
            </span>
            <ReplayButton
              isShown={canReplay}
              onReplay={restart}
              label='Replay the edits'
            />
            <Button
              type='button'
              size='sm'
              disabled={!hasPending}
              onClick={() => act({ type: 'acceptAll' })}
              className={pressedSolidOf(pressed === 'accept-all')}
            >
              Accept all
            </Button>
          </div>

          <article
            ref={pageRef}
            aria-label={DOC_TITLE}
            className='bg-card hairline-ring ring-border dark:bg-foreground/[0.03] relative flex min-h-[26rem] flex-col gap-6 rounded-xl p-5 shadow-[0_1px_2px_rgb(0_0_0/0.04)] @3xl:p-10'
          >
            <header className='flex flex-col gap-2'>
              <h1 className='text-2xl font-semibold text-balance'>
                {DOC_TITLE}
              </h1>
              <ul
                aria-label='Agents in this document'
                className='flex flex-wrap items-center gap-x-4 gap-y-1'
              >
                {AGENT_ORDER.map((agent) => (
                  <li
                    key={agent}
                    className='text-muted-foreground flex items-center gap-2 text-xs'
                  >
                    <AgentTile agent={AGENTS[agent]} />
                    {AGENTS[agent].name}
                    <Swap swapKey={state.pointers[agent].action}>
                      {state.pointers[agent].action}
                    </Swap>
                  </li>
                ))}
                <li className='text-muted-foreground text-xs'>
                  Illustrative spend
                </li>
              </ul>
            </header>

            {isDoc &&
              PARAGRAPHS.map((paragraph) => (
                <ParagraphRow
                  key={paragraph.id}
                  paragraph={paragraph}
                  statuses={state.changes}
                  pressed={pressed}
                  isActive={isInView}
                  comment={state.comment}
                  onDecide={(id, decision) =>
                    act({ type: 'decided', id, decision })
                  }
                  onResolveComment={() =>
                    act({ type: 'comment', status: 'resolved' })
                  }
                />
              ))}
            {!isDoc && <ChangeTable rows={rowsOf(state)} />}

            <div className={cn(pointersHiddenOf(state.view))}>
              {AGENT_ORDER.map((agent) => (
                <AgentPointer
                  key={agent}
                  agent={AGENTS[agent]}
                  pointer={state.pointers[agent]}
                />
              ))}
            </div>
          </article>
        </div>
        <LiveRegion message={message} />
      </div>
    </ClockGate>
  );
}
