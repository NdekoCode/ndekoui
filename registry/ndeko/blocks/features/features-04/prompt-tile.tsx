'use client';

import { pressedSolidOf } from '@/registry/ndeko/lib/demonstration';
import {
  ArrowUpIcon,
  CircleDashedIcon,
  LoaderIcon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import { Swap } from '@/registry/ndeko/ui/chat-motion';
import { DrawnCheck } from '@/registry/ndeko/ui/drawn-check';
import { Textarea } from '@/registry/ndeko/ui/textarea';

import { PLAN_STEPS, PROMPT, TILES } from './data';
import type { TrayStatus } from './session';
import { Tile } from './tile';

const TRAY_LINE: Record<TrayStatus, string> = {
  idle: 'Ready for a prompt',
  reading: 'Reading 3 files',
  planned: `Plan ready, ${PLAN_STEPS.length} steps`,
};

function TrayGlyph({ tray }: { tray: TrayStatus }) {
  if (tray === 'planned') {
    return <DrawnCheck tone='success' entrance='draw' />;
  }
  if (tray === 'reading') {
    return <LoaderIcon className='text-info-foreground size-4 animate-spin' />;
  }
  return <CircleDashedIcon className='size-4' />;
}

type PromptTileProps = {
  prompt: string;
  tray: TrayStatus;
  isSendPressed: boolean;
  onType: (value: string) => void;
  onSend: () => void;
};

export function PromptTile({
  prompt,
  tray,
  isSendPressed,
  onType,
  onSend,
}: PromptTileProps) {
  const isEmpty = prompt.trim() === '';
  const line = TRAY_LINE[tray];

  function sendOnEnter(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    const isEnter = event.key === 'Enter';
    const isPlain = !event.shiftKey;
    const hasText = !isEmpty;
    if (isEnter && isPlain && hasText) {
      event.preventDefault();
      onSend();
    }
  }

  return (
    <Tile copy={TILES.prompt}>
      <div className='flex flex-col gap-2'>
        <div className='relative'>
          <Textarea
            rows={3}
            value={prompt}
            placeholder={PROMPT.placeholder}
            aria-label={PROMPT.label}
            onChange={(event) => onType(event.target.value)}
            onKeyDown={sendOnEnter}
            className='min-h-24 pe-12 text-[13px]'
          />
          <Button
            type='button'
            size='icon-sm'
            aria-label='Send the prompt'
            disabled={isEmpty}
            onClick={onSend}
            className={cn(
              'absolute end-2 bottom-2',
              pressedSolidOf(isSendPressed)
            )}
          >
            <ArrowUpIcon />
          </Button>
        </div>
        <p
          aria-label='Status'
          className='text-muted-foreground flex h-6 items-center px-1 text-xs'
        >
          <Swap swapKey={tray}>
            <span className='flex items-center gap-1.5'>
              <TrayGlyph tray={tray} />
              <span>{line}</span>
            </span>
          </Swap>
        </p>
      </div>
    </Tile>
  );
}
