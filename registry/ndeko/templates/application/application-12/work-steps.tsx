'use client';

import { useId, useState } from 'react';

import {
  CheckIcon,
  ChevronDownIcon,
  FileIcon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { countOf } from '@/registry/ndeko/lib/words';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Button } from '@/registry/ndeko/ui/button';
import { CallStatusMark } from '@/registry/ndeko/ui/call-status';
import { Fold, Swap } from '@/registry/ndeko/ui/chat-motion';
import { LiveDuration } from '@/registry/ndeko/ui/live-duration';

import {
  CAUSE_FILE,
  FILES,
  HUNKS,
  stepOf,
  type Hunk,
  type PanelTab,
  type RepoFile,
  type WorkStep,
} from './data';
import { ChangeCounts, ModifiedTile } from './diff-view';
import type { StepRun } from './session';

const SHOW_LABEL: Record<PanelTab, string> = {
  diff: 'Open the diff',
  tests: 'Open the tests',
  preview: 'Open the preview',
};

type FileMark = 'read' | 'cause' | 'modified';

/** A file wears the strongest thing known about it: changed, then where the bug is, then read. */
function markOf(
  file: RepoFile,
  hunks: Hunk[],
  isCauseKnown: boolean
): FileMark {
  if (hunks.length > 0) {
    return 'modified';
  }
  const isCause = file.id === CAUSE_FILE;
  if (isCause && isCauseKnown) {
    return 'cause';
  }
  return 'read';
}

function pathPartsOf(path: string) {
  const slash = path.lastIndexOf('/');
  const nameStart = slash + 1;
  const folder = path.slice(0, nameStart);
  const name = path.slice(nameStart);
  return { folder, name };
}

type FileRowProps = {
  file: RepoFile;
  hunksDone: number;
  isCauseKnown: boolean;
};

function FileRow({ file, hunksDone, isCauseKnown }: FileRowProps) {
  const written = HUNKS.slice(0, hunksDone);
  const hunks = written.filter((hunk) => hunk.fileId === file.id);
  const mark = markOf(file, hunks, isCauseKnown);
  const { folder, name } = pathPartsOf(file.path);

  return (
    <li className='flex items-start gap-2 py-1 transition-[opacity,translate] duration-300 ease-(--ease-out-strong) starting:translate-y-1 starting:opacity-0'>
      <FileIcon className='text-muted-foreground mt-0.5 size-3.5 shrink-0' />
      <span className='flex min-w-0 flex-1 flex-col'>
        <span className='truncate font-mono text-xs'>
          <span className='text-muted-foreground'>{folder}</span>
          {name}
        </span>
        <span className='text-muted-foreground text-xs leading-4'>
          {file.finding}
        </span>
      </span>
      <Swap swapKey={mark} className='h-5 shrink-0'>
        {mark === 'read' && (
          <CheckIcon className='text-muted-foreground size-3.5' />
        )}
        {mark === 'read' && <span className='sr-only'>Read</span>}
        {mark === 'cause' && <Badge variant='warning'>Cause</Badge>}
        {mark === 'modified' && (
          <span className='flex items-center gap-1.5'>
            <ChangeCounts hunks={hunks} />
            <ModifiedTile />
          </span>
        )}
      </Swap>
    </li>
  );
}

function chevronTurnOf(isOpen: boolean) {
  if (isOpen) {
    return 'rotate-180';
  }
  return 'rotate-0';
}

type FileListProps = {
  filesRead: number;
  hunksDone: number;
  isCauseKnown: boolean;
  isWorking: boolean;
};

/** Open while the agent works, so each mark is seen as it changes, then folded into one line. */
function FileList({
  filesRead,
  hunksDone,
  isCauseKnown,
  isWorking,
}: FileListProps) {
  const [openChoice, setOpenChoice] = useState<boolean | null>(null);
  const [wasWorking, setWasWorking] = useState(isWorking);
  const listId = useId();
  const files = FILES.slice(0, filesRead);

  if (wasWorking !== isWorking) {
    setWasWorking(isWorking);
    setOpenChoice(null);
  }

  const isOpen = openChoice ?? isWorking;

  function toggle() {
    setOpenChoice(!isOpen);
  }

  return (
    <div className='bg-foreground/[0.03] dark:bg-foreground/[0.05] mt-1.5 rounded-lg p-1'>
      <button
        type='button'
        aria-expanded={isOpen}
        aria-controls={listId}
        onClick={toggle}
        className='hover:bg-foreground/[0.04] focus-visible:ring-ring/25 text-muted-foreground flex h-6 w-full cursor-pointer items-center gap-1.5 rounded-md px-1.5 text-start text-xs outline-none focus-visible:ring-[3px]'
      >
        <span className='min-w-0 flex-1 truncate tabular-nums'>
          {countOf(filesRead, 'file')} read
        </span>
        <ChevronDownIcon
          className={cn(
            'size-3.5 shrink-0 transition-transform duration-200 ease-(--ease-out-strong)',
            chevronTurnOf(isOpen)
          )}
        />
      </button>
      <Fold open={isOpen} id={listId}>
        <ul aria-label='Files read' className='flex flex-col px-1.5 pb-0.5'>
          {files.map((file) => (
            <FileRow
              key={file.id}
              file={file}
              hunksDone={hunksDone}
              isCauseKnown={isCauseKnown}
            />
          ))}
        </ul>
      </Fold>
    </div>
  );
}

function sublineOf(step: WorkStep, run: StepRun) {
  if (run.status === 'done') {
    return step.doneSummary;
  }
  return step.detail;
}

type StepRowProps = FileListProps & {
  run: StepRun;
  isLast: boolean;
  onShow: (tab: PanelTab) => void;
};

function StepRow({ run, isLast, onShow, ...fileList }: StepRowProps) {
  const step = stepOf(run.id);
  const isRunning = run.status === 'running';
  const showsFiles = run.id === 'read' && fileList.filesRead > 0;
  const shownInTab = step.shownInTab;

  return (
    <li className='relative flex gap-2.5 pb-3 transition-opacity duration-300 last:pb-0 starting:opacity-0'>
      {!isLast && (
        <span
          aria-hidden='true'
          className='bg-border absolute start-2 top-6 bottom-1 w-px'
        />
      )}
      <span className='flex h-5 shrink-0 items-center'>
        <CallStatusMark status={run.status} />
      </span>
      <div className='flex min-w-0 flex-1 flex-col'>
        <p className='flex h-5 items-center gap-2 text-[13px]'>
          <span className='min-w-0 flex-1 truncate font-medium'>
            {step.title}
          </span>
          <LiveDuration
            item={run}
            isRunning={isRunning}
            className='text-muted-foreground w-10 shrink-0 text-end text-xs'
          />
        </p>
        <div className='flex items-start gap-2'>
          <p
            key={run.status}
            className='text-muted-foreground min-w-0 flex-1 text-xs leading-5 transition-opacity duration-300 starting:opacity-0'
          >
            {sublineOf(step, run)}
          </p>
          {shownInTab && (
            <Button
              type='button'
              variant='ghost'
              size='sm'
              onClick={() => onShow(shownInTab)}
              className='text-muted-foreground -me-2 h-6 shrink-0 px-2'
            >
              {SHOW_LABEL[shownInTab]}
            </Button>
          )}
        </div>
        {showsFiles && <FileList {...fileList} />}
      </div>
    </li>
  );
}

type WorkStepsProps = {
  steps: StepRun[];
  filesRead: number;
  hunksDone: number;
  isWorking: boolean;
  onShow: (tab: PanelTab) => void;
};

/** Steps arrive at the end of the list, where nothing sits under them yet, so a fade is enough. */
export function WorkSteps({
  steps,
  filesRead,
  hunksDone,
  isWorking,
  onShow,
}: WorkStepsProps) {
  const lastIndex = steps.length - 1;
  const readStep = steps.find((run) => run.id === 'read');
  const isCauseKnown = readStep?.status === 'done';

  return (
    <ol aria-label='What the agent did' className='flex flex-col'>
      {steps.map((run, index) => (
        <StepRow
          key={run.id}
          run={run}
          isLast={index === lastIndex}
          filesRead={filesRead}
          hunksDone={hunksDone}
          isCauseKnown={isCauseKnown}
          isWorking={isWorking}
          onShow={onShow}
        />
      ))}
    </ol>
  );
}
