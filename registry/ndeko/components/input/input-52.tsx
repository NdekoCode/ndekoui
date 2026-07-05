'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
} from 'motion/react';
import { useId, useState, type ChangeEvent } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import {
  CheckIcon,
  EyeIcon,
  EyeOffIcon,
  XIcon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Field, FieldLabel } from '@/registry/ndeko/ui/field';
import { Input } from '@/registry/ndeko/ui/input';

type Requirement = { pattern: RegExp; label: string };

const REQUIREMENTS: Requirement[] = [
  { pattern: /.{8,}/, label: 'At least 8 characters' },
  { pattern: /[0-9]/, label: 'At least 1 number' },
  { pattern: /[a-z]/, label: 'At least 1 lowercase letter' },
  { pattern: /[A-Z]/, label: 'At least 1 uppercase letter' },
];

const MAX_SCORE = REQUIREMENTS.length;

const FIELD_BUTTON =
  'text-muted-foreground hover:bg-foreground/5 hover:text-foreground focus-visible:ring-ring/25 absolute inset-y-0 end-1 my-auto flex size-6 items-center justify-center rounded-md outline-none transition-[color,background-color,box-shadow] focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50';

const STRENGTH_FILL = [
  'h-full w-full rounded-full',
  '-translate-x-(--strength-remaining) rtl:translate-x-(--strength-remaining)',
  'transition-[translate,background-color] duration-300 ease-(--ease-out-strong)',
].join(' ');

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

function inputTypeOf(isVisible: boolean) {
  if (isVisible) {
    return 'text';
  }
  return 'password';
}

function visibilityGlyphOf(isVisible: boolean) {
  if (isVisible) {
    return { key: 'hide', icon: <EyeOffIcon className='size-4' /> };
  }
  return { key: 'show', icon: <EyeIcon className='size-4' /> };
}

function requirementGlyphOf(isMet: boolean) {
  if (isMet) {
    return {
      key: 'met',
      icon: <CheckIcon className='text-success-foreground size-4' />,
    };
  }
  return {
    key: 'unmet',
    icon: <XIcon className='text-muted-foreground size-4' />,
  };
}

function requirementStatusOf(isMet: boolean) {
  if (isMet) {
    return 'met';
  }
  return 'not met';
}

function strengthToneOf(score: number) {
  if (score === 0) {
    return 'bg-transparent';
  }
  if (score <= 2) {
    return 'bg-destructive';
  }
  if (score === 3) {
    return 'bg-warning';
  }
  return 'bg-success';
}

function strengthLabelOf(score: number) {
  if (score === 0) {
    return 'Enter a password';
  }
  if (score <= 2) {
    return 'Weak password';
  }
  if (score === 3) {
    return 'Medium password';
  }
  return 'Strong password';
}

export default function Input52() {
  const inputId = useId();
  const descriptionId = useId();
  const [password, setPassword] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const shouldReduceMotion = usePrefersReducedMotion();
  const swapVariants = swapVariantsOf(shouldReduceMotion);
  const visibilityGlyph = visibilityGlyphOf(isVisible);
  const checks = REQUIREMENTS.map((requirement) => ({
    label: requirement.label,
    isMet: requirement.pattern.test(password),
  }));
  const score = checks.filter((check) => check.isMet).length;
  const strengthRatio = score / MAX_SCORE;
  const strengthPercent = strengthRatio * 100;
  const strengthRemaining = 100 - strengthPercent;
  const strengthLabel = strengthLabelOf(score);
  const fillStyle = {
    '--strength-remaining': `${strengthRemaining}%`,
  } as React.CSSProperties;

  function changePassword(event: ChangeEvent<HTMLInputElement>) {
    setPassword(event.currentTarget.value);
  }

  function toggleVisibility() {
    setIsVisible((current) => !current);
  }

  return (
    <div className='flex w-full max-w-xs flex-col'>
      <Field>
        <FieldLabel>Password</FieldLabel>
        <div className='relative'>
          <Input
            id={inputId}
            className='pe-8'
            type={inputTypeOf(isVisible)}
            placeholder='Choose a password'
            value={password}
            onChange={changePassword}
            aria-describedby={descriptionId}
          />
          <button
            type='button'
            className={FIELD_BUTTON}
            onClick={toggleVisibility}
            aria-label='Show password'
            aria-pressed={isVisible}
            aria-controls={inputId}
          >
            <AnimatePresence mode='popLayout' initial={false}>
              <motion.span
                key={visibilityGlyph.key}
                className='flex'
                variants={swapVariants}
                initial='enter'
                animate='visible'
                exit='exit'
                transition={SWAP_TRANSITION}
              >
                {visibilityGlyph.icon}
              </motion.span>
            </AnimatePresence>
          </button>
        </div>
      </Field>
      <div
        className='bg-foreground/[0.08] mt-3 mb-4 h-1 w-full overflow-hidden rounded-full'
        role='progressbar'
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={MAX_SCORE}
        aria-label='Password strength'
      >
        <div
          className={cn(STRENGTH_FILL, strengthToneOf(score))}
          style={fillStyle}
        />
      </div>
      <p id={descriptionId} className='mb-2 text-[13px] font-medium'>
        <span className='sr-only'>{strengthLabel}. Must contain:</span>
        <span aria-hidden='true'>
          <span className='relative inline-flex'>
            <AnimatePresence mode='popLayout' initial={false}>
              <motion.span
                key={strengthLabel}
                className='inline-flex'
                variants={swapVariants}
                initial='enter'
                animate='visible'
                exit='exit'
                transition={SWAP_TRANSITION}
              >
                {strengthLabel}
              </motion.span>
            </AnimatePresence>
          </span>
          . Must contain:
        </span>
      </p>
      <ul className='flex flex-col gap-1.5' aria-label='Password requirements'>
        {checks.map((check) => {
          const glyph = requirementGlyphOf(check.isMet);
          return (
            <li key={check.label} className='flex items-center gap-2'>
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
              <span
                className={cn(
                  'text-muted-foreground text-xs transition-colors',
                  check.isMet && 'text-success-foreground'
                )}
              >
                {check.label}
                <span className='sr-only'>
                  , requirement {requirementStatusOf(check.isMet)}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
