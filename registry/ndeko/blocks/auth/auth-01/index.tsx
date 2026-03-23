'use client';

import { Fragment, useEffect, useRef, useState } from 'react';

import { MailIcon, ShieldCheckIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';
import { Field, FieldLabel } from '@/registry/ndeko/ui/field';
import { Input } from '@/registry/ndeko/ui/input';
import {
  OTPField,
  OTPFieldInput,
  OTPFieldSeparator,
} from '@/registry/ndeko/ui/otp-field';
import { StatusOrb } from '@/registry/ndeko/ui/status-orb';

import {
  AuthFrame,
  CardHead,
  ErrorPresence,
  MarkTile,
  StepSwap,
  SubmitButton,
  SwapLabel,
  clockOf,
  useCountdown,
} from './auth-kit';
import {
  CHECK_DELAY_MS,
  CODE_LENGTH,
  CODE_LIFETIME_MINUTES,
  EMAIL_PLACEHOLDER,
  PREVIEW_CODE,
  PREVIEW_CODE_LABEL,
  RESEND_SECONDS,
  RESENT_NOTICE_MS,
  SEND_DELAY_MS,
  WORKSPACE_NAME,
} from './data';

type Step = 'email' | 'code' | 'done';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SLOTS = Array.from({ length: CODE_LENGTH }, (_, index) => index);

const SEPARATOR_AFTER = 2;

function emailProblemOf(email: string) {
  const trimmed = email.trim();
  if (trimmed.length === 0) {
    return 'Enter your work email';
  }
  const isValid = EMAIL_PATTERN.test(trimmed);
  if (!isValid) {
    return 'Enter an email like name@company.com';
  }
  return null;
}

function slotLabelOf(index: number) {
  const position = index + 1;
  return `Digit ${position} of ${CODE_LENGTH}`;
}

function resendLabelOf(seconds: number, isResent: boolean) {
  if (isResent) {
    return 'New code sent';
  }
  if (seconds > 0) {
    const clock = clockOf(seconds);
    return `Send a new code in ${clock}`;
  }
  return 'Send a new code';
}

export default function Auth01() {
  const [step, setStep] = useState<Step>('email');
  const [hasMoved, setHasMoved] = useState(false);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState<string | null>(null);
  const [checkingCode, setCheckingCode] = useState<string | null>(null);
  const [isResent, setIsResent] = useState(false);
  const { seconds: resendSeconds, start: startCountdown } = useCountdown();
  const emailRef = useRef<HTMLInputElement>(null);
  const trimmedEmail = email.trim();
  const hasEmailError = Boolean(emailError);
  const hasCodeError = Boolean(codeError);
  const isChecking = checkingCode !== null;
  const isResendWaiting = resendSeconds > 0;
  const resendLabel = resendLabelOf(resendSeconds, isResent);

  useEffect(() => {
    if (!isSending) {
      return;
    }
    const timer = window.setTimeout(() => {
      setIsSending(false);
      setCode('');
      setCodeError(null);
      setStep('code');
      setHasMoved(true);
      startCountdown(RESEND_SECONDS);
    }, SEND_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [isSending, startCountdown]);

  useEffect(() => {
    if (checkingCode === null) {
      return;
    }
    const timer = window.setTimeout(() => {
      const isRight = checkingCode === PREVIEW_CODE;
      setCheckingCode(null);
      if (isRight) {
        setStep('done');
        return;
      }
      setCodeError(
        'That code does not match. Check the latest email or send a new one'
      );
    }, CHECK_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [checkingCode]);

  useEffect(() => {
    if (!isResent) {
      return;
    }
    const timer = window.setTimeout(() => setIsResent(false), RESENT_NOTICE_MS);
    return () => window.clearTimeout(timer);
  }, [isResent]);

  function changeEmail(event: React.ChangeEvent<HTMLInputElement>) {
    setEmail(event.target.value);
    setEmailError(null);
  }

  function submitEmail(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSending) {
      return;
    }
    const problem = emailProblemOf(email);
    setEmailError(problem);
    if (problem) {
      emailRef.current?.focus();
      return;
    }
    setIsSending(true);
  }

  function changeCode(value: string) {
    setCode(value);
    setCodeError(null);
  }

  function completeCode(value: string) {
    setCheckingCode(value);
  }

  function submitCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isChecking) {
      return;
    }
    const isComplete = code.length === CODE_LENGTH;
    if (!isComplete) {
      setCodeError(`Enter the ${CODE_LENGTH} digits from the email`);
      return;
    }
    setCheckingCode(code);
  }

  function resendCode() {
    setCode('');
    setCodeError(null);
    setIsResent(true);
    startCountdown(RESEND_SECONDS);
  }

  function switchEmail() {
    setStep('email');
    setHasMoved(true);
  }

  function signOut() {
    setCode('');
    setStep('email');
    setHasMoved(true);
  }

  return (
    <AuthFrame footer='Trouble signing in? A workspace admin can send you a new invitation.'>
      <StepSwap stepKey={step}>
        {step === 'email' && (
          <>
            <CardHead
              mark={<MarkTile icon={MailIcon} />}
              title='Sign in to Tidewell'
            >
              We email you a 6-digit code, so there is no password to remember.
            </CardHead>
            <form
              noValidate
              onSubmit={submitEmail}
              className='flex flex-col gap-5'
            >
              <Field invalid={hasEmailError} className='gap-0'>
                <FieldLabel className='mb-1.5'>Work email</FieldLabel>
                <Input
                  ref={emailRef}
                  type='email'
                  inputMode='email'
                  autoComplete='email'
                  placeholder={EMAIL_PLACEHOLDER}
                  value={email}
                  readOnly={isSending}
                  autoFocus={hasMoved}
                  onChange={changeEmail}
                />
                <ErrorPresence error={emailError} />
              </Field>
              <div className='flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between'>
                <p className='text-muted-foreground text-xs'>
                  {`Codes expire after ${CODE_LIFETIME_MINUTES} minutes`}
                </p>
                <SubmitButton
                  label='Send code'
                  workingLabel='Sending code'
                  isWorking={isSending}
                />
              </div>
            </form>
          </>
        )}
        {step === 'code' && (
          <>
            <CardHead
              mark={<MarkTile icon={ShieldCheckIcon} />}
              title='Check your email'
            >
              Enter the code sent to{' '}
              <span className='text-foreground font-medium break-all'>
                {trimmedEmail}
              </span>
              .{' '}
              <Button
                variant='link'
                onClick={switchEmail}
                className='h-auto px-0 text-[13px]'
              >
                Use another email
              </Button>
            </CardHead>
            <form
              noValidate
              onSubmit={submitCode}
              className='flex flex-col gap-5'
            >
              <Field invalid={hasCodeError} className='gap-0'>
                <FieldLabel className='mb-1.5'>
                  {`${CODE_LENGTH}-digit code`}
                </FieldLabel>
                <OTPField
                  length={CODE_LENGTH}
                  value={code}
                  autoComplete='one-time-code'
                  readOnly={isChecking}
                  onValueChange={changeCode}
                  onValueComplete={completeCode}
                  className='gap-1.5 sm:gap-2'
                >
                  {SLOTS.map((index) => {
                    const isFirst = index === 0;
                    const isSeparated = index === SEPARATOR_AFTER;

                    return (
                      <Fragment key={index}>
                        <OTPFieldInput
                          autoFocus={isFirst}
                          aria-label={slotLabelOf(index)}
                          className='sm:size-11'
                        />
                        {isSeparated && <OTPFieldSeparator />}
                      </Fragment>
                    );
                  })}
                </OTPField>
                <ErrorPresence error={codeError} />
              </Field>
              <p className='bg-foreground/[0.03] text-muted-foreground rounded-lg px-3 py-2 text-xs'>
                This preview sends no email. The code it accepts is{' '}
                <span className='text-foreground font-medium tabular-nums'>
                  {PREVIEW_CODE_LABEL}
                </span>
              </p>
              <div className='flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between'>
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  disabled={isResendWaiting}
                  onClick={resendCode}
                  className='text-muted-foreground self-center sm:self-auto'
                >
                  <SwapLabel text={resendLabel} />
                </Button>
                <SubmitButton
                  label='Sign in'
                  workingLabel='Checking'
                  isWorking={isChecking}
                />
              </div>
            </form>
          </>
        )}
        {step === 'done' && (
          <>
            <CardHead
              mark={<StatusOrb tone='success' />}
              title='Signed in'
              autoFocusTitle
            >
              <span className='text-foreground font-medium break-all'>
                {trimmedEmail}
              </span>{' '}
              {`is signed in to ${WORKSPACE_NAME} on this device.`}
            </CardHead>
            <div className='flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between'>
              <p className='text-muted-foreground text-xs'>
                Sessions on this device last 30 days
              </p>
              <Button variant='outline' size='lg' onClick={signOut}>
                Sign out
              </Button>
            </div>
          </>
        )}
      </StepSwap>
    </AuthFrame>
  );
}
