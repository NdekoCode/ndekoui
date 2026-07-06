'use client';

import { useId } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { WordRoll } from '@/components/core/word-roll';
import { ChevronDownIcon, Trash2Icon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Badge } from '@/registry/ndeko/ui/badge';
import { BrandTile } from '@/registry/ndeko/ui/brand-tile';
import { Button } from '@/registry/ndeko/ui/button';
import { Fold, Swap } from '@/registry/ndeko/ui/chat-motion';
import { Chip } from '@/registry/ndeko/ui/chip';
import { MeshTile } from '@/registry/ndeko/ui/mesh-tile';
import { MorphButton, type MorphState } from '@/registry/ndeko/ui/morph-button';
import { StatusOrb, type StatusOrbTone } from '@/registry/ndeko/ui/status-orb';
import { Switch } from '@/registry/ndeko/ui/switch';

import { TRANSPORT_WORD, type Access, type Server, type Tool } from './data';
import {
  enabledCountOf,
  type ConnectionStatus,
  type McpAction,
  type ServerLive,
  type ToolSetting,
} from './session';

const STATUS_WORD: Record<ConnectionStatus, string> = {
  connected: 'Connected',
  expired: 'Token expired',
  reconnecting: 'Reconnecting',
  restored: 'Connected',
};

const STATUS_WORDS = ['Connected', 'Token expired', 'Reconnecting'];

const ORB_TONE: Record<ConnectionStatus, StatusOrbTone> = {
  connected: 'success',
  expired: 'error',
  reconnecting: 'loading',
  restored: 'success',
};

const WORD_TONE: Record<ConnectionStatus, string> = {
  connected: 'text-muted-foreground',
  expired: 'text-destructive-ink',
  reconnecting: 'text-muted-foreground',
  restored: 'text-muted-foreground',
};

const REASON_TONE: Record<ConnectionStatus, string> = {
  connected: 'text-foreground',
  expired: 'text-destructive-ink',
  reconnecting: 'text-foreground',
  restored: 'text-foreground',
};

const RECONNECT_STATE: Record<ConnectionStatus, MorphState> = {
  connected: 'done',
  expired: 'idle',
  reconnecting: 'busy',
  restored: 'done',
};

const RECONNECT_LABELS: Record<MorphState, string> = {
  idle: 'Reconnect',
  busy: 'Reconnecting',
  done: 'Connected',
};

const REASON_LINE: Record<ConnectionStatus, string> = {
  connected: 'Signed in. The tools are back',
  expired: 'The agent cannot use these tools until you sign in again',
  reconnecting: 'Asking for a new token',
  restored: 'Signed in. The tools are back',
};

const ACCESS_WORD: Record<Access, string> = { read: 'Read', write: 'Write' };

const ACCESS_COLOR: Record<Access, string> = {
  read: 'var(--muted-foreground)',
  write: 'var(--warning)',
};

function toolsWordOf(count: number) {
  if (count === 1) {
    return 'tool on';
  }
  return 'tools on';
}

function lostToolsOf(count: number) {
  if (count === 1) {
    return 'its tool';
  }
  return `its ${count} tools`;
}

function chevronTurnOf(isOpen: boolean) {
  if (isOpen) {
    return 'rotate-180';
  }
  return 'rotate-0';
}

function pressedQuietOf(isPressed: boolean) {
  if (isPressed) {
    return 'scale-[0.94] bg-foreground/[0.07] text-foreground';
  }
  return undefined;
}

function toggleLabelOf(server: Server, isOpen: boolean) {
  if (isOpen) {
    return `Hide the tools of ${server.name}`;
  }
  return `Show the tools of ${server.name}`;
}

function removeVariantOf(isRemoving: boolean) {
  if (isRemoving) {
    return 'destructive';
  }
  return 'ghost';
}

function removeLabelOf(server: Server, isRemoving: boolean) {
  if (isRemoving) {
    return `Remove ${server.name}`;
  }
  return 'Remove server';
}

function ServerTile({ server }: { server: Server }) {
  if (server.brand) {
    return <BrandTile brand={server.brand} size='lg' />;
  }
  return <MeshTile seed={server.name} size='lg' />;
}

type ToolRowProps = {
  serverId: string;
  tool: Tool;
  setting: ToolSetting;
  onAction: (action: McpAction) => void;
};

function ToolRow({ serverId, tool, setting, onAction }: ToolRowProps) {
  function setEnabled(isEnabled: boolean) {
    onAction({ type: 'toolEnabled', id: serverId, tool: tool.name, isEnabled });
  }

  function setAsksFirst(asksFirst: boolean) {
    onAction({ type: 'toolAsks', id: serverId, tool: tool.name, asksFirst });
  }

  return (
    <li className='bg-foreground/[0.03] dark:bg-foreground/[0.05] flex flex-col gap-2 rounded-lg px-2.5 py-2 @xl:flex-row @xl:items-center @xl:gap-4'>
      <div className='flex min-w-0 flex-1 flex-col gap-0.5'>
        <p className='flex flex-wrap items-center gap-2'>
          <code className='font-mono text-xs'>{tool.name}</code>
          <Chip color={ACCESS_COLOR[tool.access]}>
            {ACCESS_WORD[tool.access]}
          </Chip>
        </p>
        <p className='text-muted-foreground text-xs'>{tool.summary}</p>
      </div>
      <div className='flex shrink-0 items-center gap-4'>
        <label className='flex cursor-pointer items-center gap-2 text-xs'>
          <Switch
            checked={setting.isEnabled}
            onCheckedChange={setEnabled}
            aria-label={`Let the agent use ${tool.name}`}
          />
          Enabled
        </label>
        <label
          className={cn(
            'flex cursor-pointer items-center gap-2 text-xs transition-opacity duration-200',
            !setting.isEnabled && 'cursor-not-allowed opacity-50'
          )}
        >
          <Switch
            checked={setting.asksFirst}
            disabled={!setting.isEnabled}
            onCheckedChange={setAsksFirst}
            aria-label={`Ask first before ${tool.name}`}
          />
          Ask first
        </label>
      </div>
    </li>
  );
}

export type ServerRowProps = {
  server: Server;
  live: ServerLive;
  isOpen: boolean;
  isRemoving: boolean;
  pressed: string | null;
  onAction: (action: McpAction) => void;
  onReconnect: (id: string) => void;
};

export function ServerRow({
  server,
  live,
  isOpen,
  isRemoving,
  pressed,
  onAction,
  onReconnect,
}: ServerRowProps) {
  const panelId = useId();
  const enabledCount = enabledCountOf(live);
  const toolCount = server.tools.length;
  const needsAttention = live.status !== 'connected';
  const removeLabel = removeLabelOf(server, isRemoving);

  function removeStep() {
    if (isRemoving) {
      onAction({ type: 'removed', id: server.id });
      return;
    }
    onAction({ type: 'removeAsked', id: server.id });
  }

  return (
    <div className='flex flex-col px-2 py-2.5'>
      <div className='flex items-center gap-3'>
        <ServerTile server={server} />
        <div className='flex min-w-0 flex-1 flex-col gap-0.5'>
          <p className='flex flex-wrap items-center gap-x-2 gap-y-0.5'>
            <span className='text-[13px] leading-5 font-medium'>
              {server.name}
            </span>
            <Badge variant='secondary'>
              {TRANSPORT_WORD[server.transport]}
            </Badge>
          </p>
          <p className='text-muted-foreground flex min-w-0 items-center gap-1 text-xs'>
            <MotionNumber value={enabledCount} />
            <span className='shrink-0'>
              of {toolCount} {toolsWordOf(toolCount)}
            </span>
            {server.address && (
              <code className='min-w-0 truncate ps-1 font-mono'>
                {server.address}
              </code>
            )}
          </p>
        </div>
        <div className='flex shrink-0 items-center gap-2'>
          <span
            className={cn(
              'hidden text-xs transition-colors duration-200 @md:block',
              WORD_TONE[live.status]
            )}
          >
            <WordRoll text={STATUS_WORD[live.status]} labels={STATUS_WORDS} />
          </span>
          <StatusOrb tone={ORB_TONE[live.status]} size='sm' />
          <span className='sr-only @md:hidden'>{STATUS_WORD[live.status]}</span>
        </div>
        <Button
          type='button'
          variant='ghost'
          size='icon-sm'
          aria-expanded={isOpen}
          aria-controls={panelId}
          aria-label={toggleLabelOf(server, isOpen)}
          onClick={() => onAction({ type: 'toggled', id: server.id })}
          className={cn(
            'text-muted-foreground',
            pressedQuietOf(pressed === `toggle-${server.id}`)
          )}
        >
          <ChevronDownIcon
            className={cn(
              'transition-transform duration-200 ease-(--ease-out-strong)',
              chevronTurnOf(isOpen)
            )}
          />
        </Button>
      </div>

      <Fold open={needsAttention} className='ps-10'>
        <div className='flex flex-wrap items-center gap-x-3 gap-y-2 pt-2'>
          <p className='min-w-0 flex-1 text-xs'>
            <span
              className={cn(
                'font-medium transition-colors duration-200 @md:hidden',
                REASON_TONE[live.status]
              )}
            >
              {STATUS_WORD[live.status]}.{' '}
            </span>
            <span className='text-muted-foreground'>
              <Swap swapKey={live.status}>{REASON_LINE[live.status]}</Swap>
            </span>
          </p>
          <MorphButton
            type='button'
            size='sm'
            variant='outline'
            state={RECONNECT_STATE[live.status]}
            labels={RECONNECT_LABELS}
            onClick={() => onReconnect(server.id)}
            className={pressedQuietOf(pressed === `reconnect-${server.id}`)}
          />
        </div>
      </Fold>

      <Fold open={isOpen} id={panelId} className='ps-10'>
        <ul
          aria-label={`Tools of ${server.name}`}
          className='flex flex-col gap-1 pt-2'
        >
          {server.tools.map((tool) => (
            <ToolRow
              key={tool.name}
              serverId={server.id}
              tool={tool}
              setting={live.tools[tool.name]}
              onAction={onAction}
            />
          ))}
        </ul>
        <div className='flex flex-wrap items-center gap-x-3 gap-y-2 pt-2'>
          <Button
            type='button'
            size='sm'
            variant={removeVariantOf(isRemoving)}
            onClick={removeStep}
            className={cn(!isRemoving && 'text-destructive-ink')}
          >
            <Trash2Icon />
            <Swap swapKey={removeLabel}>{removeLabel}</Swap>
          </Button>
          {isRemoving && (
            <>
              <Button
                type='button'
                size='sm'
                variant='ghost'
                onClick={() => onAction({ type: 'removeCancelled' })}
                className='transition-opacity duration-200 starting:opacity-0'
              >
                Keep it
              </Button>
              <p className='text-muted-foreground text-xs transition-opacity duration-200 starting:opacity-0'>
                The agent loses {lostToolsOf(toolCount)}
              </p>
            </>
          )}
        </div>
      </Fold>
    </div>
  );
}
