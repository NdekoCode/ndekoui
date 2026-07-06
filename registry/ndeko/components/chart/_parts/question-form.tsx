'use client';

import { useId } from 'react';

import { pressedSolidOf } from '@/registry/ndeko/lib/demonstration';
import { Button } from '@/registry/ndeko/ui/button';
import { Input } from '@/registry/ndeko/ui/input';

type QuestionFormProps = {
  value: string;
  onValueChange: (value: string) => void;
  onSubmit: (value: string) => void;
  /** What the field is for, for screen readers. */
  label: string;
  placeholder: string;
  submitLabel: string;
  isSubmitDisabled: boolean;
  /** Shows the button held down, for a demonstration that presses it. */
  isSubmitPressed?: boolean;
  /** Said under the field after an entry that gave nothing: what to try next. */
  hint?: string | null;
};

function describedByOf(hasHint: boolean, hintId: string) {
  if (hasHint) {
    return hintId;
  }
  return undefined;
}

/** A field of one line and its button, with the hint an entry that gave nothing leaves under it. */
export function QuestionForm({
  value,
  onValueChange,
  onSubmit,
  label,
  placeholder,
  submitLabel,
  isSubmitDisabled,
  isSubmitPressed = false,
  hint = null,
}: QuestionFormProps) {
  const fieldId = useId();
  const hintId = useId();
  const hasHint = hint !== null;

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(value);
  }

  return (
    <>
      <form onSubmit={submit} className='flex items-center gap-2'>
        <label htmlFor={fieldId} className='sr-only'>
          {label}
        </label>
        <Input
          id={fieldId}
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          placeholder={placeholder}
          autoComplete='off'
          aria-describedby={describedByOf(hasHint, hintId)}
          className='min-w-0 flex-1'
        />
        <Button
          type='submit'
          disabled={isSubmitDisabled}
          className={pressedSolidOf(isSubmitPressed)}
        >
          {submitLabel}
        </Button>
      </form>
      {hasHint && (
        <p id={hintId} className='text-muted-foreground text-xs text-pretty'>
          {hint}
        </p>
      )}
    </>
  );
}
