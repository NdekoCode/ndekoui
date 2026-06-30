'use client';

import {
  ArrowLeftIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CopyIcon,
  EllipsisIcon,
  GitForkIcon,
  LinkIcon,
  StarIcon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Button } from '@/registry/ndeko/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/registry/ndeko/ui/dropdown-menu';
import { Kbd } from '@/registry/ndeko/ui/kbd';
import {
  TOOLTIP_GLIDE_CLOSE_DELAY,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  useTooltipHandle,
} from '@/registry/ndeko/ui/tooltip';

import type { TaskDetail } from './data';
import { currentUser, keyOf, taskUrlOf } from './detail-model';
import { Swap } from './motion-parts';
import { IssueTypeGem } from './task-glyphs';
import { copyWithToast, useCopied } from './use-copied';

type TaskStepHint = { label: string; shortcut: string };

const PREVIOUS_TASK_HINT: TaskStepHint = {
  label: 'Previous task',
  shortcut: 'K',
};

const NEXT_TASK_HINT: TaskStepHint = { label: 'Next task', shortcut: 'J' };

function TaskStepHintLabel({ hint }: { hint: TaskStepHint | undefined }) {
  if (!hint) {
    return null;
  }
  return (
    <>
      {hint.label} <Kbd>{hint.shortcut}</Kbd>
    </>
  );
}

function branchNameOf(task: TaskDetail) {
  const owner = currentUser().id;
  const key = keyOf(task.number).toLowerCase();
  const words = task.title.toLowerCase().match(/[a-z0-9]+/g) ?? [];
  const slug = words.slice(0, 5).join('-');
  return `${owner}/${key}-${slug}`;
}

function NumberLabel({
  isCopied,
  label,
}: {
  isCopied: boolean;
  label: string;
}) {
  return (
    <AnimatedSize axis='width'>
      <Swap swapKey={String(isCopied)}>
        {isCopied && <span>Copied</span>}
        {!isCopied && <span className='tabular-nums'>{label}</span>}
      </Swap>
    </AnimatedSize>
  );
}

function favouriteLabelOf(isFavourite: boolean) {
  if (isFavourite) {
    return 'Remove from favourites';
  }
  return 'Add to favourites';
}

function starStrokeOf(isFavourite: boolean) {
  if (isFavourite) {
    return 2.25;
  }
  return 1.75;
}

function linkLabelOf(isCopied: boolean) {
  if (isCopied) {
    return 'Link copied';
  }
  return 'Copy link';
}

type PageBandProps = {
  task: TaskDetail;
  position: number;
  total: number;
  isFavourite: boolean;
  onToggleFavourite: () => void;
  onPrevious: () => void;
  onNext: () => void;
};

export function PageBand({
  task,
  position,
  total,
  isFavourite,
  onToggleFavourite,
  onPrevious,
  onNext,
}: PageBandProps) {
  const numberCopy = useCopied();
  const linkCopy = useCopied();
  const key = keyOf(task.number);
  const link = taskUrlOf(task.number);
  const isFirst = position <= 1;
  const isLast = position >= total;
  const stepHint = useTooltipHandle<TaskStepHint>();

  return (
    <div className='hairline-b border-border flex h-11 shrink-0 items-center gap-1 px-2 sm:px-3'>
      <Button
        variant='ghost'
        size='icon-sm'
        aria-label='Back to tasks'
        nativeButton={false}
        render={<a href='#' />}
      >
        <ArrowLeftIcon />
      </Button>
      <IssueTypeGem type={task.type} className='ms-1' />
      <Button
        variant='ghost'
        size='sm'
        aria-label={`Copy ${key}`}
        onClick={() => numberCopy.copy(key)}
        className='px-2 text-[13px]'
      >
        <NumberLabel isCopied={numberCopy.isCopied} label={key} />
      </Button>
      {task.parent && (
        <span className='text-muted-foreground hidden min-w-0 items-center gap-1.5 text-[13px] @2xl:flex'>
          <span aria-hidden='true'>/</span>
          <span className='shrink-0 tabular-nums'>
            {keyOf(task.parent.number)}
          </span>
          <span className='truncate'>{task.parent.title}</span>
        </span>
      )}
      <div className='ms-auto flex shrink-0 items-center gap-1'>
        <span className='text-muted-foreground me-1 text-xs tabular-nums'>
          {position} / {total}
        </span>
        <TooltipTrigger
          handle={stepHint}
          payload={PREVIOUS_TASK_HINT}
          closeDelay={TOOLTIP_GLIDE_CLOSE_DELAY}
          render={
            <Button
              variant='ghost'
              size='icon-sm'
              aria-label='Previous task'
              disabled={isFirst}
              onClick={onPrevious}
            />
          }
        >
          <ChevronUpIcon />
        </TooltipTrigger>
        <TooltipTrigger
          handle={stepHint}
          payload={NEXT_TASK_HINT}
          closeDelay={TOOLTIP_GLIDE_CLOSE_DELAY}
          render={
            <Button
              variant='ghost'
              size='icon-sm'
              aria-label='Next task'
              disabled={isLast}
              onClick={onNext}
            />
          }
        >
          <ChevronDownIcon />
        </TooltipTrigger>
        <Tooltip handle={stepHint}>
          {({ payload }) => (
            <TooltipContent glide>
              <TaskStepHintLabel hint={payload} />
            </TooltipContent>
          )}
        </Tooltip>
        <Button
          variant='ghost'
          size='icon-sm'
          aria-label={favouriteLabelOf(isFavourite)}
          aria-pressed={isFavourite}
          onClick={onToggleFavourite}
        >
          <Swap swapKey={String(isFavourite)}>
            <StarIcon
              className={cn(isFavourite && 'text-warning')}
              strokeWidth={starStrokeOf(isFavourite)}
            />
          </Swap>
        </Button>
        <Button
          variant='ghost'
          size='icon-sm'
          aria-label={linkLabelOf(linkCopy.isCopied)}
          onClick={() => linkCopy.copy(link)}
        >
          <Swap swapKey={String(linkCopy.isCopied)}>
            {linkCopy.isCopied && (
              <CheckIcon className='text-success-foreground' />
            )}
            {!linkCopy.isCopied && <LinkIcon />}
          </Swap>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant='ghost'
                size='icon-sm'
                aria-label='More actions'
              />
            }
          >
            <EllipsisIcon />
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end' className='w-52'>
            <DropdownMenuItem
              onClick={() => copyWithToast(key, `${key} copied`)}
            >
              <CopyIcon />
              Copy ID
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => copyWithToast(link, 'Link copied')}
            >
              <LinkIcon />
              Copy link
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                copyWithToast(branchNameOf(task), 'Branch name copied')
              }
            >
              <GitForkIcon />
              Copy branch name
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
