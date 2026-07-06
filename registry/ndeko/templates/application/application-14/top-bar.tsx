'use client';

import { memo } from 'react';

import { WordRoll } from '@/components/core/word-roll';
import { useNow } from '@/registry/ndeko/hooks/use-agent-run';
import {
  pressedQuietOf,
  pressedSolidOf,
} from '@/registry/ndeko/lib/demonstration';
import { EllipsisIcon, PlayIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import { CompanyMark } from '@/registry/ndeko/ui/company-mark';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/registry/ndeko/ui/dropdown-menu';
import { MorphButton, type MorphState } from '@/registry/ndeko/ui/morph-button';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';

import { BRAND } from './data';
import { countsOf } from './flow';
import type { Workflow } from './model';
import { NameField } from './name-field';
import type { SaveState } from './session';
import { countOf } from './words';

const MINUTE_MS = 60_000;

/** How often the line "Saved 3 min ago" looks at the time. */
const SAVED_TICK_MS = 15_000;

type SaveKind = 'saving' | 'unsaved' | 'saved';

const SAVE_DOT: Record<SaveKind, string> = {
  saving: 'bg-info animate-pulse',
  unsaved: 'bg-warning',
  saved: 'bg-success',
};

const RUN_LABELS: Record<MorphState, string> = {
  idle: 'Test run',
  busy: 'Running',
  done: 'Test run',
};

function saveKindOf(save: SaveState, hasUnsavedChanges: boolean): SaveKind {
  if (save.status === 'saving') {
    return 'saving';
  }
  if (hasUnsavedChanges) {
    return 'unsaved';
  }
  return 'saved';
}

/** The save the sample data starts from has no time of its own: it reads as two minutes old. */
function savedLineOf(at: number | null, now: number) {
  if (at === null) {
    return 'Saved 2 min ago';
  }
  const elapsed = now - at;
  const minutes = Math.floor(elapsed / MINUTE_MS);
  if (minutes < 1) {
    return 'Saved just now';
  }
  return `Saved ${minutes} min ago`;
}

function saveLineOf(kind: SaveKind, at: number | null, now: number) {
  if (kind === 'saving') {
    return 'Saving';
  }
  if (kind === 'unsaved') {
    return 'Unsaved changes';
  }
  return savedLineOf(at, now);
}

type SaveMarkProps = {
  save: SaveState;
  hasUnsavedChanges: boolean;
};

/** Only this line reads the clock, and only once a save of this session has a time to count from. */
function SaveMark({ save, hasUnsavedChanges }: SaveMarkProps) {
  const kind = saveKindOf(save, hasUnsavedChanges);
  const isCounting = kind === 'saved' && save.at !== null;
  const now = useNow(SAVED_TICK_MS, isCounting);
  const line = saveLineOf(kind, save.at, now);

  return (
    <span className='flex shrink-0 items-center gap-1.5'>
      <span
        aria-hidden='true'
        className={cn(
          'size-1.5 shrink-0 rounded-full transition-colors duration-200',
          SAVE_DOT[kind]
        )}
      />
      <WordRoll text={line} />
    </span>
  );
}

function countsLineOf(workflow: Workflow) {
  const counts = countsOf(workflow);
  const steps = countOf(counts.steps, 'step', 'steps');
  if (counts.branches === 0) {
    return steps;
  }
  const branches = countOf(counts.branches, 'branch', 'branches');
  return `${steps}, ${branches}`;
}

function publishWordOf(isLive: boolean) {
  if (isLive) {
    return 'Live';
  }
  return 'Draft';
}

const PUBLISH_WORDS = ['Draft', 'Live'];

function trackOf(isLive: boolean) {
  if (isLive) {
    return 'bg-success';
  }
  return 'bg-foreground/20';
}

function thumbOf(isLive: boolean) {
  if (isLive) {
    return 'translate-x-2';
  }
  return 'translate-x-0';
}

type PublishSwitchProps = {
  isLive: boolean;
  onPublish: (isLive: boolean) => void;
  className?: string;
};

/** A button that is a switch: it reads Draft, a press makes it read Live, and the tool bar confirms it in words. */
function PublishSwitch({ isLive, onPublish, className }: PublishSwitchProps) {
  const word = publishWordOf(isLive);

  return (
    <Button
      type='button'
      variant='outline'
      size='sm'
      role='switch'
      aria-checked={isLive}
      aria-label={`${word}, publish the workflow`}
      onClick={() => onPublish(!isLive)}
      className={className}
    >
      <span
        aria-hidden='true'
        className={cn(
          'flex h-3 w-5 shrink-0 items-center rounded-full p-0.5 transition-colors duration-200',
          trackOf(isLive)
        )}
      >
        <span
          className={cn(
            'bg-primary-foreground size-2 rounded-full transition-[translate] duration-200 ease-(--ease-out-strong)',
            thumbOf(isLive)
          )}
        />
      </span>
      <WordRoll text={word} labels={PUBLISH_WORDS} />
    </Button>
  );
}

function runStateOf(isRunning: boolean): MorphState {
  if (isRunning) {
    return 'busy';
  }
  return 'idle';
}

type TopBarProps = {
  workflow: Workflow;
  save: SaveState;
  hasUnsavedChanges: boolean;
  isLive: boolean;
  isRunning: boolean;
  pressed: string | null;
  canReplay: boolean;
  onReplay: () => void;
  onRename: (name: string) => void;
  onSave: () => void;
  onPublish: (isLive: boolean) => void;
  onRun: () => void;
};

/** Under 640px of its own width, Save and Publish go into one menu and the counts move to a line of their own. */
export const TopBar = memo(function TopBar({
  workflow,
  save,
  hasUnsavedChanges,
  isLive,
  isRunning,
  pressed,
  canReplay,
  onReplay,
  onRename,
  onSave,
  onPublish,
  onRun,
}: TopBarProps) {
  const isSaving = save.status === 'saving';
  const canSave = hasUnsavedChanges && !isSaving;
  const isSavePressed = pressed === 'save';

  return (
    <header className='@container shrink-0 px-3 py-2'>
      <div className='flex flex-wrap items-center gap-x-3 gap-y-1'>
        <div className='flex min-w-0 flex-1 items-center gap-2.5 @[40rem]:max-w-[45%] @[40rem]:flex-none'>
          <CompanyMark seed={BRAND.name} size='lg' title={BRAND.name} />
          <h1 className='flex min-w-0 text-sm'>
            <NameField
              value={workflow.name}
              label='Workflow name'
              action='Rename the workflow'
              onRename={onRename}
            />
          </h1>
        </div>
        <p className='text-muted-foreground order-last flex w-full min-w-0 items-center gap-3 ps-9.5 text-xs @[40rem]:order-none @[40rem]:w-auto @[40rem]:flex-1 @[40rem]:ps-0'>
          <span className='min-w-0 truncate tabular-nums'>
            <WordRoll text={countsLineOf(workflow)} />
          </span>
          <SaveMark save={save} hasUnsavedChanges={hasUnsavedChanges} />
        </p>
        <div className='flex shrink-0 items-center gap-1.5'>
          <ReplayButton
            isShown={canReplay}
            onReplay={onReplay}
            label='Replay'
          />
          <Button
            type='button'
            variant='outline'
            size='sm'
            disabled={!canSave}
            onClick={onSave}
            className={cn(
              'hidden @[40rem]:inline-flex',
              pressedQuietOf(isSavePressed)
            )}
          >
            Save
          </Button>
          <PublishSwitch
            isLive={isLive}
            onPublish={onPublish}
            className='hidden @[40rem]:inline-flex'
          />
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type='button'
                  variant='ghost'
                  size='icon-sm'
                  aria-label='More actions'
                  className={cn(
                    'text-muted-foreground @[40rem]:hidden',
                    pressedQuietOf(isSavePressed)
                  )}
                />
              }
            >
              <EllipsisIcon />
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-48'>
              <DropdownMenuItem disabled={!canSave} onClick={onSave}>
                Save
              </DropdownMenuItem>
              <DropdownMenuCheckboxItem
                checked={isLive}
                onCheckedChange={onPublish}
              >
                Live
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <MorphButton
            type='button'
            size='sm'
            state={runStateOf(isRunning)}
            labels={RUN_LABELS}
            idleIcon={<PlayIcon />}
            onClick={onRun}
            className={pressedSolidOf(pressed === 'run')}
          />
        </div>
      </div>
    </header>
  );
});
