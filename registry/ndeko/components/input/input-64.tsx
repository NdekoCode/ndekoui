'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
  useReducedMotion,
} from 'motion/react';
import { useId, useState, type ChangeEvent } from 'react';

import { CheckIcon, CircleIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Field, FieldLabel } from '@/registry/ndeko/ui/field';
import { Input } from '@/registry/ndeko/ui/input';

type Rule = { label: string; isMetBy: (password: string) => boolean };

const MIN_LENGTH = 12;

function hasMixedCase(password: string) {
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  return hasLower && hasUpper;
}

const RULES: Rule[] = [
  {
    label: `${MIN_LENGTH}+ characters`,
    isMetBy: (password) => password.length >= MIN_LENGTH,
  },
  { label: 'Upper and lower case', isMetBy: hasMixedCase },
  { label: 'A number', isMetBy: (password) => /\d/.test(password) },
  {
    label: 'A symbol',
    isMetBy: (password) => /[^A-Za-z0-9]/.test(password),
  },
];

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

function swapVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return SWAP_VARIANTS;
}

function badgeVariantOf(isMet: boolean) {
  if (isMet) {
    return 'success';
  }
  return 'secondary';
}

function badgeInkOf(isMet: boolean) {
  if (isMet) {
    return '';
  }
  return 'text-muted-foreground';
}

function ruleGlyphOf(isMet: boolean) {
  if (isMet) {
    return { key: 'met', icon: <CheckIcon strokeWidth={2.25} /> };
  }
  return { key: 'unmet', icon: <CircleIcon className='opacity-60' /> };
}

function ruleStatusOf(isMet: boolean) {
  if (isMet) {
    return 'met';
  }
  return 'not met yet';
}

function summaryOf(metCount: number) {
  const total = RULES.length;
  if (metCount === total) {
    return 'Every rule is met';
  }
  return `${metCount} of ${total} rules met`;
}

export default function Input64() {
  const rulesId = useId();
  const [password, setPassword] = useState('');
  const shouldReduceMotion = useReducedMotion();
  const swapVariants = swapVariantsOf(shouldReduceMotion);
  const checks = RULES.map((rule) => ({
    label: rule.label,
    isMet: rule.isMetBy(password),
  }));
  const metCount = checks.filter((check) => check.isMet).length;

  function changePassword(event: ChangeEvent<HTMLInputElement>) {
    setPassword(event.currentTarget.value);
  }

  return (
    <div className='flex w-full max-w-xs flex-col gap-3'>
      <Field>
        <FieldLabel>Password</FieldLabel>
        <Input
          type='password'
          autoComplete='new-password'
          placeholder='Choose a password'
          value={password}
          onChange={changePassword}
          aria-describedby={rulesId}
        />
      </Field>
      <ul
        id={rulesId}
        className='flex flex-wrap gap-1.5'
        aria-label='Password rules'
      >
        {checks.map((check) => {
          const glyph = ruleGlyphOf(check.isMet);
          return (
            <li key={check.label}>
              <Badge
                variant={badgeVariantOf(check.isMet)}
                className={cn(
                  'transition-colors duration-150',
                  badgeInkOf(check.isMet)
                )}
              >
                <span className='relative flex'>
                  <AnimatePresence mode='popLayout' initial={false}>
                    <motion.span
                      key={glyph.key}
                      className='flex'
                      variants={swapVariants}
                      initial='enter'
                      animate='visible'
                      exit='exit'
                      transition={SWAP_TRANSITION}
                    >
                      {glyph.icon}
                    </motion.span>
                  </AnimatePresence>
                </span>
                {check.label}
                <span className='sr-only'>, {ruleStatusOf(check.isMet)}</span>
              </Badge>
            </li>
          );
        })}
      </ul>
      <span className='sr-only' aria-live='polite'>
        {summaryOf(metCount)}
      </span>
    </div>
  );
}
