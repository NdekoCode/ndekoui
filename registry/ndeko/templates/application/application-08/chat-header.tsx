'use client';

import { ListChecksIcon, PanelLeftIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';

import type { ModelId } from './data';
import { ModelPicker } from './model-picker';
import type { Stage } from './session';

const DOT_TONE: Partial<Record<Stage, string>> = {
  thinking: 'bg-info animate-pulse',
  working: 'bg-info animate-pulse',
  answering: 'bg-info animate-pulse',
  asking: 'bg-warning',
};

function dotToneOf(stage: Stage) {
  return DOT_TONE[stage];
}

function sidebarLabelOf(hasSheet: boolean, isShown: boolean) {
  if (hasSheet) {
    return 'Open the chats';
  }
  if (isShown) {
    return 'Hide the chats';
  }
  return 'Show the chats';
}

function expandedOf(hasSheet: boolean, isShown: boolean) {
  if (hasSheet) {
    return undefined;
  }
  return isShown;
}

function popupOf(hasSheet: boolean) {
  if (hasSheet) {
    return 'dialog';
  }
  return undefined;
}

function detailsPressedOf(hasSheet: boolean, isShown: boolean) {
  if (hasSheet) {
    return undefined;
  }
  return isShown;
}

function detailsToneOf(isShown: boolean) {
  if (isShown) {
    return 'bg-foreground/[0.07] text-foreground';
  }
  return 'text-muted-foreground';
}

type ChatHeaderProps = {
  title: string;
  stage: Stage;
  model: ModelId;
  hasSidebarSheet: boolean;
  hasDetailsSheet: boolean;
  isSidebarShown: boolean;
  isDetailsShown: boolean;
  canReplay: boolean;
  onToggleSidebar: () => void;
  onToggleDetails: () => void;
  onModelChange: (model: ModelId) => void;
  onReplay: () => void;
};

export function ChatHeader({
  title,
  stage,
  model,
  hasSidebarSheet,
  hasDetailsSheet,
  isSidebarShown,
  isDetailsShown,
  canReplay,
  onToggleSidebar,
  onToggleDetails,
  onModelChange,
  onReplay,
}: ChatHeaderProps) {
  const dotTone = dotToneOf(stage);
  const hasDot = dotTone !== undefined;

  return (
    <header className='flex h-14 shrink-0 items-center gap-1.5 px-3 @xl:px-4'>
      <Button
        type='button'
        variant='ghost'
        size='icon-sm'
        data-sidebar-toggle
        aria-label={sidebarLabelOf(hasSidebarSheet, isSidebarShown)}
        aria-expanded={expandedOf(hasSidebarSheet, isSidebarShown)}
        aria-haspopup={popupOf(hasSidebarSheet)}
        onClick={onToggleSidebar}
        className='text-muted-foreground'
      >
        <PanelLeftIcon />
      </Button>
      <h1 className='min-w-0 flex-1 truncate ps-1 text-sm font-medium'>
        {title}
      </h1>
      <ReplayButton isShown={canReplay} onReplay={onReplay} label='Replay' />
      <ModelPicker value={model} onValueChange={onModelChange} />
      <Button
        type='button'
        variant='ghost'
        size='sm'
        data-details-toggle
        aria-pressed={detailsPressedOf(hasDetailsSheet, isDetailsShown)}
        aria-haspopup={popupOf(hasDetailsSheet)}
        onClick={onToggleDetails}
        className={cn('gap-1.5 px-2', detailsToneOf(isDetailsShown))}
      >
        <ListChecksIcon />
        <span className='sr-only @2xl:not-sr-only'>Run details</span>
        {hasDot && (
          <span
            aria-hidden='true'
            className={cn('size-1.5 shrink-0 rounded-full', dotTone)}
          />
        )}
      </Button>
    </header>
  );
}
