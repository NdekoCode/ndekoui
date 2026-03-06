// Adapted from prompt-kit (MIT, Copyright (c) 2025 Julien Thibeaut).
'use client';

import { useId, useState } from 'react';

import {
  ChevronDownIcon,
  CircleCheckIcon,
  CircleDashedIcon,
  CircleXIcon,
  LoaderIcon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Fold, Swap } from '@/registry/ndeko/ui/chat-motion';

type ToolState =
  'input-streaming' | 'input-available' | 'output-available' | 'output-error';

type ToolPart = {
  type: string;
  state: ToolState;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  toolCallId?: string;
  errorText?: string;
};

type BadgeVariant = React.ComponentProps<typeof Badge>['variant'];

type StateLook = {
  label: string;
  badge: BadgeVariant;
  icon: React.ReactNode;
};

const STATE_LOOK: Record<ToolState, StateLook> = {
  'input-streaming': {
    label: 'Preparing',
    badge: 'secondary',
    icon: <CircleDashedIcon className='text-muted-foreground size-4' />,
  },
  'input-available': {
    label: 'Running',
    badge: 'info',
    icon: <LoaderIcon className='text-info-foreground size-4 animate-spin' />,
  },
  'output-available': {
    label: 'Done',
    badge: 'success',
    icon: <CircleCheckIcon className='text-success-foreground size-4' />,
  },
  'output-error': {
    label: 'Failed',
    badge: 'destructive',
    icon: <CircleXIcon className='text-destructive-ink size-4' />,
  },
};

function formatValue(value: unknown) {
  if (value === null) {
    return 'null';
  }
  if (value === undefined) {
    return 'undefined';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2);
  }
  return String(value);
}

function filledRecordOf(record: Record<string, unknown> | undefined) {
  if (!record) {
    return null;
  }
  const isEmpty = Object.keys(record).length === 0;
  if (isEmpty) {
    return null;
  }
  return record;
}

function visibleErrorOf(state: ToolState, errorText: string | undefined) {
  const isFailed = state === 'output-error';
  if (!isFailed) {
    return null;
  }
  return errorText ?? null;
}

function chevronTurnOf(isOpen: boolean) {
  if (isOpen) {
    return 'rotate-180';
  }
  return 'rotate-0';
}

const SECTION_LABEL = 'text-muted-foreground mb-1.5 text-xs font-medium';

const VALUE_BOX =
  'bg-foreground/[0.03] dark:bg-foreground/[0.05] rounded-lg p-2.5 font-mono text-xs leading-relaxed';

function ToolInput({ input }: { input: Record<string, unknown> }) {
  const entries = Object.entries(input);

  return (
    <div>
      <div className={SECTION_LABEL}>Input</div>
      <dl className={cn(VALUE_BOX, 'space-y-1')}>
        {entries.map(([key, value]) => (
          <div key={key} className='flex gap-1.5'>
            <dt className='text-muted-foreground shrink-0'>{key}:</dt>
            <dd className='min-w-0 break-words whitespace-pre-wrap'>
              {formatValue(value)}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function ToolOutput({ output }: { output: Record<string, unknown> }) {
  return (
    <div>
      <div className={SECTION_LABEL}>Output</div>
      <pre
        className={cn(VALUE_BOX, 'max-h-60 overflow-auto whitespace-pre-wrap')}
      >
        {formatValue(output)}
      </pre>
    </div>
  );
}

function ToolError({ errorText }: { errorText: string }) {
  return (
    <div>
      <div className={SECTION_LABEL}>Error</div>
      <div className='bg-destructive/10 text-destructive-ink rounded-lg p-2.5 text-xs leading-relaxed'>
        {errorText}
      </div>
    </div>
  );
}

type ToolProps = {
  toolPart: ToolPart;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
};

function Tool({
  toolPart,
  defaultOpen = false,
  open,
  onOpenChange,
  className,
}: ToolProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const contentId = useId();
  const isControlled = open !== undefined;
  const isOpen = open ?? internalOpen;
  const { state, input, output, toolCallId, errorText } = toolPart;
  const look = STATE_LOOK[state];
  const visibleInput = filledRecordOf(input);
  const visibleError = visibleErrorOf(state, errorText);
  const isPreparing = state === 'input-streaming';
  const isRunning = state === 'input-available';

  function toggle() {
    const nextOpen = !isOpen;
    if (!isControlled) {
      setInternalOpen(nextOpen);
    }
    onOpenChange?.(nextOpen);
  }

  return (
    <div
      data-slot='tool'
      data-state={state}
      className={cn(
        'bg-card hairline-ring ring-border overflow-hidden rounded-xl shadow-[0_1px_2px_rgb(0_0_0/0.04)]',
        className
      )}
    >
      <button
        type='button'
        aria-expanded={isOpen}
        aria-controls={contentId}
        onClick={toggle}
        className='hover:bg-foreground/[0.025] focus-visible:ring-ring/25 flex h-10 w-full cursor-pointer items-center gap-2 rounded-xl px-3 text-start text-[13px] transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-inset'
      >
        <Swap swapKey={state} className='size-4 shrink-0'>
          {look.icon}
        </Swap>
        <span className='min-w-0 truncate font-mono text-xs font-medium'>
          {toolPart.type}
        </span>
        <Swap swapKey={state}>
          <Badge variant={look.badge}>{look.label}</Badge>
        </Swap>
        <ChevronDownIcon
          className={cn(
            'text-muted-foreground ms-auto size-4 shrink-0 transition-transform duration-200 ease-(--ease-out-strong)',
            chevronTurnOf(isOpen)
          )}
        />
      </button>
      <Fold open={isOpen} id={contentId}>
        <div className='space-y-3 px-3 pt-1 pb-3'>
          {visibleInput && <ToolInput input={visibleInput} />}
          {output && <ToolOutput output={output} />}
          {visibleError && <ToolError errorText={visibleError} />}
          {isPreparing && (
            <p className='text-muted-foreground text-xs'>Preparing the call</p>
          )}
          {isRunning && (
            <p className='text-muted-foreground text-xs'>
              Waiting for the result
            </p>
          )}
          {toolCallId && (
            <p className='text-muted-foreground font-mono text-xs'>
              Call {toolCallId}
            </p>
          )}
        </div>
      </Fold>
    </div>
  );
}

export { Tool, type ToolPart, type ToolProps, type ToolState };
