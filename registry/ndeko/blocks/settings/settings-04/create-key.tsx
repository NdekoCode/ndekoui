'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useId } from 'react';

import {
  pressedQuietOf,
  pressedSolidOf,
} from '@/registry/ndeko/lib/demonstration';
import {
  CheckIcon,
  CopyIcon,
  TriangleAlertIcon,
} from '@/registry/ndeko/lib/icons';
import { fadePresence } from '@/registry/ndeko/lib/motion-presets';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Button } from '@/registry/ndeko/ui/button';
import { Swap } from '@/registry/ndeko/ui/chat-motion';
import { Input } from '@/registry/ndeko/ui/input';
import { Label } from '@/registry/ndeko/ui/label';
import { MorphButton, type MorphState } from '@/registry/ndeko/ui/morph-button';
import { Segments, type Segment } from '@/registry/ndeko/ui/segments';
import { Wash } from '@/registry/ndeko/ui/wash';

import {
  ACCESS_LABEL,
  ENVIRONMENT_LABEL,
  NAME_MAX_LENGTH,
  type Access,
  type Environment,
} from './data';
import type { CreateStatus, KeysAction, KeysState, Secret } from './session';
import { describedByOf, ErrorLine } from './settings-frame';

const ENVIRONMENTS: Segment<Environment>[] = [
  { value: 'live', label: ENVIRONMENT_LABEL.live },
  { value: 'test', label: ENVIRONMENT_LABEL.test },
];

const ACCESSES: Segment<Access>[] = [
  { value: 'full', label: ACCESS_LABEL.full },
  { value: 'read', label: ACCESS_LABEL.read },
];

const ENVIRONMENT_LINE: Record<Environment, string> = {
  live: 'Reaches your real data and is billed',
  test: 'Reaches a sandbox and costs nothing',
};

const CREATE_LABELS: Record<MorphState, string> = {
  idle: 'Create key',
  busy: 'Creating',
  done: 'Created',
};

function morphOf(status: CreateStatus): MorphState {
  if (status === 'creating') {
    return 'busy';
  }
  return 'idle';
}

function isFormStatus(status: CreateStatus) {
  const isEditing = status === 'editing';
  const isCreating = status === 'creating';
  return isEditing || isCreating;
}

function shownSecretOf(state: KeysState) {
  if (state.status !== 'revealed') {
    return null;
  }
  return state.secret;
}

function copyLabelOf(isCopied: boolean) {
  if (isCopied) {
    return 'Copied';
  }
  return 'Copy key';
}

type KeyFormProps = {
  state: KeysState;
  pressed: string | null;
  onAction: (action: KeysAction) => void;
  onSubmit: () => void;
  onClose: () => void;
};

function KeyForm({
  state,
  pressed,
  onAction,
  onSubmit,
  onClose,
}: KeyFormProps) {
  const nameId = useId();
  const errorId = useId();
  const draft = state.draft;
  const isCreating = state.status === 'creating';
  const hasError = state.nameError !== null;
  const environmentLine = ENVIRONMENT_LINE[draft.environment];

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  function closeOnEscape(event: React.KeyboardEvent<HTMLFormElement>) {
    if (event.key !== 'Escape') {
      return;
    }
    event.preventDefault();
    onClose();
  }

  return (
    <form
      noValidate
      onSubmit={submit}
      onKeyDown={closeOnEscape}
      className='bg-foreground/[0.025] flex flex-col gap-4 p-4'
    >
      <div className='flex flex-col gap-1.5'>
        <Label htmlFor={nameId}>Name</Label>
        <Input
          id={nameId}
          data-key-name
          value={draft.name}
          maxLength={NAME_MAX_LENGTH}
          autoComplete='off'
          spellCheck={false}
          placeholder='Where the key is used'
          readOnly={isCreating}
          aria-invalid={hasError}
          aria-describedby={describedByOf(hasError, errorId)}
          onChange={(event) =>
            onAction({ type: 'named', value: event.target.value })
          }
          className='@lg:max-w-80'
        />
        <ErrorLine
          id={errorId}
          error={state.nameError}
          attempts={state.attempts}
        />
      </div>
      <div className='flex flex-wrap gap-x-8 gap-y-4'>
        <div className='flex flex-col gap-1.5'>
          <span className='text-[13px] leading-none font-medium'>
            Environment
          </span>
          <Segments
            value={draft.environment}
            segments={ENVIRONMENTS}
            label='Environment'
            onValueChange={(environment) =>
              onAction({ type: 'environmentPicked', environment })
            }
            className='w-fit'
          />
          <span className='text-muted-foreground flex text-xs'>
            <Swap swapKey={draft.environment}>{environmentLine}</Swap>
          </span>
        </div>
        <div className='flex flex-col gap-1.5'>
          <span className='text-[13px] leading-none font-medium'>Access</span>
          <Segments
            value={draft.access}
            segments={ACCESSES}
            label='Access'
            onValueChange={(access) =>
              onAction({ type: 'accessPicked', access })
            }
            className='w-fit'
          />
        </div>
      </div>
      <div className='flex flex-wrap items-center justify-end gap-2'>
        <Button
          type='button'
          variant='ghost'
          disabled={isCreating}
          onClick={onClose}
        >
          Cancel
        </Button>
        <MorphButton
          type='submit'
          state={morphOf(state.status)}
          labels={CREATE_LABELS}
          className={pressedSolidOf(pressed === 'submit')}
        />
      </div>
    </form>
  );
}

type SecretPanelProps = {
  secret: Secret;
  pressed: string | null;
  onCopy: () => void;
  onHide: () => void;
};

/** Waits on the person until they hide it, so it wears the warning wash while it is there. */
function SecretPanel({ secret, pressed, onCopy, onHide }: SecretPanelProps) {
  const isCopied = secret.isCopied;
  const copyLabel = copyLabelOf(isCopied);

  return (
    <div className='relative isolate flex flex-col gap-3 p-4'>
      <Wash color='var(--warning)' />
      <p className='flex items-start gap-2 text-[13px] text-pretty'>
        <TriangleAlertIcon className='text-warning-foreground mt-0.5 size-4 shrink-0' />
        <span>
          <span className='font-medium'>{`Copy the key for ${secret.name} now.`}</span>{' '}
          It is shown once: after you hide it, only its last four characters
          stay.
        </span>
      </p>
      <div className='bg-foreground/[0.05] flex flex-wrap items-center gap-2 rounded-lg p-1.5 ps-3'>
        <code className='min-w-0 flex-1 basis-48 font-mono text-[13px] break-all select-all'>
          {secret.value}
        </code>
        <Button
          type='button'
          size='sm'
          data-secret-copy
          onClick={onCopy}
          className={pressedSolidOf(pressed === 'copy')}
        >
          <Swap swapKey={String(isCopied)}>
            {isCopied && <CheckIcon />}
            {!isCopied && <CopyIcon />}
          </Swap>
          <AnimatedSize as='span' axis='width' contentClassName='relative flex'>
            <Swap swapKey={copyLabel}>{copyLabel}</Swap>
          </AnimatedSize>
        </Button>
      </div>
      <div className='flex flex-wrap items-center justify-between gap-x-4 gap-y-2'>
        <p className='text-muted-foreground text-xs'>
          A sample key: it opens nothing in this preview
        </p>
        <Button
          type='button'
          variant='outline'
          size='sm'
          onClick={onHide}
          className={pressedQuietOf(pressed === 'hide')}
        >
          Hide key
        </Button>
      </div>
    </div>
  );
}

type CreateSlotProps = {
  state: KeysState;
  pressed: string | null;
  onAction: (action: KeysAction) => void;
  onSubmit: () => void;
  onClose: () => void;
  onCopy: () => void;
  onHide: () => void;
};

/** The top of the card grows into the form, the form gives way to the secret, then it all folds away. */
export function CreateSlot({
  state,
  pressed,
  onAction,
  onSubmit,
  onClose,
  onCopy,
  onHide,
}: CreateSlotProps) {
  const fade = fadePresence();
  const isForm = isFormStatus(state.status);
  const secret = shownSecretOf(state);

  return (
    <AnimatedSize contentClassName='relative'>
      <AnimatePresence mode='popLayout' initial={false}>
        {isForm && (
          <motion.div key='form' {...fade}>
            <KeyForm
              state={state}
              pressed={pressed}
              onAction={onAction}
              onSubmit={onSubmit}
              onClose={onClose}
            />
          </motion.div>
        )}
        {secret && (
          <motion.div key='secret' {...fade}>
            <SecretPanel
              secret={secret}
              pressed={pressed}
              onCopy={onCopy}
              onHide={onHide}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </AnimatedSize>
  );
}
