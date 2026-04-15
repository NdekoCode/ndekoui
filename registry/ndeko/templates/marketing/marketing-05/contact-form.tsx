'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
  useReducedMotion,
} from 'motion/react';
import { useEffect, useId, useRef, useState } from 'react';

import { LoaderCircleIcon, SendIcon } from '@/registry/ndeko/lib/icons';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Button } from '@/registry/ndeko/ui/button';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/registry/ndeko/ui/field';
import { Input } from '@/registry/ndeko/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/registry/ndeko/ui/select';
import { StatusOrb } from '@/registry/ndeko/ui/status-orb';
import { Textarea } from '@/registry/ndeko/ui/textarea';

import { TEAM_SIZES } from './data';
import {
  type ContactErrors,
  type ContactField,
  EMPTY_VALUES,
  errorsOf,
  firstInvalidFieldOf,
  firstNameOf,
  isContactField,
  MESSAGE_MAX_LENGTH,
} from './validation';

type Status = 'editing' | 'sending' | 'sent';

const SEND_DELAY_MS = 1200;

const MESSAGE_COUNT_FORMAT = new Intl.NumberFormat('en');

const PANEL_TRANSITION: Transition = {
  duration: 0.2,
  ease: [0.23, 1, 0.32, 1],
};

const LABEL_TRANSITION: Transition = {
  type: 'spring',
  bounce: 0,
  duration: 0.3,
};

const INSTANT: Transition = { duration: 0 };

const PANEL_VARIANTS: Variants = {
  enter: { opacity: 0, scale: 0.98, filter: 'blur(2px)' },
  visible: { opacity: 1, scale: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, scale: 0.98, filter: 'blur(2px)' },
};

const ICON_VARIANTS: Variants = {
  enter: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
  visible: { opacity: 1, scale: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
};

const FADE_VARIANTS: Variants = {
  enter: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

function panelVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return PANEL_VARIANTS;
}

function iconVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return ICON_VARIANTS;
}

function labelTransitionOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return INSTANT;
  }
  return LABEL_TRANSITION;
}

function sendLabelOf(isSending: boolean) {
  if (isSending) {
    return 'Sending';
  }
  return 'Send message';
}

function sendGlyphOf(isSending: boolean) {
  if (isSending) {
    return {
      key: 'sending',
      icon: <LoaderCircleIcon className='animate-spin' />,
    };
  }
  return { key: 'send', icon: <SendIcon /> };
}

function selectedValueOf(value: string) {
  if (value.length === 0) {
    return null;
  }
  return value;
}

function describedByOf(hintId: string, errorId: string, hasError: boolean) {
  if (hasError) {
    return `${errorId} ${hintId}`;
  }
  return hintId;
}

function messageCountOf(message: string) {
  const length = MESSAGE_COUNT_FORMAT.format(message.length);
  const limit = MESSAGE_COUNT_FORMAT.format(MESSAGE_MAX_LENGTH);
  return `${length} of ${limit} characters`;
}

export function ContactForm() {
  const [values, setValues] = useState(EMPTY_VALUES);
  const [errors, setErrors] = useState<ContactErrors>({});
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false);
  const [status, setStatus] = useState<Status>('editing');
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const teamSizeRef = useRef<HTMLButtonElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const panelVariants = panelVariantsOf(shouldReduceMotion);
  const iconVariants = iconVariantsOf(shouldReduceMotion);
  const labelTransition = labelTransitionOf(shouldReduceMotion);
  const isSending = status === 'sending';
  const isSent = status === 'sent';
  const sendLabel = sendLabelOf(isSending);
  const sendGlyph = sendGlyphOf(isSending);
  const selectedTeamSize = selectedValueOf(values.teamSize);
  const messageCount = messageCountOf(values.message);
  const firstName = firstNameOf(values.name);
  const replyEmail = values.email.trim();
  const messageId = useId();
  const messageHintId = `${messageId}-hint`;
  const messageErrorId = `${messageId}-error`;
  const hasMessageError = Boolean(errors.message);
  const messageDescribedBy = describedByOf(
    messageHintId,
    messageErrorId,
    hasMessageError
  );

  useEffect(() => {
    if (!isSending) {
      return;
    }
    const timeout = window.setTimeout(() => {
      setStatus('sent');
    }, SEND_DELAY_MS);
    return () => window.clearTimeout(timeout);
  }, [isSending]);

  function focusField(field: ContactField) {
    if (field === 'name') {
      nameRef.current?.focus();
    }
    if (field === 'email') {
      emailRef.current?.focus();
    }
    if (field === 'teamSize') {
      teamSizeRef.current?.focus();
    }
    if (field === 'message') {
      messageRef.current?.focus();
    }
  }

  function updateValue(field: ContactField, value: string) {
    const nextValues = { ...values, [field]: value };
    setValues(nextValues);
    if (hasTriedSubmit) {
      const nextErrors = errorsOf(nextValues);
      setErrors(nextErrors);
    }
  }

  function changeText(
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = event.target;
    if (isContactField(name)) {
      updateValue(name, value);
    }
  }

  function changeTeamSize(value: string | null) {
    const nextValue = value ?? '';
    updateValue('teamSize', nextValue);
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = errorsOf(values);
    const firstInvalidField = firstInvalidFieldOf(nextErrors);
    setHasTriedSubmit(true);
    setErrors(nextErrors);
    if (firstInvalidField) {
      focusField(firstInvalidField);
      return;
    }
    setStatus('sending');
  }

  function startOver() {
    setValues(EMPTY_VALUES);
    setErrors({});
    setHasTriedSubmit(false);
    setStatus('editing');
  }

  return (
    <div className='bg-card hairline-ring ring-border dark:bg-foreground/[0.03] rounded-xl p-5 shadow-[0_1px_2px_rgb(0_0_0/0.04)] sm:p-7'>
      <AnimatedSize contentClassName='relative'>
        <AnimatePresence mode='popLayout' initial={false}>
          {isSent && (
            <motion.div
              key='sent'
              role='status'
              variants={panelVariants}
              initial='enter'
              animate='visible'
              exit='exit'
              transition={PANEL_TRANSITION}
              className='flex flex-col items-start gap-4 py-6 sm:py-10'
            >
              <StatusOrb tone='success' />
              <div className='flex flex-col gap-1.5'>
                <p className='text-lg font-semibold'>Message sent</p>
                <p className='text-muted-foreground max-w-md text-[13px] text-pretty'>
                  Thanks, {firstName}. Someone from the team replies to{' '}
                  <span className='text-foreground font-medium break-all'>
                    {replyEmail}
                  </span>{' '}
                  within one working day.
                </p>
              </div>
              <Button variant='outline' onClick={startOver}>
                Send another message
              </Button>
            </motion.div>
          )}
          {!isSent && (
            <motion.form
              key='form'
              noValidate
              onSubmit={submit}
              variants={panelVariants}
              initial='enter'
              animate='visible'
              exit='exit'
              transition={PANEL_TRANSITION}
              className='flex flex-col gap-5'
            >
              <div className='grid gap-5 sm:grid-cols-2'>
                <Field invalid={Boolean(errors.name)}>
                  <FieldLabel>Name</FieldLabel>
                  <Input
                    ref={nameRef}
                    name='name'
                    autoComplete='name'
                    placeholder='Amara Okafor'
                    value={values.name}
                    onChange={changeText}
                    readOnly={isSending}
                  />
                  {errors.name && <FieldError match>{errors.name}</FieldError>}
                </Field>
                <Field invalid={Boolean(errors.email)}>
                  <FieldLabel>Work email</FieldLabel>
                  <Input
                    ref={emailRef}
                    type='email'
                    name='email'
                    autoComplete='email'
                    placeholder='amara@company.com'
                    value={values.email}
                    onChange={changeText}
                    readOnly={isSending}
                  />
                  {errors.email && (
                    <FieldError match>{errors.email}</FieldError>
                  )}
                </Field>
                <Field>
                  <FieldLabel>
                    Company
                    <span className='text-muted-foreground font-normal'>
                      Optional
                    </span>
                  </FieldLabel>
                  <Input
                    name='company'
                    autoComplete='organization'
                    placeholder='Okafor Bakery'
                    value={values.company}
                    onChange={changeText}
                    readOnly={isSending}
                  />
                </Field>
                <Field invalid={Boolean(errors.teamSize)}>
                  <FieldLabel>Team size</FieldLabel>
                  <Select
                    items={TEAM_SIZES}
                    value={selectedTeamSize}
                    onValueChange={changeTeamSize}
                    readOnly={isSending}
                    name='teamSize'
                  >
                    <SelectTrigger ref={teamSizeRef}>
                      <SelectValue placeholder='Pick a size' />
                    </SelectTrigger>
                    <SelectContent>
                      {TEAM_SIZES.map((size) => (
                        <SelectItem key={size.value} value={size.value}>
                          {size.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.teamSize && (
                    <FieldError match>{errors.teamSize}</FieldError>
                  )}
                </Field>
              </div>
              <Field invalid={hasMessageError}>
                <FieldLabel htmlFor={messageId}>How can we help?</FieldLabel>
                <Textarea
                  ref={messageRef}
                  id={messageId}
                  name='message'
                  rows={4}
                  maxLength={MESSAGE_MAX_LENGTH}
                  placeholder='We answer about 200 emails a week with four people and want to stop replying twice to the same customer.'
                  value={values.message}
                  onChange={changeText}
                  readOnly={isSending}
                  aria-invalid={hasMessageError}
                  aria-describedby={messageDescribedBy}
                  className='min-h-28'
                />
                {hasMessageError && (
                  <FieldError id={messageErrorId} match>
                    {errors.message}
                  </FieldError>
                )}
                <FieldDescription id={messageHintId} className='tabular-nums'>
                  {messageCount}
                </FieldDescription>
              </Field>
              <div className='flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between'>
                <p className='text-muted-foreground text-xs'>
                  We only use these details to answer you
                </p>
                <Button
                  type='submit'
                  size='lg'
                  disabled={isSending}
                  focusableWhenDisabled
                  className='data-disabled:opacity-100'
                >
                  <AnimatePresence mode='popLayout' initial={false}>
                    <motion.span
                      key={sendGlyph.key}
                      className='flex'
                      variants={iconVariants}
                      initial='enter'
                      animate='visible'
                      exit='exit'
                      transition={PANEL_TRANSITION}
                    >
                      {sendGlyph.icon}
                    </motion.span>
                  </AnimatePresence>
                  <motion.span layout transition={labelTransition}>
                    {sendLabel}
                  </motion.span>
                </Button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </AnimatedSize>
    </div>
  );
}
