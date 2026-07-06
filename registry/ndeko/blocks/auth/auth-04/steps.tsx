'use client';

import { AnimatePresence, motion } from 'motion/react';
import { Fragment } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { BrandLogo } from '@/registry/ndeko/lib/brand-logos';
import {
  pressedQuietOf,
  pressedSolidOf,
} from '@/registry/ndeko/lib/demonstration';
import {
  ChevronRightIcon,
  LoaderCircleIcon,
  MailIcon,
  PlusIcon,
  ShieldCheckIcon,
  type Icon,
} from '@/registry/ndeko/lib/icons';
import { fadePresence, springOf } from '@/registry/ndeko/lib/motion-presets';
import { cn } from '@/registry/ndeko/lib/utils';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Avatar } from '@/registry/ndeko/ui/avatar';
import { Button } from '@/registry/ndeko/ui/button';
import { Swap } from '@/registry/ndeko/ui/chat-motion';
import { CompanyMark } from '@/registry/ndeko/ui/company-mark';
import { Field, FieldLabel } from '@/registry/ndeko/ui/field';
import { Input } from '@/registry/ndeko/ui/input';
import { MorphButton, type MorphState } from '@/registry/ndeko/ui/morph-button';
import {
  OTPField,
  OTPFieldInput,
  OTPFieldSeparator,
} from '@/registry/ndeko/ui/otp-field';
import { StatusOrb } from '@/registry/ndeko/ui/status-orb';

import { CardHead, FieldProblem } from './auth-frame';
import {
  CODE_LENGTH,
  EMAIL_PLACEHOLDER,
  PERSON_NAME,
  PREVIEW_CODE_LABEL,
  PRODUCT_NAME,
  PROVIDERS,
  WORKSPACE_NAME_MAX_LENGTH,
  type Provider,
  type ProviderId,
  type Workspace,
} from './data';
import type { AuthAction, AuthState } from './session';

const SLOTS = Array.from({ length: CODE_LENGTH }, (_, index) => index);

const SEPARATOR_AFTER = 2;

const SEND_LABELS: Record<MorphState, string> = {
  idle: 'Email me a code',
  busy: 'Sending code',
  done: 'Code sent',
};

const SIGN_IN_LABELS: Record<MorphState, string> = {
  idle: 'Sign in',
  busy: 'Checking',
  done: 'Signed in',
};

const ROW = [
  'bg-foreground/[0.03] flex w-full cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 text-start outline-none',
  'transition-[background-color,scale] duration-150 ease-(--ease-out-strong) active:scale-[0.98]',
  'hover:bg-foreground/[0.06] focus-visible:ring-ring/25 focus-visible:ring-[3px]',
].join(' ');

function busyOf(isBusy: boolean): MorphState {
  if (isBusy) {
    return 'busy';
  }
  return 'idle';
}

function membersOf(count: number) {
  if (count === 1) {
    return '1 member';
  }
  return `${count} members`;
}

function slotLabelOf(index: number) {
  const position = index + 1;
  return `Digit ${position} of ${CODE_LENGTH}`;
}

function resendLabelOf(isResent: boolean) {
  if (isResent) {
    return 'New code sent';
  }
  return 'Send a new code';
}

function providerLabelOf(provider: Provider, isConnecting: boolean) {
  if (isConnecting) {
    return `Waiting for ${provider.name}`;
  }
  return `Continue with ${provider.name}`;
}

function MarkTile({ icon: TileIcon }: { icon: Icon }) {
  return (
    <span className='keycap-3d text-muted-foreground flex size-10 items-center justify-center rounded-lg'>
      <TileIcon className='size-5' />
    </span>
  );
}

type ProviderButtonProps = {
  provider: Provider;
  connecting: ProviderId | null;
  isLocked: boolean;
  isPressed: boolean;
  onPress: (id: ProviderId) => void;
};

function ProviderButton({
  provider,
  connecting,
  isLocked,
  isPressed,
  onPress,
}: ProviderButtonProps) {
  const isConnecting = connecting === provider.id;
  const label = providerLabelOf(provider, isConnecting);

  return (
    <Button
      type='button'
      variant='outline'
      size='lg'
      disabled={isLocked}
      focusableWhenDisabled
      onClick={() => onPress(provider.id)}
      className={cn('w-full', pressedQuietOf(isPressed))}
    >
      <AnimatedSize
        as='span'
        axis='width'
        contentClassName='relative flex items-center gap-2'
      >
        <Swap swapKey={String(isConnecting)}>
          {isConnecting && <LoaderCircleIcon className='animate-spin' />}
          {!isConnecting && <BrandLogo brand={provider.brand} />}
        </Swap>
        <Swap swapKey={label}>{label}</Swap>
      </AnimatedSize>
    </Button>
  );
}

type StartStepProps = {
  state: AuthState;
  pressed: string | null;
  onAction: (action: AuthAction) => void;
  onRequest: () => void;
  onProvider: (id: ProviderId) => void;
};

export function StartStep({
  state,
  pressed,
  onAction,
  onRequest,
  onProvider,
}: StartStepProps) {
  const isWaiting = state.connecting !== null;
  const isLocked = isWaiting || state.isSending;

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onRequest();
  }

  return (
    <>
      <CardHead
        mark={<MarkTile icon={MailIcon} />}
        title={`Sign in to ${PRODUCT_NAME}`}
      >
        One press with an account you already have, or a code by email. No
        password to remember.
      </CardHead>
      <div className='flex flex-col gap-2'>
        {PROVIDERS.map((provider) => (
          <ProviderButton
            key={provider.id}
            provider={provider}
            connecting={state.connecting}
            isLocked={isLocked}
            isPressed={pressed === `provider-${provider.id}`}
            onPress={onProvider}
          />
        ))}
      </div>
      <div className='text-muted-foreground flex items-center gap-3 text-xs'>
        <span aria-hidden='true' className='bg-border h-(--hairline) flex-1' />
        or with your email
        <span aria-hidden='true' className='bg-border h-(--hairline) flex-1' />
      </div>
      <form noValidate onSubmit={submit} className='flex flex-col gap-4'>
        <Field invalid={state.emailError !== null} className='gap-0'>
          <FieldLabel className='mb-1.5'>Work email</FieldLabel>
          <Input
            type='email'
            inputMode='email'
            autoComplete='email'
            data-email
            placeholder={EMAIL_PLACEHOLDER}
            value={state.email}
            readOnly={isLocked}
            onChange={(event) =>
              onAction({ type: 'emailTyped', value: event.target.value })
            }
          />
          <FieldProblem problem={state.emailError} />
        </Field>
        <MorphButton
          type='submit'
          size='lg'
          state={busyOf(state.isSending)}
          labels={SEND_LABELS}
          disabled={isWaiting}
          className={cn('w-full', pressedSolidOf(pressed === 'send'))}
        />
      </form>
    </>
  );
}

type CodeStepProps = {
  state: AuthState;
  pressed: string | null;
  onAction: (action: AuthAction) => void;
  onSubmit: () => void;
  onResend: () => void;
  onRestart: () => void;
};

export function CodeStep({
  state,
  pressed,
  onAction,
  onSubmit,
  onResend,
  onRestart,
}: CodeStepProps) {
  const email = state.email.trim();
  const resendLabel = resendLabelOf(state.isResent);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <>
      <CardHead
        mark={<MarkTile icon={ShieldCheckIcon} />}
        title='Check your email'
      >
        Enter the code sent to{' '}
        <span className='text-foreground font-medium break-all'>{email}</span>.{' '}
        <Button
          type='button'
          variant='link'
          onClick={onRestart}
          className='h-auto px-0 text-[13px]'
        >
          Use another email
        </Button>
      </CardHead>
      <form noValidate onSubmit={submit} className='flex flex-col gap-5'>
        <Field invalid={state.codeError !== null} className='gap-0'>
          <FieldLabel className='mb-1.5'>{`${CODE_LENGTH}-digit code`}</FieldLabel>
          <OTPField
            length={CODE_LENGTH}
            value={state.code}
            autoComplete='one-time-code'
            readOnly={state.isChecking}
            onValueChange={(value) => onAction({ type: 'codeTyped', value })}
            onValueComplete={onSubmit}
            className='gap-1.5 @md:gap-2'
          >
            {SLOTS.map((index) => (
              <Fragment key={index}>
                <OTPFieldInput
                  data-code-slot={index}
                  aria-label={slotLabelOf(index)}
                  className='@md:size-11'
                />
                {index === SEPARATOR_AFTER && <OTPFieldSeparator />}
              </Fragment>
            ))}
          </OTPField>
          <FieldProblem problem={state.codeError} />
        </Field>
        <p className='bg-foreground/[0.03] text-muted-foreground rounded-lg px-3 py-2 text-xs'>
          This preview sends no email. The code it accepts is{' '}
          <span className='text-foreground font-medium tabular-nums'>
            {PREVIEW_CODE_LABEL}
          </span>
        </p>
        <div className='flex flex-col-reverse gap-3 @sm:flex-row @sm:items-center @sm:justify-between'>
          <Button
            type='button'
            variant='ghost'
            size='sm'
            disabled={state.isResent}
            onClick={onResend}
            className='text-muted-foreground self-center @sm:self-auto'
          >
            <AnimatedSize
              as='span'
              axis='width'
              contentClassName='relative flex'
            >
              <Swap swapKey={resendLabel}>{resendLabel}</Swap>
            </AnimatedSize>
          </Button>
          <MorphButton
            type='submit'
            size='lg'
            state={busyOf(state.isChecking)}
            labels={SIGN_IN_LABELS}
            className={cn(
              'w-full @sm:w-auto',
              pressedSolidOf(pressed === 'sign-in')
            )}
          />
        </div>
      </form>
    </>
  );
}

type CreateRowProps = {
  state: AuthState;
  onAction: (action: AuthAction) => void;
  onToggle: () => void;
  onCreate: () => void;
};

/** An empty slot that invites an addition: a dashed row that opens into a name and Create. */
function CreateRow({ state, onAction, onToggle, onCreate }: CreateRowProps) {
  const fade = fadePresence();

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onCreate();
  }

  function closeOnEscape(event: React.KeyboardEvent<HTMLFormElement>) {
    if (event.key !== 'Escape') {
      return;
    }
    event.preventDefault();
    onToggle();
  }

  return (
    <AnimatePresence mode='popLayout' initial={false}>
      {!state.isCreating && (
        <motion.div key='row' {...fade}>
          <button
            type='button'
            data-create-workspace
            onClick={onToggle}
            className='hairline-border border-foreground/20 text-muted-foreground hover:text-foreground hover:bg-foreground/[0.03] focus-visible:ring-ring/25 flex w-full cursor-pointer items-center gap-3 rounded-lg border-dashed px-2.5 py-2 text-start text-[13px] transition-colors duration-150 outline-none focus-visible:ring-[3px]'
          >
            <span className='bg-foreground/[0.05] flex size-7 items-center justify-center rounded-md'>
              <PlusIcon className='size-4' />
            </span>
            Create workspace
          </button>
        </motion.div>
      )}
      {state.isCreating && (
        <motion.form
          key='form'
          noValidate
          onSubmit={submit}
          onKeyDown={closeOnEscape}
          className='bg-foreground/[0.03] flex flex-col gap-3 rounded-lg p-3'
          {...fade}
        >
          <Field invalid={state.newNameError !== null} className='gap-0'>
            <FieldLabel className='mb-1.5'>Workspace name</FieldLabel>
            <Input
              data-new-workspace
              autoComplete='organization'
              placeholder='Your team or company'
              maxLength={WORKSPACE_NAME_MAX_LENGTH}
              value={state.newName}
              onChange={(event) =>
                onAction({ type: 'newNameTyped', value: event.target.value })
              }
            />
            <FieldProblem problem={state.newNameError} />
          </Field>
          <div className='flex justify-end gap-2'>
            <Button type='button' variant='ghost' size='sm' onClick={onToggle}>
              Cancel
            </Button>
            <Button type='submit' size='sm'>
              Create and open
            </Button>
          </div>
        </motion.form>
      )}
    </AnimatePresence>
  );
}

type WorkspaceMarkProps = {
  workspace: Workspace;
  isLarge?: boolean;
};

function markClassOf(isLarge: boolean) {
  if (isLarge) {
    return 'size-14 rounded-xl';
  }
  return undefined;
}

/** The mark of the workspace travels from its row to the middle of the card when it opens. */
export function WorkspaceMark({
  workspace,
  isLarge = false,
}: WorkspaceMarkProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const travel = springOf(shouldReduceMotion);

  return (
    <motion.span
      layoutId={`mark-${workspace.id}`}
      layoutDependency={isLarge}
      transition={travel}
      className='flex shrink-0'
    >
      <CompanyMark
        seed={workspace.name}
        size='lg'
        className={markClassOf(isLarge)}
      />
    </motion.span>
  );
}

type WorkspaceStepProps = {
  state: AuthState;
  pressed: string | null;
  onAction: (action: AuthAction) => void;
  onPick: (id: string) => void;
  onToggleCreate: () => void;
  onCreate: () => void;
  onRestart: () => void;
};

export function WorkspaceStep({
  state,
  pressed,
  onAction,
  onPick,
  onToggleCreate,
  onCreate,
  onRestart,
}: WorkspaceStepProps) {
  return (
    <>
      <CardHead
        mark={<Avatar seed={PERSON_NAME} className='size-10' />}
        title='Pick a workspace'
      >
        Signed in as{' '}
        <span className='text-foreground font-medium break-all'>
          {state.account}
        </span>
        .{' '}
        <Button
          type='button'
          variant='link'
          onClick={onRestart}
          className='h-auto px-0 text-[13px]'
        >
          Not you?
        </Button>
      </CardHead>
      <div className='flex flex-col gap-1.5'>
        <ul aria-label='Your workspaces' className='flex flex-col gap-1.5'>
          {state.workspaces.map((workspace) => (
            <li key={workspace.id}>
              <button
                type='button'
                data-workspace={workspace.id}
                onClick={() => onPick(workspace.id)}
                className={cn(
                  ROW,
                  pressedQuietOf(pressed === `workspace-${workspace.id}`)
                )}
              >
                <WorkspaceMark workspace={workspace} />
                <span className='flex min-w-0 flex-1 flex-col'>
                  <span className='truncate text-[13px] font-medium'>
                    {workspace.name}
                  </span>
                  <span className='text-muted-foreground text-xs'>
                    {membersOf(workspace.members)}
                  </span>
                </span>
                <ChevronRightIcon className='text-muted-foreground size-4 shrink-0' />
              </button>
            </li>
          ))}
        </ul>
        <CreateRow
          state={state}
          onAction={onAction}
          onToggle={onToggleCreate}
          onCreate={onCreate}
        />
      </div>
    </>
  );
}

export function OpeningStep({ workspace }: { workspace: Workspace }) {
  return (
    <div className='flex flex-col items-center gap-4 py-4 text-center'>
      <WorkspaceMark workspace={workspace} isLarge />
      <div className='flex flex-col items-center gap-1.5'>
        <h1
          data-step-heading
          tabIndex={-1}
          className='flex items-center gap-2 text-xl font-semibold text-balance outline-none'
        >
          <LoaderCircleIcon className='text-muted-foreground size-5 shrink-0 animate-spin' />
          {`Opening ${workspace.name}`}
        </h1>
        <p className='text-muted-foreground text-[13px]'>
          Loading its projects and timesheets
        </p>
      </div>
    </div>
  );
}

type DoneStepProps = {
  workspace: Workspace;
  account: string;
  onSwitch: () => void;
  onRestart: () => void;
};

export function DoneStep({
  workspace,
  account,
  onSwitch,
  onRestart,
}: DoneStepProps) {
  return (
    <div className='flex flex-col items-center gap-5 py-2 text-center'>
      <span className='relative flex'>
        <WorkspaceMark workspace={workspace} isLarge />
        <StatusOrb
          tone='success'
          size='sm'
          className='absolute -end-2.5 -bottom-2.5'
        />
      </span>
      <div className='flex flex-col items-center gap-1.5'>
        <h1
          data-step-heading
          tabIndex={-1}
          className='text-xl font-semibold text-balance outline-none'
        >
          {`You are in ${workspace.name}`}
        </h1>
        <p className='text-muted-foreground text-[13px] text-pretty'>
          {`${membersOf(workspace.members)}. Signed in as `}
          <span className='text-foreground font-medium break-all'>
            {account}
          </span>
        </p>
      </div>
      <div className='flex flex-wrap justify-center gap-2'>
        <Button type='button' variant='outline' onClick={onSwitch}>
          Switch workspace
        </Button>
        <Button type='button' variant='ghost' onClick={onRestart}>
          Sign out
        </Button>
      </div>
    </div>
  );
}
