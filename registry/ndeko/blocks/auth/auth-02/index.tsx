'use client';

import { useEffect, useRef, useState } from 'react';

import { MailIcon, UserRoundPlusIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';
import { Field, FieldLabel } from '@/registry/ndeko/ui/field';
import { Input } from '@/registry/ndeko/ui/input';

import {
  AuthFrame,
  CardHead,
  ErrorPresence,
  MarkTile,
  StepSwap,
  SubmitButton,
} from './auth-kit';
import {
  CREATE_DELAY_MS,
  EMAIL_PLACEHOLDER,
  LINK_LIFETIME_HOURS,
} from './data';
import {
  PasswordField,
  PasswordRules,
  areRulesMet,
  personalWordsOf,
  rulesOf,
} from './password-parts';

type Step = 'form' | 'confirm';

type SignUpField = 'name' | 'email' | 'password';

type SignUpErrors = Partial<Record<SignUpField, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const FIELD_ORDER: SignUpField[] = ['name', 'email', 'password'];

function emailProblemOf(email: string) {
  const trimmed = email.trim();
  if (trimmed.length === 0) {
    return 'Enter your work email';
  }
  const isValid = EMAIL_PATTERN.test(trimmed);
  if (!isValid) {
    return 'Enter an email like name@company.com';
  }
  return undefined;
}

function nameProblemOf(name: string) {
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    return 'Enter your name as teammates will see it';
  }
  return undefined;
}

function passwordProblemOf(isPasswordReady: boolean) {
  if (isPasswordReady) {
    return undefined;
  }
  return 'Meet every rule below to continue';
}

function firstErrorFieldOf(errors: SignUpErrors) {
  const field = FIELD_ORDER.find((candidate) => Boolean(errors[candidate]));
  if (field) {
    return field;
  }
  return null;
}

function withoutError(errors: SignUpErrors, field: SignUpField) {
  if (!errors[field]) {
    return errors;
  }
  const next = { ...errors };
  delete next[field];
  return next;
}

function errorOf(errors: SignUpErrors, field: SignUpField) {
  return errors[field] ?? null;
}

export default function Auth02() {
  const [step, setStep] = useState<Step>('form');
  const [hasMoved, setHasMoved] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<SignUpErrors>({});
  const [isCreating, setIsCreating] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const personalWords = personalWordsOf(name, email);
  const rules = rulesOf(password, personalWords);
  const isPasswordReady = areRulesMet(rules);
  const trimmedEmail = email.trim();
  const nameError = errorOf(errors, 'name');
  const emailError = errorOf(errors, 'email');
  const passwordError = errorOf(errors, 'password');
  const hasNameError = Boolean(nameError);
  const hasEmailError = Boolean(emailError);

  useEffect(() => {
    if (!isCreating) {
      return;
    }
    const timer = window.setTimeout(() => {
      setIsCreating(false);
      setPassword('');
      setStep('confirm');
      setHasMoved(true);
    }, CREATE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [isCreating]);

  function clearError(field: SignUpField) {
    setErrors((previous) => withoutError(previous, field));
  }

  function changeName(event: React.ChangeEvent<HTMLInputElement>) {
    setName(event.target.value);
    clearError('name');
  }

  function changeEmail(event: React.ChangeEvent<HTMLInputElement>) {
    setEmail(event.target.value);
    clearError('email');
  }

  function changePassword(value: string) {
    setPassword(value);
    clearError('password');
  }

  function focusField(field: SignUpField) {
    const refs = { name: nameRef, email: emailRef, password: passwordRef };
    refs[field].current?.focus();
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isCreating) {
      return;
    }
    const nextErrors: SignUpErrors = {
      name: nameProblemOf(name),
      email: emailProblemOf(email),
      password: passwordProblemOf(isPasswordReady),
    };
    const firstField = firstErrorFieldOf(nextErrors);
    setErrors(nextErrors);
    if (firstField) {
      focusField(firstField);
      return;
    }
    setIsCreating(true);
  }

  function switchEmail() {
    setStep('form');
    setHasMoved(true);
  }

  return (
    <AuthFrame footer='By creating an account you accept the terms of service and the privacy notice'>
      <StepSwap stepKey={step}>
        {step === 'form' && (
          <>
            <CardHead
              mark={<MarkTile icon={UserRoundPlusIcon} />}
              title='Create your Tidewell account'
            >
              Start a workspace for your team. You can invite people once it is
              ready.
            </CardHead>
            <form noValidate onSubmit={submit} className='flex flex-col gap-5'>
              <Field invalid={hasNameError} className='gap-0'>
                <FieldLabel className='mb-1.5'>Full name</FieldLabel>
                <Input
                  ref={nameRef}
                  autoComplete='name'
                  placeholder='Amara Okafor'
                  value={name}
                  readOnly={isCreating}
                  autoFocus={hasMoved}
                  onChange={changeName}
                />
                <ErrorPresence error={nameError} />
              </Field>
              <Field invalid={hasEmailError} className='gap-0'>
                <FieldLabel className='mb-1.5'>Work email</FieldLabel>
                <Input
                  ref={emailRef}
                  type='email'
                  inputMode='email'
                  autoComplete='email'
                  placeholder={EMAIL_PLACEHOLDER}
                  value={email}
                  readOnly={isCreating}
                  onChange={changeEmail}
                />
                <ErrorPresence error={emailError} />
              </Field>
              <PasswordField
                label='Password'
                value={password}
                autoComplete='new-password'
                error={passwordError}
                inputRef={passwordRef}
                readOnly={isCreating}
                onValueChange={changePassword}
              >
                <PasswordRules rules={rules} />
              </PasswordField>
              <SubmitButton
                label='Create account'
                workingLabel='Creating account'
                isWorking={isCreating}
              />
            </form>
          </>
        )}
        {step === 'confirm' && (
          <>
            <CardHead
              mark={<MarkTile icon={MailIcon} />}
              title='Confirm your email'
              autoFocusTitle
            >
              We sent a link to{' '}
              <span className='text-foreground font-medium break-all'>
                {trimmedEmail}
              </span>
              {`. Open it within ${LINK_LIFETIME_HOURS} hours to finish creating your account.`}
            </CardHead>
            <p className='bg-foreground/[0.03] text-muted-foreground rounded-lg px-3 py-2 text-xs'>
              This preview sends no email and keeps no password
            </p>
            <div className='flex justify-end'>
              <Button variant='outline' size='lg' onClick={switchEmail}>
                Use another email
              </Button>
            </div>
          </>
        )}
      </StepSwap>
    </AuthFrame>
  );
}
