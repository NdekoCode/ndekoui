'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
} from 'motion/react';
import { useState } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import {
  CheckIcon,
  CircleIcon,
  EyeIcon,
  EyeOffIcon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import { Field, FieldDescription, FieldLabel } from '@/registry/ndeko/ui/field';
import { Input } from '@/registry/ndeko/ui/input';

import { ErrorPresence } from './auth-kit';

export const PASSWORD_MIN_LENGTH = 10;

const PERSONAL_WORD_MIN_LENGTH = 3;

const SWAP_TRANSITION: Transition = { duration: 0.15, ease: [0.2, 0, 0, 1] };

const SWAP_VARIANTS: Variants = {
  enter: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
  visible: { opacity: 1, scale: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
};

const FADE_VARIANTS: Variants = {
  enter: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const UPPERCASE_PATTERN = /\p{Lu}/u;

const LOWERCASE_PATTERN = /\p{Ll}/u;

const DIGIT_PATTERN = /\d/;

export type PasswordRule = {
  id: string;
  label: string;
  isMet: boolean;
};

function swapVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return SWAP_VARIANTS;
}

function isTellingWord(word: string) {
  return word.length >= PERSONAL_WORD_MIN_LENGTH;
}

/** Words that would make the password easy to guess: parts of the name and of the email. */
export function personalWordsOf(name: string, email: string) {
  const loweredName = name.toLowerCase();
  const loweredEmail = email.toLowerCase();
  const [localPart] = loweredEmail.split('@');
  const nameParts = loweredName.split(/\s+/);
  const words = [...nameParts, localPart];
  return words.filter(isTellingWord);
}

export function rulesOf(
  password: string,
  personalWords: string[]
): PasswordRule[] {
  const lowered = password.toLowerCase();
  const hasPassword = password.length > 0;
  const isLongEnough = password.length >= PASSWORD_MIN_LENGTH;
  const hasDigit = DIGIT_PATTERN.test(password);
  const hasUppercase = UPPERCASE_PATTERN.test(password);
  const hasLowercase = LOWERCASE_PATTERN.test(password);
  const hasBothCases = hasUppercase && hasLowercase;
  const usesPersonalWord = personalWords.some((word) => lowered.includes(word));
  const isImpersonal = hasPassword && !usesPersonalWord;
  return [
    {
      id: 'length',
      label: `At least ${PASSWORD_MIN_LENGTH} characters`,
      isMet: isLongEnough,
    },
    { id: 'digit', label: 'One number', isMet: hasDigit },
    {
      id: 'cases',
      label: 'Upper and lower case letters',
      isMet: hasBothCases,
    },
    {
      id: 'personal',
      label: 'Not your name or email',
      isMet: isImpersonal,
    },
  ];
}

export function areRulesMet(rules: PasswordRule[]) {
  return rules.every((rule) => rule.isMet);
}

function metCountLabelOf(rules: PasswordRule[]) {
  const metCount = rules.filter((rule) => rule.isMet).length;
  return `${metCount} of ${rules.length} password rules met`;
}

function RuleMark({ isMet }: { isMet: boolean }) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const variants = swapVariantsOf(shouldReduceMotion);
  const markKey = String(isMet);

  return (
    <span aria-hidden='true' className='relative flex size-4 shrink-0'>
      <AnimatePresence mode='popLayout' initial={false}>
        <motion.span
          key={markKey}
          variants={variants}
          initial='enter'
          animate='visible'
          exit='exit'
          transition={SWAP_TRANSITION}
          className='flex size-4 items-center justify-center'
        >
          {isMet && (
            <span className='bg-success/15 text-success-foreground flex size-4 items-center justify-center rounded-full'>
              <CheckIcon strokeWidth={2.5} className='size-2.5' />
            </span>
          )}
          {!isMet && (
            <CircleIcon className='text-muted-foreground/60 size-3.5' />
          )}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/** Rules tick one by one as the password meets them. Rendered inside the password `Field`. */
export function PasswordRules({ rules }: { rules: PasswordRule[] }) {
  const metCountLabel = metCountLabelOf(rules);

  return (
    <FieldDescription render={<div />} className='pt-2.5'>
      <ul className='grid gap-x-4 gap-y-1.5 sm:grid-cols-2'>
        {rules.map((rule) => (
          <li
            key={rule.id}
            className={cn(
              'flex items-center gap-2 transition-colors duration-150',
              rule.isMet && 'text-foreground'
            )}
          >
            <RuleMark isMet={rule.isMet} />
            {rule.label}
          </li>
        ))}
      </ul>
      <span aria-live='polite' className='sr-only'>
        {metCountLabel}
      </span>
    </FieldDescription>
  );
}

function inputTypeOf(isRevealed: boolean) {
  if (isRevealed) {
    return 'text';
  }
  return 'password';
}

function revealLabelOf(isRevealed: boolean) {
  if (isRevealed) {
    return 'Hide password';
  }
  return 'Show password';
}

type PasswordFieldProps = {
  label: string;
  value: string;
  autoComplete: 'new-password' | 'current-password';
  error: string | null;
  autoFocus?: boolean;
  inputRef?: React.Ref<HTMLInputElement>;
  readOnly?: boolean;
  onValueChange: (value: string) => void;
  children?: React.ReactNode;
};

/** The reveal button swaps its eye; the value never leaves the field's state. */
export function PasswordField({
  label,
  value,
  autoComplete,
  error,
  autoFocus,
  inputRef,
  readOnly,
  onValueChange,
  children,
}: PasswordFieldProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const shouldReduceMotion = usePrefersReducedMotion();
  const variants = swapVariantsOf(shouldReduceMotion);
  const hasError = Boolean(error);
  const inputType = inputTypeOf(isRevealed);
  const revealLabel = revealLabelOf(isRevealed);
  const glyphKey = String(isRevealed);

  function changeValue(event: React.ChangeEvent<HTMLInputElement>) {
    onValueChange(event.target.value);
  }

  function toggleReveal() {
    setIsRevealed((current) => !current);
  }

  return (
    <Field invalid={hasError} className='gap-0'>
      <FieldLabel className='mb-1.5'>{label}</FieldLabel>
      <div className='relative'>
        <Input
          ref={inputRef}
          type={inputType}
          value={value}
          autoComplete={autoComplete}
          autoCapitalize='none'
          autoCorrect='off'
          spellCheck={false}
          autoFocus={autoFocus}
          readOnly={readOnly}
          onChange={changeValue}
          className='pr-10'
        />
        <Button
          type='button'
          variant='ghost'
          size='icon-sm'
          aria-label={revealLabel}
          aria-pressed={isRevealed}
          onClick={toggleReveal}
          className='text-muted-foreground absolute top-1/2 right-0.5 -translate-y-1/2'
        >
          <AnimatePresence mode='popLayout' initial={false}>
            <motion.span
              key={glyphKey}
              variants={variants}
              initial='enter'
              animate='visible'
              exit='exit'
              transition={SWAP_TRANSITION}
              className='flex'
            >
              {isRevealed && <EyeOffIcon />}
              {!isRevealed && <EyeIcon />}
            </motion.span>
          </AnimatePresence>
        </Button>
      </div>
      <ErrorPresence error={error} />
      {children}
    </Field>
  );
}
