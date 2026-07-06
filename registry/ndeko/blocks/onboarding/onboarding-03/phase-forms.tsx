'use client';

import { useId } from 'react';

import { seriesColorOf } from '@/registry/ndeko/lib/agent-run';
import { pressedQuietOf } from '@/registry/ndeko/lib/demonstration';
import { MailIcon, PlugIcon, XIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { BrandTile } from '@/registry/ndeko/ui/brand-tile';
import { Button } from '@/registry/ndeko/ui/button';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/registry/ndeko/ui/field';
import { Input } from '@/registry/ndeko/ui/input';
import { Label, LABEL_RECIPE } from '@/registry/ndeko/ui/label';
import { MeshTile } from '@/registry/ndeko/ui/mesh-tile';
import { MorphButton, type MorphState } from '@/registry/ndeko/ui/morph-button';
import { RadioGroup, RadioGroupItem } from '@/registry/ndeko/ui/radio-group';

import {
  AGENT_SEED,
  AGENT_SERIES,
  JOB_MAX_LENGTH,
  MODELS,
  TOOLS,
  type ModelId,
  type Tool,
  type ToolId,
} from './data';
import { ENDS_AN_ADDRESS } from './invites';
import type { ConnectStatus, Hint, HintField, TextField } from './session';

const CONNECT_STATE: Record<ConnectStatus, MorphState> = {
  idle: 'idle',
  connecting: 'busy',
  connected: 'done',
};

const CONNECT_LABELS: Record<MorphState, string> = {
  idle: 'Connect',
  busy: 'Connecting',
  done: 'Connected',
};

/** A tray inside the card. A connected tool takes the tint of what went well. */
const TOOL_ROW =
  'flex items-center gap-3 rounded-lg p-2.5 transition-colors duration-200';

/** A tray inside the card, tinted when its model is the one picked. The whole tray answers the press. */
const MODEL_CHOICE =
  'bg-foreground/[0.04] has-data-checked:bg-primary/[0.08] relative flex items-center gap-3 rounded-lg p-3 transition-colors duration-150';

/** Someone invited has not joined yet: a dashed slot with an envelope, since nobody is there. */
const INVITED =
  'hairline-border border-foreground/25 flex h-7 max-w-full items-center gap-1.5 rounded-full border-dashed ps-2.5 pe-0.5 text-xs transition-opacity duration-200 starting:opacity-0';

const REMOVE =
  'focus-visible:ring-ring/25 hover:bg-foreground/[0.08] text-muted-foreground hover:text-foreground flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors duration-150 outline-none focus-visible:ring-[3px]';

const LONE_HINT =
  'text-destructive-ink text-xs transition-[opacity,translate] duration-200 ease-(--ease-out-strong) starting:-translate-y-0.5 starting:opacity-0';

/** The hint of one field, when the last refusal was about it. */
function hintFor(hint: Hint | null, field: HintField) {
  if (hint?.field === field) {
    return hint;
  }
  return null;
}

function describedByOf(hint: Hint | null, hintId: string) {
  if (hint) {
    return hintId;
  }
  return undefined;
}

function toolToneOf(isConnected: boolean) {
  if (isConnected) {
    return 'bg-success/[0.08]';
  }
  return 'bg-foreground/[0.04]';
}

/** Connect Notion, Connecting Notion, Notion connected: the name says which tool the button is for. */
function connectLabelOf(status: ConnectStatus, name: string) {
  if (status === 'connected') {
    return `${name} connected`;
  }
  const morph = CONNECT_STATE[status];
  const word = CONNECT_LABELS[morph];
  return `${word} ${name}`;
}

/** The first tool takes the focus when Continue finds nothing connected, and says the hint. */
function fieldMarkOf(isFirst: boolean) {
  if (isFirst) {
    return 'tools';
  }
  return undefined;
}

function firstOnlyOf(isFirst: boolean, id: string | undefined) {
  if (isFirst) {
    return id;
  }
  return undefined;
}

type ToolRowProps = {
  tool: Tool;
  status: ConnectStatus;
  isFirst: boolean;
  /** The id of the hint of the step, while it shows. */
  shownHintId: string | undefined;
  isPressed: boolean;
  onConnect: (tool: ToolId) => void;
  onDisconnect: (tool: ToolId) => void;
};

function ToolRow({
  tool,
  status,
  isFirst,
  shownHintId,
  isPressed,
  onConnect,
  onDisconnect,
}: ToolRowProps) {
  const isConnected = status === 'connected';
  const describedBy = firstOnlyOf(isFirst, shownHintId);

  return (
    <li className={cn(TOOL_ROW, toolToneOf(isConnected))}>
      <BrandTile brand={tool.brand} size='lg' />
      <div className='flex min-w-0 flex-1 flex-col'>
        <p className='truncate text-[13px] font-medium'>{tool.name}</p>
        <p className='text-muted-foreground truncate text-xs'>{tool.shares}</p>
      </div>
      <MorphButton
        type='button'
        size='sm'
        variant='outline'
        data-connect={tool.id}
        data-field={fieldMarkOf(isFirst)}
        aria-label={connectLabelOf(status, tool.name)}
        aria-describedby={describedBy}
        state={CONNECT_STATE[status]}
        labels={CONNECT_LABELS}
        idleIcon={<PlugIcon />}
        onClick={() => onConnect(tool.id)}
        className={pressedQuietOf(isPressed)}
      />
      <span className='flex size-7 shrink-0 items-center justify-center'>
        {isConnected && (
          <Button
            type='button'
            variant='ghost'
            size='icon-sm'
            aria-label={`Disconnect ${tool.name}`}
            onClick={() => onDisconnect(tool.id)}
            className='text-muted-foreground transition-[opacity,color,background-color,scale] duration-200 starting:opacity-0'
          >
            <XIcon />
          </Button>
        )}
      </span>
    </li>
  );
}

export type ToolsStepProps = {
  tools: Record<ToolId, ConnectStatus>;
  hint: Hint | null;
  /** Counts the refused entries: a hint that comes back after a new try arrives again. */
  attempts: number;
  pressed: string | null;
  onConnect: (tool: ToolId) => void;
  onDisconnect: (tool: ToolId) => void;
};

export function ToolsStep({
  tools,
  hint,
  attempts,
  pressed,
  onConnect,
  onDisconnect,
}: ToolsStepProps) {
  const hintId = useId();
  const toolsHint = hintFor(hint, 'tools');
  const shownHintId = describedByOf(toolsHint, hintId);

  return (
    <div className='flex flex-col gap-2'>
      <ul aria-label='Tools' className='flex flex-col gap-1.5'>
        {TOOLS.map((tool, index) => (
          <ToolRow
            key={tool.id}
            tool={tool}
            status={tools[tool.id]}
            isFirst={index === 0}
            shownHintId={shownHintId}
            isPressed={pressed === `connect-${tool.id}`}
            onConnect={onConnect}
            onDisconnect={onDisconnect}
          />
        ))}
      </ul>
      {toolsHint && (
        <p key={attempts} id={hintId} className={LONE_HINT}>
          {toolsHint.message}
        </p>
      )}
    </div>
  );
}

export type TeamStepProps = {
  invites: string[];
  draft: string;
  hint: Hint | null;
  attempts: number;
  pressed: string | null;
  onType: (field: TextField, value: string) => void;
  onCommit: () => void;
  onRemove: (address: string) => void;
};

export function TeamStep({
  invites,
  draft,
  hint,
  attempts,
  pressed,
  onType,
  onCommit,
  onRemove,
}: TeamStepProps) {
  const invitesHint = hintFor(hint, 'invites');
  const hasInvites = invites.length > 0;

  function typeAddress(value: string) {
    onType('inviteDraft', value);
    if (ENDS_AN_ADDRESS.test(value)) {
      onCommit();
    }
  }

  /** Enter adds what the box holds. On an empty box it is left alone, and the step goes on. */
  function addOnEnter(event: React.KeyboardEvent<HTMLInputElement>) {
    const isBoxEmpty = draft.trim() === '';
    if (event.key !== 'Enter' || isBoxEmpty) {
      return;
    }
    event.preventDefault();
    onCommit();
  }

  return (
    <div className='flex flex-col gap-3'>
      <Field invalid={Boolean(invitesHint)}>
        <FieldLabel>Email addresses</FieldLabel>
        <div className='flex items-center gap-2'>
          <Input
            data-field='invites'
            inputMode='email'
            autoComplete='off'
            autoCapitalize='none'
            spellCheck={false}
            placeholder='name@company.com'
            value={draft}
            onChange={(event) => typeAddress(event.target.value)}
            onKeyDown={addOnEnter}
          />
          <Button
            type='button'
            variant='outline'
            onClick={onCommit}
            className={cn('shrink-0', pressedQuietOf(pressed === 'add-invite'))}
          >
            Add
          </Button>
        </div>
        {invitesHint && (
          <FieldError key={attempts} match>
            {invitesHint.message}
          </FieldError>
        )}
        {!invitesHint && (
          <FieldDescription>
            Press Enter after each address, or paste several at once
          </FieldDescription>
        )}
      </Field>
      <div className='flex min-h-7 items-center'>
        {!hasInvites && (
          <p className='text-muted-foreground text-xs'>Nobody is invited yet</p>
        )}
        {hasInvites && (
          <ul
            aria-label='People to invite'
            className='flex min-w-0 flex-wrap gap-1.5'
          >
            {invites.map((address) => (
              <li key={address} className={INVITED}>
                <MailIcon
                  aria-hidden='true'
                  className='text-muted-foreground size-3.5 shrink-0'
                />
                <span className='min-w-0 truncate'>{address}</span>
                <button
                  type='button'
                  aria-label={`Remove ${address}`}
                  onClick={() => onRemove(address)}
                  className={REMOVE}
                >
                  <XIcon className='size-3.5' />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export type AgentStepProps = {
  agentName: string;
  model: ModelId;
  job: string;
  hint: Hint | null;
  attempts: number;
  onType: (field: TextField, value: string) => void;
  onPickModel: (model: ModelId) => void;
};

export function AgentStep({
  agentName,
  model,
  job,
  hint,
  attempts,
  onType,
  onPickModel,
}: AgentStepProps) {
  const modelsId = useId();
  const nameHint = hintFor(hint, 'agentName');
  const jobHint = hintFor(hint, 'job');

  function pick(value: unknown) {
    const picked = MODELS.find((candidate) => candidate.id === value);
    if (picked) {
      onPickModel(picked.id);
    }
  }

  return (
    <div className='flex flex-col gap-4'>
      <Field invalid={Boolean(nameHint)}>
        <FieldLabel>Name</FieldLabel>
        <div className='flex items-center gap-2'>
          <MeshTile
            seed={AGENT_SEED}
            color={seriesColorOf(AGENT_SERIES)}
            size='lg'
          />
          <Input
            data-field='agentName'
            autoComplete='off'
            placeholder='What your team will call it'
            value={agentName}
            onChange={(event) => onType('agentName', event.target.value)}
          />
        </div>
        {nameHint && (
          <FieldError key={attempts} match>
            {nameHint.message}
          </FieldError>
        )}
      </Field>
      <div className='flex flex-col gap-1.5'>
        <p id={modelsId} className={LABEL_RECIPE}>
          Model
        </p>
        <RadioGroup
          aria-labelledby={modelsId}
          value={model}
          onValueChange={pick}
          className='grid-cols-1 gap-2 @md:grid-cols-3'
        >
          {MODELS.map((candidate) => {
            const itemId = `${modelsId}-${candidate.id}`;
            return (
              <div key={candidate.id} className={MODEL_CHOICE}>
                <RadioGroupItem
                  id={itemId}
                  value={candidate.id}
                  className='order-1 after:absolute after:inset-0 after:rounded-lg'
                />
                <BrandTile brand={candidate.brand} size='lg' />
                <div className='flex min-w-0 flex-1 flex-col gap-1'>
                  <Label htmlFor={itemId}>{candidate.name}</Label>
                  <p className='text-muted-foreground truncate text-xs'>
                    {candidate.maker}
                  </p>
                </div>
              </div>
            );
          })}
        </RadioGroup>
      </div>
      <Field invalid={Boolean(jobHint)}>
        <FieldLabel>Its job</FieldLabel>
        <Input
          data-field='job'
          autoComplete='off'
          maxLength={JOB_MAX_LENGTH}
          placeholder='One sentence, the way you would ask a teammate'
          value={job}
          onChange={(event) => onType('job', event.target.value)}
        />
        {jobHint && (
          <FieldError key={attempts} match>
            {jobHint.message}
          </FieldError>
        )}
        {!jobHint && (
          <FieldDescription>
            It runs once with your tools as soon as it is created
          </FieldDescription>
        )}
      </Field>
    </div>
  );
}
