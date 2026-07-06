'use client';

import { Fragment, useId } from 'react';

import {
  pressedQuietOf,
  pressedSolidOf,
} from '@/registry/ndeko/lib/demonstration';
import { ShieldCheckIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import { Fold, Swap } from '@/registry/ndeko/ui/chat-motion';
import { CopyButton } from '@/registry/ndeko/ui/copy-button';
import { LetterTile } from '@/registry/ndeko/ui/letter-tile';
import { MorphButton, type MorphState } from '@/registry/ndeko/ui/morph-button';
import {
  OTPField,
  OTPFieldInput,
  OTPFieldSeparator,
} from '@/registry/ndeko/ui/otp-field';
import { Switch } from '@/registry/ndeko/ui/switch';

import { CODE_LENGTH, SETUP_KEY, SETUP_KEY_TEXT, TODAY } from './data';
import {
  isTwoStepSwitchedOn,
  type SecurityState,
  type TwoStep,
} from './session';
import { describedByOf, ErrorLine, SURFACE } from './settings-frame';

const SLOTS = Array.from({ length: CODE_LENGTH }, (_, index) => index);

const SEPARATOR_AFTER = 2;

const VERIFY_LABELS: Record<MorphState, string> = {
  idle: 'Turn on',
  busy: 'Checking',
  done: 'Turned on',
};

const LINE: Record<TwoStep, string> = {
  off: 'Ask for a code from an authenticator app when you sign in on a new device',
  setup: 'Finish the two steps below to turn it on',
  verifying: 'Finish the two steps below to turn it on',
  on: `On since ${TODAY}. A new device asks for a code from your app`,
  confirmingOff: 'Still on until you confirm below',
};

function verifyStateOf(twoStep: TwoStep): MorphState {
  if (twoStep === 'verifying') {
    return 'busy';
  }
  return 'idle';
}

function slotLabelOf(index: number) {
  const position = index + 1;
  return `Digit ${position} of ${CODE_LENGTH}`;
}

function isSettingUp(twoStep: TwoStep) {
  const isSetup = twoStep === 'setup';
  const isVerifying = twoStep === 'verifying';
  return isSetup || isVerifying;
}

type SetupStepsProps = {
  state: SecurityState;
  pressed: string | null;
  onCodeChange: (code: string) => void;
  onVerify: () => void;
};

function SetupSteps({
  state,
  pressed,
  onCodeChange,
  onVerify,
}: SetupStepsProps) {
  const codeLabelId = useId();
  const errorId = useId();
  const isVerifying = state.twoStep === 'verifying';
  const hasError = state.codeError !== null;

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onVerify();
  }

  return (
    <ol className='flex flex-col gap-5 px-4 pt-1 pb-4'>
      <li className='flex gap-3'>
        <LetterTile initial='1' size='lg' />
        <div className='flex min-w-0 flex-1 flex-col gap-2'>
          <p className='text-[13px] text-pretty'>
            Add Tidewell to your authenticator app with this setup key
          </p>
          <div className='bg-foreground/[0.05] flex w-fit max-w-full items-center gap-1 rounded-lg py-1 ps-3 pe-1'>
            <code className='font-mono text-[13px] break-all'>{SETUP_KEY}</code>
            <CopyButton text={SETUP_KEY_TEXT} label='Copy the setup key' />
          </div>
        </div>
      </li>
      <li className='flex gap-3'>
        <LetterTile initial='2' size='lg' />
        <form
          noValidate
          onSubmit={submit}
          className='flex min-w-0 flex-1 flex-col gap-2'
        >
          <p id={codeLabelId} className='text-[13px] text-pretty'>
            Enter the six-digit code your app shows
          </p>
          <OTPField
            length={CODE_LENGTH}
            value={state.code}
            autoComplete='one-time-code'
            readOnly={isVerifying}
            aria-labelledby={codeLabelId}
            aria-describedby={describedByOf(hasError, errorId)}
            onValueChange={onCodeChange}
            onValueComplete={onVerify}
            className='gap-1.5'
          >
            {SLOTS.map((index) => (
              <Fragment key={index}>
                <OTPFieldInput
                  aria-label={slotLabelOf(index)}
                  aria-invalid={hasError}
                  className='size-9'
                />
                {index === SEPARATOR_AFTER && <OTPFieldSeparator />}
              </Fragment>
            ))}
          </OTPField>
          <ErrorLine
            id={errorId}
            error={state.codeError}
            attempts={state.attempts}
          />
          <div className='flex flex-wrap items-center gap-x-3 gap-y-2 pt-1'>
            <MorphButton
              type='submit'
              size='sm'
              state={verifyStateOf(state.twoStep)}
              labels={VERIFY_LABELS}
              className={pressedSolidOf(pressed === 'verify')}
            />
            <p className='text-muted-foreground text-xs'>
              This preview takes any six digits
            </p>
          </div>
        </form>
      </li>
    </ol>
  );
}

type TurnOffConfirmProps = {
  onKeep: () => void;
  onConfirm: () => void;
};

function TurnOffConfirm({ onKeep, onConfirm }: TurnOffConfirmProps) {
  function keepOnEscape(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'Escape') {
      return;
    }
    event.preventDefault();
    onKeep();
  }

  return (
    <div
      role='group'
      aria-label='Turn off two-step verification'
      onKeyDown={keepOnEscape}
      className='bg-warning/10 mx-4 mb-4 flex flex-col gap-3 rounded-lg p-3'
    >
      <p className='text-[13px] text-pretty'>
        <span className='font-medium'>Turn off two-step verification?</span>{' '}
        Anyone who gets into one of your sign-in accounts gets into Tidewell
        too.
      </p>
      <div className='flex flex-wrap justify-end gap-2'>
        <Button
          type='button'
          variant='ghost'
          size='sm'
          data-keep-two-step
          onClick={onKeep}
        >
          Keep it on
        </Button>
        <Button
          type='button'
          variant='destructive'
          size='sm'
          onClick={onConfirm}
        >
          Turn off
        </Button>
      </div>
    </div>
  );
}

type TwoStepCardProps = {
  state: SecurityState;
  pressed: string | null;
  onSwitch: (isOn: boolean) => void;
  onCodeChange: (code: string) => void;
  onVerify: () => void;
  onTurnOff: () => void;
};

/** The switch grows a setup panel under it; the first code turns it on. */
export function TwoStepCard({
  state,
  pressed,
  onSwitch,
  onCodeChange,
  onVerify,
  onTurnOff,
}: TwoStepCardProps) {
  const labelId = useId();
  const lineId = useId();
  const twoStep = state.twoStep;
  const isChecked = isTwoStepSwitchedOn(twoStep);
  const isVerifying = twoStep === 'verifying';
  const isOn = twoStep === 'on';
  const line = LINE[twoStep];

  return (
    <div className={SURFACE}>
      <div className='flex items-center gap-3 px-4 py-3'>
        <span
          className={cn(
            'keycap-3d flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors duration-200',
            isOn && 'text-success-foreground',
            !isOn && 'text-muted-foreground'
          )}
        >
          <ShieldCheckIcon className='size-4' />
        </span>
        <div className='flex min-w-0 flex-1 flex-col gap-0.5'>
          <p id={labelId} className='text-[13px] font-medium'>
            Two-step verification
          </p>
          <p id={lineId} className='text-muted-foreground flex min-w-0 text-xs'>
            <Swap swapKey={line} className='min-w-0'>
              {line}
            </Swap>
          </p>
        </div>
        <span
          className={cn(
            'inline-flex rounded-full transition-[scale] duration-150 ease-(--ease-out-strong)',
            pressedQuietOf(pressed === 'two-step')
          )}
        >
          <Switch
            data-two-step
            checked={isChecked}
            disabled={isVerifying}
            onCheckedChange={onSwitch}
            aria-labelledby={labelId}
            aria-describedby={lineId}
          />
        </span>
      </div>
      <Fold open={isSettingUp(twoStep)}>
        <SetupSteps
          state={state}
          pressed={pressed}
          onCodeChange={onCodeChange}
          onVerify={onVerify}
        />
      </Fold>
      <Fold open={twoStep === 'confirmingOff'}>
        <TurnOffConfirm onKeep={() => onSwitch(true)} onConfirm={onTurnOff} />
      </Fold>
    </div>
  );
}
