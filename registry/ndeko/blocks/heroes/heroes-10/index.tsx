'use client';

import { useEffect, useRef, useState } from 'react';

import {
  type AutoplayStep,
  typingSteps,
  useAutoplay,
} from '@/registry/ndeko/hooks/use-autoplay';
import { useKeptHeight } from '@/registry/ndeko/hooks/use-kept-height';
import {
  hold,
  PRESS_LEAD_MS,
  spokenUnless,
  usePress,
} from '@/registry/ndeko/lib/demonstration';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { Wash } from '@/registry/ndeko/ui/wash';

import { AvatarStack } from './avatar-stack';
import { DEMO_EMAIL, HERO, type Status } from './data';
import { EmailForm } from './email-form';
import { INITIAL_STACK, type Stack, withDemoJoin, withJoin } from './stack';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const JOIN_DELAY_MS = 900;

const NEW_MEMBER_EVERY_MS = 2400;

function emailErrorOf(value: string) {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return HERO.emptyError;
  }
  const isEmailShaped = EMAIL_PATTERN.test(trimmed);
  if (!isEmailShaped) {
    return HERO.shapeError;
  }
  return null;
}

function announcementOf(error: string | null, status: Status) {
  if (error !== null) {
    return error;
  }
  if (status === 'done') {
    return HERO.doneAnnouncement;
  }
  return '';
}

export default function Heroes10() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false);
  const [stack, setStack] = useState<Stack>(INITIAL_STACK);
  const inputRef = useRef<HTMLInputElement>(null);
  const { pressed, press } = usePress<'join'>();

  useEffect(() => {
    if (status !== 'busy') {
      return;
    }
    const timeout = window.setTimeout(() => {
      setStatus('done');
      setStack((current) => withJoin(current, email));
    }, JOIN_DELAY_MS);
    return () => window.clearTimeout(timeout);
  }, [status, email]);

  function changeEmail(value: string) {
    setEmail(value);
    if (hasTriedSubmit) {
      setError(emailErrorOf(value));
    }
  }

  function submit() {
    const nextError = emailErrorOf(email);
    setHasTriedSubmit(true);
    setError(nextError);
    if (nextError !== null) {
      inputRef.current?.focus();
      return;
    }
    setStatus('busy');
  }

  function startOver() {
    setEmail('');
    setStatus('idle');
    setError(null);
    setHasTriedSubmit(false);
  }

  function startAnother() {
    startOver();
    inputRef.current?.focus();
  }

  function addDemoMember() {
    setStack(withDemoJoin);
  }

  const steps: AutoplayStep[] = [
    { after: NEW_MEMBER_EVERY_MS, run: addDemoMember },
    { after: NEW_MEMBER_EVERY_MS, run: addDemoMember },
    ...typingSteps(DEMO_EMAIL, setEmail, { startAfter: 700, characterMs: 55 }),
    { after: 500, run: () => press('join') },
    { after: PRESS_LEAD_MS, run: submit },
    { after: NEW_MEMBER_EVERY_MS, run: addDemoMember },
    { after: NEW_MEMBER_EVERY_MS, run: hold },
  ];
  const { ref, isAutoplaying } = useAutoplay(steps, {
    loopAfter: 600,
    onReset: startOver,
  });
  const hasJoined = stack.count > INITIAL_STACK.count;
  const announcement = announcementOf(error, status);
  const message = spokenUnless(isAutoplaying, announcement);

  useKeptHeight(ref);

  return (
    <section className='@container'>
      <div ref={ref} className='relative isolate'>
        <Wash className='h-[28rem]' />
        <div className='mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 py-16 text-center @2xl:px-6 @2xl:py-24'>
          <p className='text-primary-ink text-sm font-medium'>{HERO.eyebrow}</p>
          <h1 className='text-4xl font-semibold text-balance @2xl:text-5xl'>
            {HERO.title}
          </h1>
          <p className='text-muted-foreground max-w-xl text-base text-pretty'>
            {HERO.description}
          </p>
          <EmailForm
            email={email}
            status={status}
            error={error}
            isPressed={pressed === 'join'}
            inputRef={inputRef}
            onEmailChange={changeEmail}
            onSubmit={submit}
            onUseAnother={startAnother}
          />
          <AvatarStack stack={stack} hasJoined={hasJoined} />
          <LiveRegion message={message} />
        </div>
      </div>
    </section>
  );
}
