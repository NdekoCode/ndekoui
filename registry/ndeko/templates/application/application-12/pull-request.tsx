'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useId } from 'react';

import { pressedSolidOf } from '@/registry/ndeko/lib/demonstration';
import {
  ArrowRightIcon,
  CircleXIcon,
  GitBranchIcon,
} from '@/registry/ndeko/lib/icons';
import { fadePresence } from '@/registry/ndeko/lib/motion-presets';
import { countOf } from '@/registry/ndeko/lib/words';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Badge } from '@/registry/ndeko/ui/badge';
import { BrandTile } from '@/registry/ndeko/ui/brand-tile';
import { Button } from '@/registry/ndeko/ui/button';
import { Swap } from '@/registry/ndeko/ui/chat-motion';
import { DrawnCheck } from '@/registry/ndeko/ui/drawn-check';
import { Kbd } from '@/registry/ndeko/ui/kbd';
import { Spinner } from '@/registry/ndeko/ui/spinner';

import {
  DECLINED_LINE,
  FILES,
  HUNKS,
  OPENED_LINE,
  PULL_REQUEST,
  REPOSITORY,
  type RepoFile,
} from './data';
import { ChangeCounts, ModifiedTile } from './diff-view';
import type { Decision, Stage } from './session';

function isChanged(file: RepoFile) {
  return HUNKS.some((hunk) => hunk.fileId === file.id);
}

const CHANGED_FILES = FILES.filter(isChanged);

function ChangedFile({ file }: { file: RepoFile }) {
  const hunks = HUNKS.filter((hunk) => hunk.fileId === file.id);

  return (
    <li className='flex items-center gap-2'>
      <ModifiedTile />
      <span className='min-w-0 flex-1 truncate font-mono text-xs'>
        {file.path}
      </span>
      <ChangeCounts hunks={hunks} />
    </li>
  );
}

type RequestBodyProps = {
  pressed: string | null;
  onDecide: (decision: Decision) => void;
};

function RequestBody({ pressed, onDecide }: RequestBodyProps) {
  const titleId = useId();
  const keysId = useId();

  function allow() {
    onDecide('approved');
  }

  function deny() {
    onDecide('denied');
  }

  function decideFromKeys(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      deny();
      return;
    }
    const isOnCard = event.target === event.currentTarget;
    const isEnter = event.key === 'Enter';
    if (isEnter && isOnCard) {
      event.preventDefault();
      allow();
    }
  }

  return (
    <div
      role='group'
      tabIndex={0}
      aria-labelledby={titleId}
      aria-describedby={keysId}
      onKeyDown={decideFromKeys}
      className='focus-visible:ring-ring/25 flex flex-col gap-3 rounded-xl p-3 outline-none focus-visible:ring-[3px] focus-visible:ring-inset'
    >
      <div className='flex items-center gap-2.5'>
        <BrandTile brand='github' size='lg' title='GitHub' />
        <div className='flex min-w-0 flex-1 flex-col leading-tight'>
          <h2 id={titleId} className='text-sm font-medium'>
            Open a pull request
          </h2>
          <span className='text-muted-foreground truncate text-xs'>
            {PULL_REQUEST.title}
          </span>
        </div>
        <Badge variant='warning' className='hidden @md:inline-flex'>
          Waiting on you
        </Badge>
      </div>
      <p className='flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1 font-mono text-xs'>
        <GitBranchIcon className='text-muted-foreground size-3.5 shrink-0' />
        <span className='min-w-0 truncate'>{REPOSITORY.branch}</span>
        <ArrowRightIcon className='text-muted-foreground size-3 shrink-0' />
        <span className='sr-only'>into</span>
        <span>{REPOSITORY.base}</span>
      </p>
      <div className='bg-foreground/[0.04] flex flex-col gap-2 rounded-lg p-2.5'>
        <span className='text-muted-foreground text-xs'>
          {countOf(CHANGED_FILES.length, 'file')} changed
        </span>
        <ul aria-label='Files changed' className='flex flex-col gap-1.5'>
          {CHANGED_FILES.map((file) => (
            <ChangedFile key={file.id} file={file} />
          ))}
        </ul>
      </div>
      <div className='flex flex-wrap items-center gap-2'>
        <Button
          type='button'
          size='sm'
          onClick={allow}
          className={pressedSolidOf(pressed === 'allow')}
        >
          Allow
          <Kbd className='ms-0.5'>Enter</Kbd>
        </Button>
        <Button type='button' size='sm' variant='outline' onClick={deny}>
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

function ResultGlyph({ stage }: { stage: Stage }) {
  if (stage === 'opening') {
    return <Spinner aria-hidden='true' />;
  }
  if (stage === 'declined') {
    return <CircleXIcon className='text-muted-foreground size-4 shrink-0' />;
  }
  return <DrawnCheck tone='success' entrance='draw' />;
}

function resultLineOf(stage: Stage) {
  if (stage === 'opening') {
    return 'Opening the pull request';
  }
  if (stage === 'declined') {
    return DECLINED_LINE;
  }
  return OPENED_LINE;
}

function ResultLine({ stage }: { stage: Stage }) {
  return (
    <div className='flex min-h-11 items-start gap-2.5 p-3 text-[13px] leading-5'>
      <Swap swapKey={stage} className='mt-px'>
        <ResultGlyph stage={stage} />
      </Swap>
      <p
        key={stage}
        className='min-w-0 transition-opacity duration-300 starting:opacity-0'
      >
        {resultLineOf(stage)}
      </p>
    </div>
  );
}

function viewKeyOf(isAsking: boolean) {
  if (isAsking) {
    return 'request';
  }
  return 'result';
}

type PullRequestProps = RequestBodyProps & {
  stage: Stage;
};

/** The request resizes into one line that keeps a trace of what the person decided. */
export function PullRequest({ stage, pressed, onDecide }: PullRequestProps) {
  const fade = fadePresence();
  const isAsking = stage === 'asking';

  return (
    <section
      data-request
      tabIndex={-1}
      aria-label='Request to open a pull request'
      className='bg-card hairline-ring ring-border dark:bg-foreground/[0.04] overflow-hidden rounded-xl shadow-[0_1px_2px_rgb(0_0_0/0.04)] transition-opacity duration-300 outline-none starting:opacity-0'
    >
      <AnimatedSize>
        <AnimatePresence initial={false} mode='popLayout'>
          <motion.div key={viewKeyOf(isAsking)} {...fade}>
            {isAsking && <RequestBody pressed={pressed} onDecide={onDecide} />}
            {!isAsking && <ResultLine stage={stage} />}
          </motion.div>
        </AnimatePresence>
      </AnimatedSize>
    </section>
  );
}
