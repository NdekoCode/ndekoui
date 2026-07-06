'use client';

import { useId } from 'react';

import { pressedQuietOf } from '@/registry/ndeko/lib/demonstration';
import { MailIcon, XIcon } from '@/registry/ndeko/lib/icons';
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
import { RadioGroup, RadioGroupItem } from '@/registry/ndeko/ui/radio-group';
import { Segments } from '@/registry/ndeko/ui/segments';

import { ROLES, SOURCES, URL_PREFIX, type Fields } from './data';
import type { WizardAction } from './session';
import type { Errors } from './validate';

/** A tray inside the card, tinted when its source is the one picked. The whole tray answers the press. */
const CHOICE =
  'bg-foreground/[0.04] has-data-checked:bg-primary/[0.08] relative flex items-center gap-3 rounded-lg p-3 transition-[background-color,scale] duration-150';

/** Someone invited has not joined yet: a dashed slot with an envelope, since nobody is there. */
const INVITED =
  'hairline-border border-foreground/25 flex h-7 max-w-full items-center gap-1.5 rounded-full border-dashed ps-2.5 pe-0.5 text-xs transition-opacity duration-200 starting:opacity-0';

const REMOVE =
  'focus-visible:ring-ring/25 hover:bg-foreground/[0.08] text-muted-foreground hover:text-foreground flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors duration-150 outline-none focus-visible:ring-[3px]';

const LONE_ERROR =
  'text-destructive-ink text-xs transition-[opacity,translate] duration-200 ease-(--ease-out-strong) starting:-translate-y-0.5 starting:opacity-0';

/** A space, a comma or a semicolon ends an address as it is typed. */
const ENDS_AN_ADDRESS = /[\s,;]$/;

export type StepBodyProps = {
  fields: Fields;
  errors: Errors;
  /** Counts the refused entries: a message that comes back after a new try arrives again. */
  attempts: number;
  pressed: string | null;
  onAction: (action: WizardAction) => void;
};

export function WorkspaceStep({
  fields,
  errors,
  attempts,
  onAction,
}: StepBodyProps) {
  return (
    <div className='flex flex-col gap-4'>
      <Field invalid={Boolean(errors.name)}>
        <FieldLabel>Workspace name</FieldLabel>
        <Input
          data-field='name'
          autoComplete='organization'
          placeholder='The name of your company or team'
          value={fields.name}
          onChange={(event) =>
            onAction({
              type: 'typed',
              field: 'name',
              value: event.target.value,
            })
          }
        />
        {errors.name && (
          <FieldError key={attempts} match>
            {errors.name}
          </FieldError>
        )}
      </Field>
      <Field invalid={Boolean(errors.slug)}>
        <FieldLabel>Workspace address</FieldLabel>
        <div className='flex items-center gap-2'>
          <span className='text-muted-foreground shrink-0 text-[13px]'>
            {URL_PREFIX}
          </span>
          <Input
            data-field='slug'
            autoComplete='off'
            autoCapitalize='none'
            spellCheck={false}
            placeholder='your-workspace'
            value={fields.slug}
            onChange={(event) =>
              onAction({
                type: 'typed',
                field: 'slug',
                value: event.target.value,
              })
            }
          />
        </div>
        {errors.slug && (
          <FieldError key={attempts} match>
            {errors.slug}
          </FieldError>
        )}
        {!errors.slug && (
          <FieldDescription>
            It follows the name until you change it
          </FieldDescription>
        )}
      </Field>
    </div>
  );
}

/** The first source carries the mark the focus goes to when no source is picked. */
function fieldMarkOf(index: number) {
  if (index === 0) {
    return 'source';
  }
  return undefined;
}

function describedByOf(hasError: boolean, errorId: string) {
  if (hasError) {
    return errorId;
  }
  return undefined;
}

export function SourceStep({
  fields,
  errors,
  attempts,
  pressed,
  onAction,
}: StepBodyProps) {
  const groupId = useId();
  const errorId = `${groupId}-error`;
  const hasSourceError = Boolean(errors.source);

  function pick(value: unknown) {
    const source = SOURCES.find((candidate) => candidate.id === value);
    if (source) {
      onAction({ type: 'sourcePicked', source: source.id });
    }
  }

  return (
    <div className='flex flex-col gap-4'>
      <div className='flex flex-col gap-2'>
        <RadioGroup
          aria-label='Data source'
          aria-describedby={describedByOf(hasSourceError, errorId)}
          value={fields.source ?? ''}
          onValueChange={pick}
          className='grid-cols-1 gap-2 @md:grid-cols-2'
        >
          {SOURCES.map((source, index) => {
            const itemId = `${groupId}-${source.id}`;
            return (
              <div
                key={source.id}
                className={cn(
                  CHOICE,
                  pressedQuietOf(pressed === `source-${source.id}`)
                )}
              >
                <RadioGroupItem
                  id={itemId}
                  value={source.id}
                  data-field={fieldMarkOf(index)}
                  className='order-1 after:absolute after:inset-0 after:rounded-lg'
                />
                <BrandTile brand={source.brand} size='lg' />
                <div className='flex min-w-0 flex-1 flex-col gap-1'>
                  <Label htmlFor={itemId}>{source.name}</Label>
                  <p className='text-muted-foreground text-xs'>{source.kind}</p>
                </div>
              </div>
            );
          })}
        </RadioGroup>
        {errors.source && (
          <p key={attempts} id={errorId} className={LONE_ERROR}>
            {errors.source}
          </p>
        )}
      </div>
      <Field invalid={Boolean(errors.connection)}>
        <FieldLabel>Connection name</FieldLabel>
        <Input
          data-field='connection'
          autoComplete='off'
          value={fields.connection}
          onChange={(event) =>
            onAction({
              type: 'typed',
              field: 'connection',
              value: event.target.value,
            })
          }
        />
        {errors.connection && (
          <FieldError key={attempts} match>
            {errors.connection}
          </FieldError>
        )}
      </Field>
    </div>
  );
}

type TeamStepProps = StepBodyProps & {
  onRemoveInvite: (address: string) => void;
};

export function TeamStep({
  fields,
  errors,
  attempts,
  pressed,
  onAction,
  onRemoveInvite,
}: TeamStepProps) {
  const hasInvites = fields.invites.length > 0;

  function typeAddress(value: string) {
    onAction({ type: 'typed', field: 'inviteDraft', value });
    if (ENDS_AN_ADDRESS.test(value)) {
      onAction({ type: 'inviteCommitted' });
    }
  }

  /** Enter adds what the box holds. On an empty box it is left alone, and goes on to the next step. */
  function addOnEnter(event: React.KeyboardEvent<HTMLInputElement>) {
    const isBoxEmpty = fields.inviteDraft.trim() === '';
    if (event.key !== 'Enter' || isBoxEmpty) {
      return;
    }
    event.preventDefault();
    onAction({ type: 'inviteCommitted' });
  }

  function changeRole(role: Fields['role']) {
    onAction({ type: 'rolePicked', role });
  }

  return (
    <div className='flex flex-col gap-4'>
      <Field invalid={Boolean(errors.invites)}>
        <FieldLabel>Email addresses</FieldLabel>
        <div className='flex items-center gap-2'>
          <Input
            data-field='invites'
            inputMode='email'
            autoComplete='off'
            autoCapitalize='none'
            spellCheck={false}
            placeholder='name@company.com'
            value={fields.inviteDraft}
            onChange={(event) => typeAddress(event.target.value)}
            onKeyDown={addOnEnter}
          />
          <Button
            type='button'
            variant='outline'
            onClick={() => onAction({ type: 'inviteCommitted' })}
            className={cn('shrink-0', pressedQuietOf(pressed === 'add-invite'))}
          >
            Add
          </Button>
        </div>
        {errors.invites && (
          <FieldError key={attempts} match>
            {errors.invites}
          </FieldError>
        )}
        {!errors.invites && (
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
            {fields.invites.map((address) => (
              <li key={address} className={INVITED}>
                <MailIcon
                  aria-hidden='true'
                  className='text-muted-foreground size-3.5 shrink-0'
                />
                <span className='min-w-0 truncate'>{address}</span>
                <button
                  type='button'
                  aria-label={`Remove ${address}`}
                  onClick={() => onRemoveInvite(address)}
                  className={REMOVE}
                >
                  <XIcon className='size-3.5' />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className='flex flex-col items-start gap-1.5'>
        <p className={LABEL_RECIPE}>They join as</p>
        <Segments
          value={fields.role}
          segments={ROLES}
          onValueChange={changeRole}
          label='Role of the people you invite'
        />
      </div>
    </div>
  );
}
