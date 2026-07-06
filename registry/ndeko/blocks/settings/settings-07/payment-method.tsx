'use client';

import { useId } from 'react';

import { BrandLogo } from '@/registry/ndeko/lib/brand-logos';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import { Fold, Swap } from '@/registry/ndeko/ui/chat-motion';
import { Input } from '@/registry/ndeko/ui/input';
import { Label } from '@/registry/ndeko/ui/label';
import { MorphButton, type MorphState } from '@/registry/ndeko/ui/morph-button';

import { CARD_BRAND_NAME, type Card } from './data';
import type {
  BillingAction,
  BillingState,
  CardErrors,
  CardField,
} from './session';
import { describedByOf, ErrorLine, SURFACE } from './settings-frame';

const SAVE_LABELS: Record<MorphState, string> = {
  idle: 'Save card',
  busy: 'Checking',
  done: 'Saved',
};

function saveStateOf(isSaving: boolean): MorphState {
  if (isSaving) {
    return 'busy';
  }
  return 'idle';
}

/** A card face drawn with the page's own materials: the network's mark, a chip, the last digits. */
function CardFace({ card }: { card: Card }) {
  return (
    <div
      aria-hidden='true'
      className='bg-card hairline-ring ring-border dark:bg-foreground/[0.06] relative flex aspect-[86/54] w-40 shrink-0 flex-col justify-between rounded-xl p-3 shadow-[0_1px_2px_rgb(0_0_0/0.06),0_4px_12px_-4px_rgb(0_0_0/0.08)]'
    >
      <div className='flex items-start justify-between'>
        <span className='keycap-3d h-5 w-7 rounded-[5px]' />
        <Swap swapKey={card.brand}>
          <BrandLogo brand={card.brand} className='size-7' />
        </Swap>
      </div>
      <div className='flex items-end justify-between gap-2 font-mono text-[11px] tabular-nums'>
        <span className='flex items-center gap-1'>
          <span className='text-muted-foreground'>••••</span>
          <Swap swapKey={card.last4}>{card.last4}</Swap>
        </span>
        <Swap swapKey={card.expiry} className='text-muted-foreground'>
          {card.expiry}
        </Swap>
      </div>
    </div>
  );
}

type CardInputProps = {
  field: CardField;
  label: string;
  value: string;
  errors: CardErrors;
  attempts: number;
  placeholder: string;
  autoComplete: string;
  maxLength: number;
  isLocked: boolean;
  onAction: (action: BillingAction) => void;
};

function CardInput({
  field,
  label,
  value,
  errors,
  attempts,
  placeholder,
  autoComplete,
  maxLength,
  isLocked,
  onAction,
}: CardInputProps) {
  const inputId = useId();
  const errorId = useId();
  const error = errors[field] ?? null;
  const hasError = error !== null;

  return (
    <div className='flex min-w-0 flex-col gap-1.5'>
      <Label htmlFor={inputId}>{label}</Label>
      <Input
        id={inputId}
        data-card-field={field}
        value={value}
        inputMode='numeric'
        autoComplete={autoComplete}
        placeholder={placeholder}
        maxLength={maxLength}
        spellCheck={false}
        readOnly={isLocked}
        aria-invalid={hasError}
        aria-describedby={describedByOf(hasError, errorId)}
        onChange={(event) =>
          onAction({ type: 'cardTyped', field, value: event.target.value })
        }
        className='font-mono'
      />
      <ErrorLine id={errorId} error={error} attempts={attempts} />
    </div>
  );
}

type CardFormProps = {
  state: BillingState;
  onAction: (action: BillingAction) => void;
  onSave: () => void;
  onClose: () => void;
};

function CardForm({ state, onAction, onSave, onClose }: CardFormProps) {
  const draft = state.cardDraft;
  const isSaving = state.isSavingCard;
  const shared = {
    errors: state.cardErrors,
    attempts: state.cardAttempts,
    isLocked: isSaving,
    onAction,
  };

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSave();
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
      className='bg-foreground/[0.03] flex flex-col gap-3 rounded-lg p-3'
    >
      <div className='grid gap-3 @lg:grid-cols-[minmax(0,1fr)_6.5rem_6rem]'>
        <CardInput
          field='number'
          label='Card number'
          value={draft.number}
          placeholder='1234 1234 1234 1234'
          autoComplete='cc-number'
          maxLength={23}
          {...shared}
        />
        <CardInput
          field='expiry'
          label='Expiry'
          value={draft.expiry}
          placeholder='MM/YY'
          autoComplete='cc-exp'
          maxLength={7}
          {...shared}
        />
        <CardInput
          field='cvc'
          label='Security code'
          value={draft.cvc}
          placeholder='123'
          autoComplete='cc-csc'
          maxLength={4}
          {...shared}
        />
      </div>
      <div className='flex flex-wrap items-center justify-between gap-x-4 gap-y-2'>
        <p className='text-muted-foreground min-w-0 flex-1 basis-48 text-xs text-pretty'>
          A sample form: what you type never leaves this page
        </p>
        <div className='flex gap-2'>
          <Button
            type='button'
            variant='ghost'
            size='sm'
            disabled={isSaving}
            onClick={onClose}
          >
            Close
          </Button>
          <MorphButton
            type='submit'
            size='sm'
            state={saveStateOf(isSaving)}
            labels={SAVE_LABELS}
          />
        </div>
      </div>
    </form>
  );
}

type PaymentMethodProps = {
  state: BillingState;
  onAction: (action: BillingAction) => void;
  onToggle: () => void;
  onSave: () => void;
};

export function PaymentMethod({
  state,
  onAction,
  onToggle,
  onSave,
}: PaymentMethodProps) {
  const card = state.card;
  const summary = `${CARD_BRAND_NAME[card.brand]} ending in ${card.last4}`;
  const expiryLine = `Expires ${card.expiry}. Pays every invoice of the workspace`;

  return (
    <div className={cn(SURFACE, 'flex flex-col gap-4 p-4 @xl:p-5')}>
      <div className='flex flex-wrap items-center gap-4'>
        <CardFace card={card} />
        <div className='flex min-w-0 flex-1 basis-40 flex-col gap-0.5'>
          <p className='flex text-[13px] font-medium'>
            <Swap swapKey={summary}>{summary}</Swap>
          </p>
          <p className='text-muted-foreground text-xs text-pretty'>
            {expiryLine}
          </p>
        </div>
        <Button
          type='button'
          variant='outline'
          size='sm'
          data-update-card
          aria-expanded={state.isEditingCard}
          disabled={state.isSavingCard}
          onClick={onToggle}
        >
          Update card
        </Button>
      </div>
      <Fold open={state.isEditingCard}>
        <CardForm
          state={state}
          onAction={onAction}
          onSave={onSave}
          onClose={onToggle}
        />
      </Fold>
    </div>
  );
}
