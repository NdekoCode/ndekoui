'use client';

import type { ChangeEvent, FormEvent, RefObject } from 'react';

import { pressedSolidOf } from '@/registry/ndeko/lib/demonstration';
import { Button } from '@/registry/ndeko/ui/button';
import { Swap } from '@/registry/ndeko/ui/chat-motion';
import { Field, FieldError, FieldLabel } from '@/registry/ndeko/ui/field';
import { Input } from '@/registry/ndeko/ui/input';
import { MorphButton } from '@/registry/ndeko/ui/morph-button';

import { BUTTON_LABELS, HERO, type Status } from './data';

function noteKeyOf(isDone: boolean) {
  if (isDone) {
    return 'done';
  }
  return 'note';
}

type EmailFormProps = {
  email: string;
  status: Status;
  error: string | null;
  isPressed: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
  onEmailChange: (value: string) => void;
  onSubmit: () => void;
  onUseAnother: () => void;
};

export function EmailForm({
  email,
  status,
  error,
  isPressed,
  inputRef,
  onEmailChange,
  onSubmit,
  onUseAnother,
}: EmailFormProps) {
  const hasError = error !== null;
  const isIdle = status === 'idle';
  const isDone = status === 'done';
  const noteKey = noteKeyOf(isDone);

  function change(event: ChangeEvent<HTMLInputElement>) {
    onEmailChange(event.target.value);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form
      noValidate
      onSubmit={submit}
      className='flex w-full max-w-md flex-col gap-2'
    >
      <Field invalid={hasError}>
        <FieldLabel className='sr-only'>{HERO.emailLabel}</FieldLabel>
        <div className='flex flex-col gap-2 @md:flex-row'>
          <Input
            ref={inputRef}
            type='email'
            name='email'
            size='lg'
            autoComplete='email'
            placeholder={HERO.emailPlaceholder}
            value={email}
            onChange={change}
            readOnly={!isIdle}
          />
          <MorphButton
            type='submit'
            size='lg'
            state={status}
            labels={BUTTON_LABELS}
            className={pressedSolidOf(isPressed)}
          />
        </div>
        {hasError && <FieldError match>{error}</FieldError>}
      </Field>
      <Swap
        swapKey={noteKey}
        className='text-muted-foreground min-h-5 justify-center text-xs'
      >
        {!isDone && <span>{HERO.note}</span>}
        {isDone && (
          <span className='flex flex-wrap items-center justify-center gap-x-2'>
            <span>{HERO.doneNote}</span>
            <Button
              type='button'
              variant='link'
              onClick={onUseAnother}
              className='h-auto p-0 text-xs'
            >
              {HERO.useAnother}
            </Button>
          </span>
        )}
      </Swap>
    </form>
  );
}
