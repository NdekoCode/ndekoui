'use client';

import { pressedQuietOf } from '@/registry/ndeko/lib/demonstration';
import { CheckIcon } from '@/registry/ndeko/lib/icons';
import { FOCUS_RING } from '@/registry/ndeko/lib/recipes';
import { cn } from '@/registry/ndeko/lib/utils';
import { BrandTile } from '@/registry/ndeko/ui/brand-tile';

import { TOOLS, type ToolId } from './data';

const CONNECTED_PILL = 'bg-success/10 text-success-foreground';

const WAITING_PILL =
  'bg-foreground/[0.05] text-foreground hover:bg-foreground/[0.08]';

function toneOf(isConnected: boolean) {
  if (isConnected) {
    return CONNECTED_PILL;
  }
  return WAITING_PILL;
}

type ToolPillsProps = {
  connected: ToolId[];
  openId: ToolId | null;
  pressed: string | null;
  onPick: (id: ToolId) => void;
};

export function ToolPills({
  connected,
  openId,
  pressed,
  onPick,
}: ToolPillsProps) {
  return (
    <ul
      aria-label='Tools to connect'
      className='flex max-w-3xl flex-wrap justify-center gap-1.5'
    >
      {TOOLS.map((tool) => {
        const isConnected = connected.includes(tool.id);
        const isOpen = openId === tool.id;
        const isPressed = pressed === `tool-${tool.id}`;

        return (
          <li key={tool.id}>
            <button
              type='button'
              data-tool={tool.id}
              aria-expanded={isOpen}
              onClick={() => onPick(tool.id)}
              className={cn(
                'flex h-7 cursor-pointer items-center gap-1.5 rounded-full ps-1.5 pe-2.5 text-xs transition-[color,background-color,scale] duration-150 ease-(--ease-out-strong) active:scale-[0.97]',
                toneOf(isConnected),
                pressedQuietOf(isPressed),
                FOCUS_RING
              )}
            >
              <BrandTile brand={tool.id} size='sm' />
              {tool.name}
              {isConnected && <CheckIcon className='size-3' />}
              {isConnected && <span className='sr-only'>, connected</span>}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
