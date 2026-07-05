'use client';

import { useId } from 'react';

import { CheckIcon, XIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Button } from '@/registry/ndeko/ui/button';
import { Swap } from '@/registry/ndeko/ui/chat-motion';
import { Input } from '@/registry/ndeko/ui/input';
import { Label } from '@/registry/ndeko/ui/label';
import { MorphButton, type MorphState } from '@/registry/ndeko/ui/morph-button';
import { Segments, type Segment } from '@/registry/ndeko/ui/segments';
import { Spinner } from '@/registry/ndeko/ui/spinner';

import { DEMO_NAME, FOUND_TOOLS, type Transport } from './data';
import type { DialogState, McpAction, TestStatus } from './session';

const TRANSPORTS: Segment<Transport>[] = [
  { value: 'remote', label: 'Remote' },
  { value: 'local', label: 'Local' },
];

const ADDRESS_LABEL: Record<Transport, string> = {
  remote: 'Server URL',
  local: 'Command',
};

const ADDRESS_HINT: Record<Transport, string> = {
  remote: 'https://mcp.example.dev/mcp',
  local: 'node ./mcp/server.js',
};

const TEST_STATE: Record<TestStatus, MorphState> = {
  idle: 'idle',
  testing: 'busy',
  connected: 'done',
  failed: 'idle',
};

const TEST_LABELS: Record<MorphState, string> = {
  idle: 'Test connection',
  busy: 'Testing',
  done: 'Connected',
};

function layerOf(isOpen: boolean) {
  if (isOpen) {
    return undefined;
  }
  return 'pointer-events-none';
}

function backdropOf(isOpen: boolean) {
  if (isOpen) {
    return 'opacity-100';
  }
  return 'opacity-0';
}

function panelOf(isOpen: boolean) {
  if (isOpen) {
    return 'scale-100 opacity-100';
  }
  return 'scale-95 opacity-0 duration-150';
}

function pressedSolidOf(isPressed: boolean) {
  if (isPressed) {
    return 'scale-[0.94] bg-primary/85';
  }
  return undefined;
}

function pressedQuietOf(isPressed: boolean) {
  if (isPressed) {
    return 'scale-[0.94] bg-foreground/[0.07]';
  }
  return undefined;
}

function toolsFoundOf(count: number) {
  if (count === 1) {
    return '1 tool found';
  }
  return `${count} tools found`;
}

function TestResult({ dialog }: { dialog: DialogState }) {
  if (dialog.test === 'testing') {
    return (
      <p className='text-muted-foreground flex items-center gap-2 text-[13px]'>
        <Spinner label='Testing the connection' />
        Testing the connection
      </p>
    );
  }
  if (dialog.test === 'failed') {
    return (
      <div className='bg-destructive/10 flex items-start gap-2.5 rounded-lg p-3'>
        <XIcon className='text-destructive-ink mt-0.5 size-4 shrink-0' />
        <div className='flex min-w-0 flex-col gap-0.5'>
          <p className='text-destructive-ink text-[13px] font-medium'>Failed</p>
          <p className='text-[13px] leading-relaxed'>{dialog.failure}</p>
        </div>
      </div>
    );
  }
  if (dialog.test === 'connected') {
    return (
      <div className='bg-success/10 flex items-start gap-2.5 rounded-lg p-3'>
        <CheckIcon className='text-success-foreground mt-0.5 size-4 shrink-0' />
        <div className='flex min-w-0 flex-col gap-2'>
          <p className='text-success-foreground text-[13px] font-medium'>
            Connected, {toolsFoundOf(FOUND_TOOLS.length)}
          </p>
          <ul className='flex flex-wrap gap-1'>
            {FOUND_TOOLS.map((tool) => (
              <li
                key={tool.name}
                className='bg-card/70 dark:bg-foreground/[0.06] rounded-sm px-1.5 py-0.5 font-mono text-[11px]'
              >
                {tool.name}
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }
  return null;
}

export type AddServerDialogProps = {
  dialog: DialogState;
  pressed: string | null;
  onAction: (action: McpAction) => void;
  onTest: () => void;
  onAdd: () => void;
  onClose: () => void;
};

/** Drawn inside the block, so the demonstration never opens a layer over the rest of the page. */
export function AddServerDialog({
  dialog,
  pressed,
  onAction,
  onTest,
  onAdd,
  onClose,
}: AddServerDialogProps) {
  const titleId = useId();
  const nameId = useId();
  const addressId = useId();
  const isOpen = dialog.isOpen;
  const isTesting = dialog.test === 'testing';
  const canAdd = dialog.test === 'connected';
  const addressLabel = ADDRESS_LABEL[dialog.transport];

  function closeOnEscape(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      onClose();
    }
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (canAdd) {
      onAdd();
    }
  }

  return (
    <div
      inert={!isOpen}
      onKeyDown={closeOnEscape}
      className={cn('absolute inset-0 z-20', layerOf(isOpen))}
    >
      <button
        type='button'
        tabIndex={-1}
        aria-label='Close the dialog'
        onClick={onClose}
        className={cn(
          'absolute inset-0 cursor-default bg-black/40 backdrop-blur-xs transition-opacity duration-200',
          backdropOf(isOpen)
        )}
      />
      <div
        role='dialog'
        aria-modal='true'
        aria-labelledby={titleId}
        className={cn(
          'bg-card text-card-foreground hairline-ring ring-border absolute top-1/2 left-1/2 max-h-[calc(100%-2rem)] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-x-hidden overflow-y-auto rounded-2xl p-6 shadow-xl shadow-black/8 transition-[opacity,scale] duration-200 ease-(--ease-out-strong)',
          panelOf(isOpen)
        )}
      >
        <form noValidate onSubmit={submit}>
          <AnimatedSize contentClassName='flex flex-col gap-4'>
            <div className='flex flex-col gap-1.5 pe-8'>
              <h2 id={titleId} className='text-lg leading-tight font-semibold'>
                Add a server
              </h2>
              <p className='text-muted-foreground text-[13px]'>
                Test the connection first. The agent only gets the tools the
                server lists.
              </p>
            </div>

            <div className='flex flex-col gap-1.5'>
              <Label htmlFor={nameId}>Name</Label>
              <Input
                id={nameId}
                data-dialog-first
                autoComplete='off'
                placeholder={DEMO_NAME}
                value={dialog.name}
                disabled={isTesting}
                onChange={(event) =>
                  onAction({ type: 'named', text: event.target.value })
                }
              />
            </div>

            <div className='flex flex-col gap-1.5'>
              <span className='text-[13px] leading-none font-medium'>
                Transport
              </span>
              <Segments
                value={dialog.transport}
                segments={TRANSPORTS}
                onValueChange={(transport) =>
                  onAction({ type: 'transport', transport })
                }
                label='Transport'
                className='w-44'
              />
            </div>

            <div className='flex flex-col gap-1.5'>
              <Label htmlFor={addressId}>
                <Swap swapKey={addressLabel}>{addressLabel}</Swap>
              </Label>
              <Input
                id={addressId}
                autoComplete='off'
                autoCapitalize='off'
                spellCheck={false}
                placeholder={ADDRESS_HINT[dialog.transport]}
                value={dialog.address}
                disabled={isTesting}
                aria-invalid={dialog.test === 'failed'}
                onChange={(event) =>
                  onAction({ type: 'addressed', text: event.target.value })
                }
                className='font-mono'
              />
            </div>

            <div aria-live='polite' className='empty:hidden'>
              <TestResult dialog={dialog} />
            </div>

            <div className='flex flex-col-reverse gap-2 @sm:flex-row @sm:items-center @sm:justify-end'>
              <MorphButton
                type='button'
                variant='outline'
                state={TEST_STATE[dialog.test]}
                labels={TEST_LABELS}
                onClick={onTest}
                className={cn(
                  '@sm:me-auto',
                  pressedQuietOf(pressed === 'test')
                )}
              />
              <Button type='button' variant='ghost' onClick={onClose}>
                Cancel
              </Button>
              <Button
                type='submit'
                disabled={!canAdd}
                className={pressedSolidOf(pressed === 'confirm')}
              >
                Add server
              </Button>
            </div>
          </AnimatedSize>
        </form>
        <Button
          type='button'
          variant='ghost'
          size='icon-sm'
          aria-label='Close'
          onClick={onClose}
          className='text-muted-foreground absolute top-3 right-3'
        >
          <XIcon />
        </Button>
      </div>
    </div>
  );
}
