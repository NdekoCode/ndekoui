'use client';

import { AnimatePresence, motion } from 'motion/react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { pressedQuietOf } from '@/registry/ndeko/lib/demonstration';
import { LoaderCircleIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { BrandTile } from '@/registry/ndeko/ui/brand-tile';
import { Button } from '@/registry/ndeko/ui/button';
import { Fold, Swap } from '@/registry/ndeko/ui/chat-motion';

import { EMAIL, type Provider, type ProviderId } from './data';
import type { SecurityState } from './session';
import { SURFACE } from './settings-frame';

const SPINNER_IN = {
  initial: { opacity: 0, scale: 0.6 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.6 },
};

const SPINNER_FADE = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

function spinnerMotionOf(shouldReduceMotion: boolean) {
  if (shouldReduceMotion) {
    return SPINNER_FADE;
  }
  return SPINNER_IN;
}

function statusLineOf(provider: Provider) {
  if (provider.status === 'connected') {
    return `Signed in as ${provider.account} since ${provider.connectedSince}`;
  }
  if (provider.status === 'connecting') {
    return `Waiting for ${provider.name} to send you back`;
  }
  return 'Not connected';
}

function actionLabelOf(provider: Provider) {
  if (provider.status === 'connected') {
    return 'Disconnect';
  }
  if (provider.status === 'connecting') {
    return 'Connecting';
  }
  return 'Connect';
}

function pressKeyOf(provider: Provider) {
  if (provider.status === 'connected') {
    return `disconnect-${provider.id}`;
  }
  return `connect-${provider.id}`;
}

type ProviderActionProps = {
  provider: Provider;
  isPressed: boolean;
  onPress: (provider: Provider) => void;
};

/**
 * One button for the whole life of the link, so the focus stays on it from Connect to
 * Connecting to Disconnect and back.
 */
function ProviderAction({ provider, isPressed, onPress }: ProviderActionProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const spinnerMotion = spinnerMotionOf(shouldReduceMotion);
  const label = actionLabelOf(provider);
  const isConnecting = provider.status === 'connecting';

  return (
    <Button
      type='button'
      size='sm'
      variant='outline'
      data-provider-action={provider.id}
      disabled={isConnecting}
      focusableWhenDisabled
      onClick={() => onPress(provider)}
      className={cn('data-disabled:opacity-100', pressedQuietOf(isPressed))}
    >
      <AnimatedSize
        as='span'
        axis='width'
        contentClassName='relative flex items-center gap-1.5'
      >
        <AnimatePresence mode='popLayout' initial={false}>
          {isConnecting && (
            <motion.span key='spinner' className='flex' {...spinnerMotion}>
              <LoaderCircleIcon className='animate-spin' />
            </motion.span>
          )}
        </AnimatePresence>
        <Swap swapKey={label}>{label}</Swap>
      </AnimatedSize>
    </Button>
  );
}

type LastWayConfirmProps = {
  provider: Provider;
  pressed: string | null;
  onKeep: () => void;
  onConfirm: (id: ProviderId) => void;
};

function LastWayConfirm({
  provider,
  pressed,
  onKeep,
  onConfirm,
}: LastWayConfirmProps) {
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
      aria-label={`Disconnect ${provider.name}`}
      onKeyDown={keepOnEscape}
      className='bg-warning/10 mx-4 mb-3 flex flex-col gap-3 rounded-lg p-3'
    >
      <p className='text-[13px] text-pretty'>
        <span className='font-medium'>{`${provider.name} is your only way to sign in.`}</span>{' '}
        {`Disconnect it and you sign in with a link sent to ${EMAIL} instead.`}
      </p>
      <div className='flex flex-wrap justify-end gap-2'>
        <Button
          type='button'
          variant='ghost'
          size='sm'
          data-keep={provider.id}
          onClick={onKeep}
          className={pressedQuietOf(pressed === `keep-${provider.id}`)}
        >
          {`Keep ${provider.name}`}
        </Button>
        <Button
          type='button'
          variant='destructive'
          size='sm'
          onClick={() => onConfirm(provider.id)}
        >
          Disconnect anyway
        </Button>
      </div>
    </div>
  );
}

type SignInWaysProps = {
  state: SecurityState;
  pressed: string | null;
  onConnect: (id: ProviderId) => void;
  onDisconnect: (id: ProviderId) => void;
  onConfirmDisconnect: (id: ProviderId) => void;
  onKeep: () => void;
};

export function SignInWays({
  state,
  pressed,
  onConnect,
  onDisconnect,
  onConfirmDisconnect,
  onKeep,
}: SignInWaysProps) {
  function press(provider: Provider) {
    if (provider.status === 'connected') {
      onDisconnect(provider.id);
      return;
    }
    onConnect(provider.id);
  }

  return (
    <ul
      className={cn(SURFACE, 'hairline-divide-y divide-border flex flex-col')}
    >
      {state.providers.map((provider) => {
        const statusLine = statusLineOf(provider);
        const isConfirming = state.confirmingId === provider.id;
        const pressKey = pressKeyOf(provider);

        return (
          <li key={provider.id} className='flex flex-col'>
            <div className='flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3'>
              <BrandTile brand={provider.brand} size='xl' />
              <div className='flex min-w-0 flex-1 basis-44 flex-col gap-0.5'>
                <p className='text-[13px] font-medium'>{provider.name}</p>
                <p className='text-muted-foreground flex min-w-0 text-xs'>
                  <Swap swapKey={statusLine} className='min-w-0'>
                    {statusLine}
                  </Swap>
                </p>
              </div>
              <ProviderAction
                provider={provider}
                isPressed={pressed === pressKey}
                onPress={press}
              />
            </div>
            <Fold open={isConfirming}>
              <LastWayConfirm
                provider={provider}
                pressed={pressed}
                onKeep={onKeep}
                onConfirm={onConfirmDisconnect}
              />
            </Fold>
          </li>
        );
      })}
    </ul>
  );
}
