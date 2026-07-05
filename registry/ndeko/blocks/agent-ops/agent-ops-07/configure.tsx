'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useId } from 'react';

import {
  CheckIcon,
  FileTextIcon,
  ReceiptIcon,
  UploadIcon,
  XIcon,
} from '@/registry/ndeko/lib/icons';
import { rowPresenceOf } from '@/registry/ndeko/lib/motion-presets';
import { cn } from '@/registry/ndeko/lib/utils';
import { Badge } from '@/registry/ndeko/ui/badge';
import { BrandTile } from '@/registry/ndeko/ui/brand-tile';
import { Button } from '@/registry/ndeko/ui/button';
import { Fold, Swap } from '@/registry/ndeko/ui/chat-motion';
import { Label } from '@/registry/ndeko/ui/label';
import { Switch } from '@/registry/ndeko/ui/switch';
import { Textarea } from '@/registry/ndeko/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/registry/ndeko/ui/toggle-group';

import { INSTRUCTIONS_LIMIT, MODELS, TOOLS, type AgentTool } from './data';
import {
  isIndexed,
  nextSampleFileOf,
  type BuilderAction,
  type BuilderState,
  type LiveFile,
} from './session';

const THUMB =
  'bg-card shadow-[0_1px_2px_rgb(0_0_0/0.08)] hairline-ring ring-foreground/10 dark:bg-foreground/[0.09] dark:ring-foreground/15';

const COUNT_FORMAT = new Intl.NumberFormat('en-US');

/** The count turns to the warning tone in the last tenth of the room. */
const NEAR_LIMIT = 0.9;

function countToneOf(count: number) {
  const isNearLimit = count >= INSTRUCTIONS_LIMIT * NEAR_LIMIT;
  if (isNearLimit) {
    return 'text-warning-foreground';
  }
  return 'text-muted-foreground';
}

function fillOf(progress: number) {
  const share = progress / 100;
  return { transform: `scaleX(${share})` };
}

function fileStateOf(file: LiveFile) {
  if (isIndexed(file)) {
    return 'Indexed';
  }
  return `${file.progress}%`;
}

function pressedQuietOf(isPressed: boolean) {
  if (isPressed) {
    return 'scale-[0.94] bg-foreground/[0.07]';
  }
  return undefined;
}

function Section({
  title,
  aside,
  children,
}: {
  title: React.ReactNode;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className='flex flex-col gap-2'>
      <div className='flex min-h-5 items-center justify-between gap-3'>
        {title}
        {aside}
      </div>
      {children}
    </div>
  );
}

function ToolTile({ tool }: { tool: AgentTool }) {
  if (tool.brand) {
    return <BrandTile brand={tool.brand} size='lg' />;
  }
  return (
    <span
      aria-hidden='true'
      className='keycap-3d text-muted-foreground inline-flex size-7 shrink-0 items-center justify-center rounded-md'
    >
      <ReceiptIcon className='size-4' />
    </span>
  );
}

type FileRowProps = {
  file: LiveFile;
  onRemove: (id: string) => void;
};

function FileRow({ file, onRemove }: FileRowProps) {
  const isDone = isIndexed(file);
  const fileState = fileStateOf(file);

  return (
    <div className='flex items-center gap-3 px-1 py-1.5'>
      <span
        aria-hidden='true'
        className='keycap-3d text-muted-foreground inline-flex size-7 shrink-0 items-center justify-center rounded-md'
      >
        <FileTextIcon className='size-4' />
      </span>
      <div className='flex min-w-0 flex-1 flex-col'>
        <p className='flex items-baseline gap-2'>
          <span className='truncate text-[13px]'>{file.name}</span>
          <span className='text-muted-foreground shrink-0 text-xs tabular-nums'>
            {file.size}
          </span>
        </p>
        <Fold open={!isDone}>
          <div
            role='progressbar'
            aria-label={`Uploading ${file.name}`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={file.progress}
            className='bg-foreground/[0.06] mt-1 h-1 overflow-hidden rounded-full'
          >
            <div
              style={fillOf(file.progress)}
              className='bg-primary h-full origin-left rounded-full transition-transform duration-500 ease-(--ease-out-strong)'
            />
          </div>
        </Fold>
      </div>
      <span className='text-muted-foreground flex w-[4.5rem] shrink-0 justify-end text-xs tabular-nums'>
        <Swap swapKey={String(isDone)}>
          <span className='flex items-center gap-1'>
            {isDone && (
              <CheckIcon className='text-success-foreground size-3.5' />
            )}
            {fileState}
          </span>
        </Swap>
      </span>
      <Button
        type='button'
        variant='ghost'
        size='icon-sm'
        aria-label={`Remove ${file.name}`}
        onClick={() => onRemove(file.id)}
        className='text-muted-foreground'
      >
        <XIcon />
      </Button>
    </div>
  );
}

export type ConfigureProps = {
  state: BuilderState;
  pressed: string | null;
  onAction: (action: BuilderAction) => void;
  onAddFile: () => void;
};

export function Configure({
  state,
  pressed,
  onAction,
  onAddFile,
}: ConfigureProps) {
  const instructionsId = useId();
  const shouldReduceMotion = useReducedMotion();
  const rowPresence = rowPresenceOf(shouldReduceMotion);
  const count = state.instructions.length;
  const countText = COUNT_FORMAT.format(count);
  const hasFiles = state.files.length > 0;
  const canAddFile = nextSampleFileOf(state) !== undefined;

  function changeModel(values: unknown[]) {
    const [next] = values;
    const model = MODELS.find((candidate) => candidate.id === next);
    if (model) {
      onAction({ type: 'model', id: model.id });
    }
  }

  return (
    <div className='flex flex-col gap-6'>
      <Section
        title={<h2 className='text-[13px] font-medium'>Model</h2>}
        aside={<Badge variant='secondary'>Illustrative hints</Badge>}
      >
        <ToggleGroup
          aria-label='Model'
          value={[state.modelId]}
          onValueChange={changeModel}
          travel
          indicatorClassName={THUMB}
          className='bg-foreground/[0.04] grid w-full grid-cols-2 gap-1 rounded-xl p-1 @xl:grid-cols-4'
        >
          {MODELS.map((model) => (
            <ToggleGroupItem
              key={model.id}
              value={model.id}
              className='h-auto min-w-0 justify-start gap-2 rounded-lg px-2 py-2 text-start'
            >
              <BrandTile brand={model.brand} />
              <span className='flex min-w-0 flex-col leading-tight'>
                <span className='text-foreground truncate text-[13px]'>
                  {model.name}
                </span>
                <span className='text-muted-foreground truncate text-[11px] font-normal'>
                  {model.hint}
                </span>
              </span>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </Section>

      <Section
        title={<Label htmlFor={instructionsId}>Instructions</Label>}
        aside={
          <span
            className={cn(
              'text-xs tabular-nums transition-colors duration-200',
              countToneOf(count)
            )}
          >
            {countText} of {INSTRUCTIONS_LIMIT} characters
          </span>
        }
      >
        <Textarea
          id={instructionsId}
          value={state.instructions}
          maxLength={INSTRUCTIONS_LIMIT}
          onChange={(event) =>
            onAction({ type: 'instructed', text: event.target.value })
          }
          className='min-h-24'
        />
      </Section>

      <Section
        title={<h2 className='text-[13px] font-medium'>What it may use</h2>}
      >
        <ul className='flex flex-col'>
          {TOOLS.map((tool) => (
            <li key={tool.id} className='flex items-center gap-3 py-2'>
              <ToolTile tool={tool} />
              <div className='flex min-w-0 flex-1 flex-col gap-0.5'>
                <p className='text-[13px] leading-5 font-medium'>{tool.name}</p>
                <p className='text-muted-foreground text-xs'>{tool.allows}</p>
              </div>
              <Switch
                checked={state.tools[tool.id]}
                onCheckedChange={(isOn) =>
                  onAction({ type: 'toolSet', id: tool.id, isOn })
                }
                aria-label={tool.name}
              />
            </li>
          ))}
        </ul>
      </Section>

      <Section title={<h2 className='text-[13px] font-medium'>Knowledge</h2>}>
        {!hasFiles && (
          <p className='text-muted-foreground text-[13px]'>
            No file yet. The agent answers from its instructions alone.
          </p>
        )}
        <ul className='-mx-1 flex flex-col'>
          <AnimatePresence initial={false}>
            {state.files.map((file) => (
              <motion.li
                key={file.id}
                className='overflow-hidden'
                {...rowPresence}
              >
                <FileRow
                  file={file}
                  onRemove={(id) => onAction({ type: 'fileRemoved', id })}
                />
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
        <Button
          type='button'
          variant='outline'
          size='sm'
          disabled={!canAddFile}
          onClick={onAddFile}
          className={cn('self-start', pressedQuietOf(pressed === 'add-file'))}
        >
          <UploadIcon />
          Add a sample file
        </Button>
      </Section>
    </div>
  );
}
