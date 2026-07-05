'use client';

import { useRef, useState } from 'react';

import { useSession } from '@/registry/ndeko/hooks/use-session';
import { useTimeouts } from '@/registry/ndeko/hooks/use-timeouts';
import {
  pressedSolidOf,
  spokenUnless,
} from '@/registry/ndeko/lib/demonstration';
import { ArrowUpIcon, CodeIcon, FeatherIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import { ClockGate } from '@/registry/ndeko/ui/live-duration';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';

import { ArtifactPanel } from './artifact-panel';
import { FILE_NAME, FIRST_REPLY, SECOND_REPLY } from './data';
import {
  APPLY_MS,
  canSendAt,
  INITIAL,
  LOOP_AFTER_MS,
  reducer,
  RESTING,
  SCRIPT,
  type ArtifactView,
  type Stage,
  type Version,
} from './session';
import { BottomSheet, DEFAULT_SPLIT, ResizeHandle } from './split';

const SESSION = {
  reducer,
  initial: INITIAL,
  resting: RESTING,
  script: SCRIPT,
  loopAfter: LOOP_AFTER_MS,
};

function placeholderOf(stage: Stage) {
  if (stage === 0) {
    return 'Ask for a section of your page';
  }
  if (stage === 2) {
    return 'Ask for a change';
  }
  if (stage === 4) {
    return 'Replay to run the demonstration again';
  }
  return 'The assistant is writing';
}

function announcementOf(stage: Stage) {
  if (stage === 2) {
    return 'The first version is ready in the artifact.';
  }
  if (stage === 4) {
    return 'The second version is ready. Changes shows what moved.';
  }
  return '';
}

function isSendKey(event: React.KeyboardEvent<HTMLTextAreaElement>) {
  const isPlainEnter = event.key === 'Enter' && !event.shiftKey;
  return isPlainEnter && !event.nativeEvent.isComposing;
}

function AssistantTile() {
  return (
    <span
      aria-hidden='true'
      className='gem-plate inline-flex size-7 shrink-0 items-center justify-center rounded-lg [--gem:var(--primary)]'
    >
      <FeatherIcon className='size-4' />
    </span>
  );
}

function PersonMessage({ text }: { text: string }) {
  return (
    <p className='bg-foreground/[0.06] max-w-[85%] self-end rounded-2xl rounded-ee-md px-3.5 py-2 text-sm leading-relaxed'>
      {text}
    </p>
  );
}

function WorkingLine({ word }: { word: string }) {
  return (
    <p className='text-muted-foreground flex h-7 items-center gap-2 text-[13px]'>
      <span
        aria-hidden='true'
        className='bg-primary size-1.5 animate-pulse rounded-full'
      />
      {word}
    </p>
  );
}

type VersionCardProps = {
  version: Version;
  isCurrent: boolean;
  onOpen: (version: Version) => void;
};

function currentCardOf(isCurrent: boolean) {
  if (isCurrent) {
    return 'ring-primary/50';
  }
  return 'ring-foreground/12';
}

function VersionCard({ version, isCurrent, onOpen }: VersionCardProps) {
  return (
    <button
      type='button'
      aria-pressed={isCurrent}
      onClick={() => onOpen(version)}
      className={cn(
        'bg-card hairline-ring hover:bg-foreground/[0.03] focus-visible:ring-ring dark:bg-foreground/[0.04] flex h-11 w-fit max-w-full cursor-pointer items-center gap-2.5 rounded-xl ps-2 pe-3 text-start shadow-[0_1px_2px_rgb(0_0_0/0.04)] transition-[background-color,box-shadow] duration-150 outline-none focus-visible:ring-2 active:scale-[0.97]',
        currentCardOf(isCurrent)
      )}
    >
      <span
        aria-hidden='true'
        className='keycap-3d text-muted-foreground inline-flex size-7 shrink-0 items-center justify-center rounded-md'
      >
        <CodeIcon className='size-3.5' />
      </span>
      <span className='flex min-w-0 flex-col leading-tight'>
        <span className='truncate font-mono text-xs font-medium'>
          {FILE_NAME}
        </span>
        <span className='text-muted-foreground text-xs'>Version {version}</span>
      </span>
    </button>
  );
}

type ReplyProps = {
  isWorking: boolean;
  workingWord: string;
  text: string;
  version: Version;
  currentVersion: Version;
  onOpen: (version: Version) => void;
};

function Reply({
  isWorking,
  workingWord,
  text,
  version,
  currentVersion,
  onOpen,
}: ReplyProps) {
  return (
    <div className='flex items-start gap-2.5'>
      <AssistantTile />
      {isWorking && <WorkingLine word={workingWord} />}
      {!isWorking && (
        <div className='flex min-w-0 flex-1 flex-col gap-2.5 pt-1'>
          <p className='text-sm leading-relaxed transition-opacity duration-300 starting:opacity-0'>
            {text}
          </p>
          <VersionCard
            version={version}
            isCurrent={version === currentVersion}
            onOpen={onOpen}
          />
        </div>
      )}
    </div>
  );
}

export default function AgentChat02() {
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
  const [split, setSplit] = useState(DEFAULT_SPLIT);
  const layoutRef = useRef<HTMLDivElement>(null);
  const { schedule } = useTimeouts();
  const { stage } = state;
  const [firstAsk, secondAsk] = state.asks;
  const canSend = canSendAt(stage);
  const canReplay = isFinished && !isAutoplaying;
  const announcement = announcementOf(stage);
  const message = spokenUnless(isAutoplaying, announcement);
  const splitStyle = { '--split': `${split}%` } as React.CSSProperties;

  function changeSplit(next: number) {
    layoutRef.current?.style.setProperty('--split', `${next}%`);
    setSplit(next);
  }

  function send() {
    act({ type: 'sent' });
  }

  function handleKeys(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (!isSendKey(event)) {
      return;
    }
    event.preventDefault();
    send();
  }

  function openVersion(version: Version) {
    act({ type: 'version', version });
    act({ type: 'sheet', isOpen: true });
  }

  function apply() {
    act({ type: 'applying' });
    schedule(() => act({ type: 'applied' }), APPLY_MS);
  }

  function closeSheet() {
    act({ type: 'sheet', isOpen: false });
  }

  const panel = {
    stage,
    version: state.version,
    view: state.view,
    apply: state.apply,
    appliedVersion: state.appliedVersion,
    pressed,
    isActive: isInView,
    onVersionChange: (version: Version) => act({ type: 'version', version }),
    onViewChange: (view: ArtifactView) => act({ type: 'view', view }),
    onApply: apply,
  };

  return (
    <ClockGate isActive={isInView}>
      <div
        ref={ref}
        className='bg-background text-foreground @container relative h-dvh min-h-[36rem] w-full overflow-hidden'
      >
        <div
          ref={layoutRef}
          style={splitStyle}
          className='mx-auto flex h-full max-w-6xl p-3 @3xl:p-4'
        >
          <section
            aria-label='Conversation'
            className='flex w-full min-w-0 shrink-0 flex-col gap-3 @3xl:w-(--split)'
          >
            <header className='flex h-9 shrink-0 items-center gap-2.5'>
              <AssistantTile />
              <div className='flex min-w-0 flex-1 flex-col leading-tight'>
                <h2 className='truncate text-sm font-medium'>
                  Tallis landing page
                </h2>
                <span className='text-muted-foreground text-xs'>Assistant</span>
              </div>
              <ReplayButton isShown={canReplay} onReplay={restart} />
            </header>

            <div className='flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto py-2'>
              {stage === 0 && (
                <p className='text-muted-foreground m-auto max-w-xs text-center text-[13px]'>
                  Ask for a section. The code is written in the artifact, where
                  you can compare versions and apply one.
                </p>
              )}
              {firstAsk && <PersonMessage text={firstAsk} />}
              {stage >= 1 && (
                <Reply
                  isWorking={stage === 1}
                  workingWord={`Writing ${FILE_NAME}`}
                  text={FIRST_REPLY}
                  version={1}
                  currentVersion={state.version}
                  onOpen={openVersion}
                />
              )}
              {secondAsk && <PersonMessage text={secondAsk} />}
              {stage >= 3 && (
                <Reply
                  isWorking={stage === 3}
                  workingWord='Revising two places'
                  text={SECOND_REPLY}
                  version={2}
                  currentVersion={state.version}
                  onOpen={openVersion}
                />
              )}
            </div>

            <div className='bg-card hairline-ring ring-foreground/12 has-[textarea:focus-visible]:ring-ring/25 dark:bg-foreground/[0.04] dark:ring-foreground/15 flex items-end gap-2 rounded-2xl p-2 shadow-[0_1px_2px_rgb(0_0_0/0.05)] transition-[box-shadow] duration-150 has-[textarea:focus-visible]:ring-[3px]'>
              <textarea
                value={state.draft}
                rows={2}
                aria-label='Message to the assistant'
                placeholder={placeholderOf(stage)}
                onChange={(event) =>
                  act({ type: 'typed', text: event.target.value })
                }
                onKeyDown={handleKeys}
                className='placeholder:text-muted-foreground/75 min-h-12 flex-1 resize-none bg-transparent px-1.5 py-1 text-base leading-normal outline-none md:text-[13px]'
              />
              <Button
                type='button'
                size='icon'
                aria-label='Send the message'
                disabled={!canSend}
                onClick={send}
                className={pressedSolidOf(pressed === 'send')}
              >
                <ArrowUpIcon />
              </Button>
            </div>
          </section>

          <ResizeHandle
            split={split}
            containerRef={layoutRef}
            onSplitChange={changeSplit}
          />

          <aside
            aria-label='Artifact'
            className='bg-card hairline-ring ring-border hidden min-w-0 flex-1 rounded-xl p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)] @3xl:flex'
          >
            <ArtifactPanel {...panel} className='w-full' />
          </aside>
        </div>

        <BottomSheet
          isOpen={state.isSheetOpen}
          label='Artifact'
          onClose={closeSheet}
        >
          <ArtifactPanel {...panel} className='flex-1' />
        </BottomSheet>
        <LiveRegion message={message} />
      </div>
    </ClockGate>
  );
}
