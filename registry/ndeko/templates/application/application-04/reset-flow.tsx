'use client';

import { useEffect, useRef, useState } from 'react';

import { LockIcon, MailIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';
import { Field, FieldLabel } from '@/registry/ndeko/ui/field';
import { Input } from '@/registry/ndeko/ui/input';
import { StatusOrb } from '@/registry/ndeko/ui/status-orb';

import {
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
  CHANGE_DELAY_MS,
  EMAIL_PLACEHOLDER,
  LINK_LIFETIME_MINUTES,
  RESEND_SECONDS,
  RESENT_NOTICE_MS,
  SEND_DELAY_MS,
} from './data';
import { emailProblemOf } from './email-check';
import {
  PasswordField,
  PasswordRules,
  areRulesMet,
  personalWordsOf,
  rulesOf,
  type PasswordRule,
} from './password-parts';

type Step = 'request' | 'sent' | 'choose' | 'done';

function resendLabelOf(seconds: number, isResent: boolean) {
  if (isResent) {
    return 'Link sent again';
  }
  if (seconds > 0) {
    const clock = clockOf(seconds);
    return `Send it again in ${clock}`;
  }
  return 'Send it again';
}

function matchRuleOf(password: string, confirmation: string): PasswordRule {
  const hasConfirmation = confirmation.length > 0;
  const isSame = password === confirmation;
  const isMatch = hasConfirmation && isSame;
  return { id: 'match', label: 'Both fields match', isMet: isMatch };
}

type ResetFlowProps = {
  startsFocused: boolean;
  onSignIn: () => void;
};

export function ResetFlow({ startsFocused, onSignIn }: ResetFlowProps) {
  const [step, setStep] = useState<Step>('request');
  const [hasMoved, setHasMoved] = useState(startsFocused);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isResent, setIsResent] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmationError, setConfirmationError] = useState<string | null>(
    null
  );
  const [isChanging, setIsChanging] = useState(false);
  const { seconds: resendSeconds, start: startCountdown } = useCountdown();
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmationRef = useRef<HTMLInputElement>(null);
  const trimmedEmail = email.trim();
  const hasEmailError = Boolean(emailError);
  const isResendWaiting = resendSeconds > 0;
  const resendLabel = resendLabelOf(resendSeconds, isResent);
  const personalWords = personalWordsOf('', email);
  const passwordRules = rulesOf(password, personalWords);
  const matchRule = matchRuleOf(password, confirmation);
  const rules = [...passwordRules, matchRule];
  const isPasswordReady = areRulesMet(passwordRules);

  useEffect(() => {
    if (!isSending) {
      return;
    }
    const timer = window.setTimeout(() => {
      setIsSending(false);
      setStep('sent');
      setHasMoved(true);
      startCountdown(RESEND_SECONDS);
    }, SEND_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [isSending, startCountdown]);

  useEffect(() => {
    if (!isChanging) {
      return;
    }
    const timer = window.setTimeout(() => {
      setIsChanging(false);
      setPassword('');
      setConfirmation('');
      setStep('done');
    }, CHANGE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [isChanging]);

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

  function requestLink(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSending) {
      return;
    }
    const problem = emailProblemOf(email, 'Enter the email you sign in with');
    setEmailError(problem);
    if (problem) {
      emailRef.current?.focus();
      return;
    }
    setIsSending(true);
  }

  function resendLink() {
    setIsResent(true);
    startCountdown(RESEND_SECONDS);
  }

  function switchEmail() {
    setStep('request');
    setHasMoved(true);
  }

  function openLink() {
    setPasswordError(null);
    setConfirmationError(null);
    setStep('choose');
    setHasMoved(true);
  }

  function changePassword(value: string) {
    setPassword(value);
    setPasswordError(null);
  }

  function changeConfirmation(value: string) {
    setConfirmation(value);
    setConfirmationError(null);
  }

  function changePasswordNow(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isChanging) {
      return;
    }
    if (!isPasswordReady) {
      setPasswordError('Meet every rule below to continue');
      passwordRef.current?.focus();
      return;
    }
    if (!matchRule.isMet) {
      setConfirmationError('Type the same password in both fields');
      confirmationRef.current?.focus();
      return;
    }
    setIsChanging(true);
  }

  return (
    <StepSwap stepKey={step}>
      {step === 'request' && (
        <>
          <CardHead
            mark={<MarkTile icon={LockIcon} />}
            title='Reset your password'
          >
            Enter the email you sign in with and we send a link to choose a new
            password.
          </CardHead>
          <form
            noValidate
            onSubmit={requestLink}
            className='flex flex-col gap-5'
          >
            <Field invalid={hasEmailError} className='gap-0'>
              <FieldLabel className='mb-1.5'>Email</FieldLabel>
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
                {`The link works for ${LINK_LIFETIME_MINUTES} minutes`}
              </p>
              <SubmitButton
                label='Send reset link'
                workingLabel='Sending link'
                isWorking={isSending}
              />
            </div>
          </form>
          <Button
            variant='link'
            onClick={onSignIn}
            className='h-auto self-start px-0 text-xs'
          >
            Back to sign in
          </Button>
        </>
      )}
      {step === 'sent' && (
        <>
          <CardHead
            mark={<MarkTile icon={MailIcon} />}
            title='Check your email'
            autoFocusTitle
          >
            If an account uses{' '}
            <span className='text-foreground font-medium break-all'>
              {trimmedEmail}
            </span>
            {`, a reset link is on its way. It works for ${LINK_LIFETIME_MINUTES} minutes.`}
          </CardHead>
          <p className='bg-foreground/[0.03] text-muted-foreground rounded-lg px-3 py-2 text-xs'>
            This preview sends no email. Open the link from here instead.
          </p>
          <div className='flex flex-col gap-3'>
            <div className='flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between'>
              <Button
                variant='ghost'
                size='sm'
                disabled={isResendWaiting}
                onClick={resendLink}
                className='text-muted-foreground self-center sm:self-auto'
              >
                <SwapLabel text={resendLabel} />
              </Button>
              <Button size='lg' onClick={openLink} className='w-full sm:w-auto'>
                Open the reset link
              </Button>
            </div>
            <Button
              variant='link'
              onClick={switchEmail}
              className='h-auto self-center px-0 text-xs sm:self-start'
            >
              Use another email
            </Button>
          </div>
        </>
      )}
      {step === 'choose' && (
        <>
          <CardHead
            mark={<MarkTile icon={LockIcon} />}
            title='Choose a new password'
          >
            For{' '}
            <span className='text-foreground font-medium break-all'>
              {trimmedEmail}
            </span>
            . Other devices sign out once it changes.
          </CardHead>
          <form
            noValidate
            onSubmit={changePasswordNow}
            className='flex flex-col gap-5'
          >
            <PasswordField
              label='New password'
              value={password}
              autoComplete='new-password'
              error={passwordError}
              inputRef={passwordRef}
              autoFocus
              readOnly={isChanging}
              onValueChange={changePassword}
            >
              <PasswordRules rules={rules} />
            </PasswordField>
            <PasswordField
              label='Type it again'
              value={confirmation}
              autoComplete='new-password'
              error={confirmationError}
              inputRef={confirmationRef}
              readOnly={isChanging}
              onValueChange={changeConfirmation}
            />
            <SubmitButton
              label='Change password'
              workingLabel='Changing password'
              isWorking={isChanging}
            />
          </form>
        </>
      )}
      {step === 'done' && (
        <>
          <CardHead
            mark={<StatusOrb tone='success' />}
            title='Password changed'
            autoFocusTitle
          >
            Your other devices are signed out. Sign in again with the new
            password.
          </CardHead>
          <div className='flex justify-end'>
            <Button variant='outline' size='lg' onClick={onSignIn}>
              Sign in
            </Button>
          </div>
        </>
      )}
    </StepSwap>
  );
}
