'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
  useReducedMotion,
} from 'motion/react';
import { useEffect, useId, useRef, useState } from 'react';

import { Button } from '@/registry/ndeko/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/registry/ndeko/ui/dialog';
import { OTPField, OTPFieldInput } from '@/registry/ndeko/ui/otp-field';
import { StatusOrb } from '@/registry/ndeko/ui/status-orb';

type CodeStatus = 'entry' | 'invalid' | 'verified';

type Step = 'entry' | 'verified';

const CORRECT_CODE = '6548';
const CODE_LENGTH = 4;
const LATER_POSITIONS = [2, 3, 4];

const STEP_COPY: Record<Step, { title: string; description: string }> = {
  entry: {
    title: 'Enter the confirmation code',
    description: `We sent a 4-digit code to amara@example.com. For this preview, use ${CORRECT_CODE}.`,
  },
  verified: {
    title: 'Email confirmed',
    description: 'Your address is verified. You can close this window.',
  },
};

const BRAND_STYLE = { '--gem': 'var(--primary)' } as React.CSSProperties;

const SWAP_TRANSITION: Transition = { duration: 0.15, ease: [0.2, 0, 0, 1] };

const MARK_VARIANTS: Variants = {
  enter: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
  visible: { opacity: 1, scale: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
};

const CONTENT_VARIANTS: Variants = {
  enter: { opacity: 0, filter: 'blur(2px)' },
  visible: { opacity: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, filter: 'blur(2px)' },
};

const FADE_VARIANTS: Variants = {
  enter: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

function markVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return MARK_VARIANTS;
}

function contentVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return CONTENT_VARIANTS;
}

function stepOf(status: CodeStatus): Step {
  if (status === 'verified') {
    return 'verified';
  }
  return 'entry';
}

function AcmeMark() {
  return (
    <span
      aria-hidden='true'
      style={BRAND_STYLE}
      className='gem-plate flex size-10 shrink-0 items-center justify-center rounded-xl'
    >
      <svg
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth={2.25}
        strokeLinecap='round'
        strokeLinejoin='round'
        className='size-5'
      >
        <path d='M12 4.5 20 19H4l8-14.5Z' />
        <path d='M8.75 14h6.5' />
      </svg>
    </span>
  );
}

export default function Dialog12() {
  const otpId = useId();
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<CodeStatus>('entry');
  const closeRef = useRef<HTMLButtonElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const markVariants = markVariantsOf(shouldReduceMotion);
  const contentVariants = contentVariantsOf(shouldReduceMotion);
  const step = stepOf(status);
  const copy = STEP_COPY[step];
  const isVerified = status === 'verified';
  const isInvalid = status === 'invalid';

  useEffect(() => {
    if (isVerified) {
      closeRef.current?.focus();
    }
  }, [isVerified]);

  function resetOnOpen(open: boolean) {
    if (open) {
      setCode('');
      setStatus('entry');
    }
  }

  function updateCode(nextCode: string) {
    setCode(nextCode);
    const isRetyping = nextCode.length > 0;
    if (isInvalid && isRetyping) {
      setStatus('entry');
    }
  }

  function verifyCode(completeCode: string) {
    if (completeCode === CORRECT_CODE) {
      setStatus('verified');
      return;
    }
    setStatus('invalid');
    setCode('');
    document.getElementById(otpId)?.focus();
  }

  return (
    <Dialog onOpenChange={resetOnOpen}>
      <DialogTrigger render={<Button variant='outline' />}>
        Confirm email
      </DialogTrigger>
      <DialogContent className='max-w-md' contentClassName='relative gap-5'>
        <div className='flex flex-col items-center gap-4'>
          <span className='relative flex size-10 items-center justify-center'>
            <AnimatePresence mode='popLayout' initial={false}>
              <motion.span
                key={step}
                className='flex'
                variants={markVariants}
                initial='enter'
                animate='visible'
                exit='exit'
                transition={SWAP_TRANSITION}
              >
                {isVerified && <StatusOrb tone='success' />}
                {!isVerified && <AcmeMark />}
              </motion.span>
            </AnimatePresence>
          </span>
          <DialogHeader className='px-8 text-center'>
            <DialogTitle className='relative'>
              <AnimatePresence mode='popLayout' initial={false}>
                <motion.span
                  key={step}
                  className='block'
                  variants={contentVariants}
                  initial='enter'
                  animate='visible'
                  exit='exit'
                  transition={SWAP_TRANSITION}
                >
                  {copy.title}
                </motion.span>
              </AnimatePresence>
            </DialogTitle>
            <DialogDescription className='relative'>
              <AnimatePresence mode='popLayout' initial={false}>
                <motion.span
                  key={step}
                  className='block'
                  variants={contentVariants}
                  initial='enter'
                  animate='visible'
                  exit='exit'
                  transition={SWAP_TRANSITION}
                >
                  {copy.description}
                </motion.span>
              </AnimatePresence>
            </DialogDescription>
          </DialogHeader>
        </div>
        <AnimatePresence mode='popLayout' initial={false}>
          {isVerified && (
            <motion.div
              key='verified'
              className='flex justify-center'
              variants={contentVariants}
              initial='enter'
              animate='visible'
              exit='exit'
              transition={SWAP_TRANSITION}
            >
              <DialogClose ref={closeRef} render={<Button size='lg' />}>
                Close
              </DialogClose>
            </motion.div>
          )}
          {!isVerified && (
            <motion.div
              key='entry'
              className='flex flex-col items-center gap-3'
              variants={contentVariants}
              initial='enter'
              animate='visible'
              exit='exit'
              transition={SWAP_TRANSITION}
            >
              <label htmlFor={otpId} className='sr-only'>
                Confirmation code
              </label>
              <OTPField
                id={otpId}
                length={CODE_LENGTH}
                value={code}
                onValueChange={updateCode}
                onValueComplete={verifyCode}
              >
                <OTPFieldInput aria-invalid={isInvalid} />
                {LATER_POSITIONS.map((position) => (
                  <OTPFieldInput
                    key={position}
                    aria-label={`Digit ${position} of ${CODE_LENGTH}`}
                    aria-invalid={isInvalid}
                  />
                ))}
              </OTPField>
              <AnimatePresence initial={false}>
                {isInvalid && (
                  <motion.p
                    key='error'
                    role='alert'
                    className='text-destructive-ink text-center text-xs'
                    variants={FADE_VARIANTS}
                    initial='enter'
                    animate='visible'
                    exit='exit'
                    transition={SWAP_TRANSITION}
                  >
                    That code does not match. Check the email and try again.
                  </motion.p>
                )}
              </AnimatePresence>
              <Button type='button' variant='link' size='sm'>
                Resend code
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
