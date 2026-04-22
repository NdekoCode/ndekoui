'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
  useReducedMotion,
} from 'motion/react';
import { useEffect, useId, useRef, useState } from 'react';

import { cn } from '@/registry/ndeko/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/registry/ndeko/ui/alert-dialog';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Button } from '@/registry/ndeko/ui/button';
import { Input } from '@/registry/ndeko/ui/input';

import { WORKSPACE_FACTS } from './data';
import { SettingsRow } from './settings-kit';

const HOLD_MS = 2000;

const SWAP_TRANSITION: Transition = { duration: 0.15, ease: [0.2, 0, 0, 1] };

const SWAP_VARIANTS: Variants = {
  enter: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
  visible: { opacity: 1, scale: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
};

const LINE_VARIANTS: Variants = {
  enter: { opacity: 0, y: 4 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
};

const FADE_VARIANTS: Variants = {
  enter: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const COUNT_FORMAT = new Intl.NumberFormat('en');

function swapVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return SWAP_VARIANTS;
}

function lineVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return LINE_VARIANTS;
}

function clearTimer(timerRef: React.RefObject<number | null>) {
  if (timerRef.current === null) {
    return;
  }
  window.clearTimeout(timerRef.current);
  timerRef.current = null;
}

function isHoldKey(event: React.KeyboardEvent) {
  const isSpace = event.key === ' ';
  const isEnter = event.key === 'Enter';
  return isSpace || isEnter;
}

/**
 * Clip-path moves the fill; with reduced motion the fill fades in over the same two seconds,
 * because the theme drops clip-path transitions in that mode.
 */
function holdFillClassOf(
  isHolding: boolean,
  shouldReduceMotion: boolean | null
) {
  if (shouldReduceMotion) {
    return cn(
      'opacity-0 transition-opacity duration-200',
      isHolding && 'opacity-100 duration-[2000ms] ease-linear'
    );
  }
  return cn(
    '[clip-path:inset(0_100%_0_0)] transition-[clip-path] duration-200 ease-(--ease-out-strong)',
    isHolding && '[clip-path:inset(0_0_0_0)] duration-[2000ms] ease-linear'
  );
}

function holdLabelOf(isHolding: boolean, label: string) {
  if (isHolding) {
    return 'Keep holding';
  }
  return label;
}

type HoldButtonProps = {
  label: string;
  hint: string;
  onComplete: () => void;
};

/** A destructive action that asks for intent: the fill crosses the pill while it is pressed and drains on release. */
function HoldButton({ label, hint, onComplete }: HoldButtonProps) {
  const [isHolding, setIsHolding] = useState(false);
  const timerRef = useRef<number | null>(null);
  const hintId = useId();
  const shouldReduceMotion = useReducedMotion();
  const variants = swapVariantsOf(shouldReduceMotion);
  const fillClass = holdFillClassOf(isHolding, shouldReduceMotion);
  const shownLabel = holdLabelOf(isHolding, label);

  useEffect(() => {
    return () => clearTimer(timerRef);
  }, []);

  function startHold() {
    if (timerRef.current !== null) {
      return;
    }
    setIsHolding(true);
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      setIsHolding(false);
      onComplete();
    }, HOLD_MS);
  }

  function stopHold() {
    clearTimer(timerRef);
    setIsHolding(false);
  }

  function pressKey(event: React.KeyboardEvent<HTMLButtonElement>) {
    const isHold = isHoldKey(event);
    if (!isHold) {
      return;
    }
    event.preventDefault();
    if (!event.repeat) {
      startHold();
    }
  }

  function releaseKey(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (isHoldKey(event)) {
      stopHold();
    }
  }

  return (
    <>
      <Button
        variant='outline'
        aria-describedby={hintId}
        onPointerDown={startHold}
        onPointerUp={stopHold}
        onPointerLeave={stopHold}
        onPointerCancel={stopHold}
        onKeyDown={pressKey}
        onKeyUp={releaseKey}
        onBlur={stopHold}
        className='text-destructive-ink touch-none overflow-hidden select-none [-webkit-touch-callout:none]'
      >
        <span
          aria-hidden='true'
          className={cn('bg-destructive/15 absolute inset-0', fillClass)}
        />
        <AnimatedSize as='span' axis='width' contentClassName='relative flex'>
          <AnimatePresence mode='popLayout' initial={false}>
            <motion.span
              key={shownLabel}
              variants={variants}
              initial='enter'
              animate='visible'
              exit='exit'
              transition={SWAP_TRANSITION}
            >
              {shownLabel}
            </motion.span>
          </AnimatePresence>
        </AnimatedSize>
      </Button>
      <span id={hintId} className='sr-only'>
        {hint}
      </span>
    </>
  );
}

function SwappingLine({ text }: { text: string }) {
  const shouldReduceMotion = useReducedMotion();
  const variants = lineVariantsOf(shouldReduceMotion);

  return (
    <span className='relative block'>
      <AnimatePresence mode='popLayout' initial={false}>
        <motion.span
          key={text}
          variants={variants}
          initial='enter'
          animate='visible'
          exit='exit'
          transition={SWAP_TRANSITION}
          className='block'
        >
          {text}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

type SwapSlotProps = {
  slotKey: string;
  children: React.ReactNode;
};

function SwapSlot({ slotKey, children }: SwapSlotProps) {
  const shouldReduceMotion = useReducedMotion();
  const variants = swapVariantsOf(shouldReduceMotion);

  return (
    <AnimatedSize axis='width' contentClassName='relative flex justify-end'>
      <AnimatePresence mode='popLayout' initial={false}>
        <motion.span
          key={slotKey}
          variants={variants}
          initial='enter'
          animate='visible'
          exit='exit'
          transition={SWAP_TRANSITION}
          className='flex'
        >
          {children}
        </motion.span>
      </AnimatePresence>
    </AnimatedSize>
  );
}

function countOf(count: number, singular: string, plural: string) {
  const digits = COUNT_FORMAT.format(count);
  if (count === 1) {
    return `1 ${singular}`;
  }
  return `${digits} ${plural}`;
}

const MEMBERS_LABEL = countOf(WORKSPACE_FACTS.members, 'member', 'members');

const PROJECTS_LABEL = countOf(WORKSPACE_FACTS.projects, 'project', 'projects');

const TASKS_LABEL = countOf(WORKSPACE_FACTS.tasks, 'task', 'tasks');

const GRACE_LABEL = countOf(WORKSPACE_FACTS.graceDays, 'day', 'days');

function accessLineOf(members: number) {
  if (members === 1) {
    return '1 member loses access';
  }
  return `${MEMBERS_LABEL} lose access`;
}

const ACCESS_LINE = accessLineOf(WORKSPACE_FACTS.members);

function archiveLineOf(isArchived: boolean) {
  if (isArchived) {
    return 'Archived just now. Everyone can read, nobody can edit or track time';
  }
  return 'Everyone keeps read access; nobody can edit or track time until you restore it';
}

function deleteLineOf(isScheduled: boolean) {
  if (isScheduled) {
    return `Deletion scheduled for ${WORKSPACE_FACTS.deletionDate}. Until then you can cancel it`;
  }
  return `After ${GRACE_LABEL}, removes ${MEMBERS_LABEL}, ${PROJECTS_LABEL} and ${TASKS_LABEL}`;
}

type DangerZoneProps = {
  workspaceName: string;
};

/** Destructive rows apply at once: archive asks for a two-second hold, delete asks for the name. */
export function DangerZone({ workspaceName }: DangerZoneProps) {
  const [isArchived, setIsArchived] = useState(false);
  const [isDeletionScheduled, setIsDeletionScheduled] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [typedName, setTypedName] = useState('');
  const confirmFieldId = useId();
  const isNameTyped = typedName.trim() === workspaceName;
  const archiveLine = archiveLineOf(isArchived);
  const deleteLine = deleteLineOf(isDeletionScheduled);
  const archiveSlotKey = String(isArchived);
  const deleteSlotKey = String(isDeletionScheduled);

  function archive() {
    setIsArchived(true);
  }

  function restore() {
    setIsArchived(false);
  }

  function openDeletion() {
    setTypedName('');
    setIsDialogOpen(true);
  }

  function changeTypedName(event: React.ChangeEvent<HTMLInputElement>) {
    setTypedName(event.target.value);
  }

  function scheduleDeletion() {
    setIsDeletionScheduled(true);
  }

  function cancelDeletion() {
    setIsDeletionScheduled(false);
  }

  return (
    <>
      <SettingsRow
        label='Archive workspace'
        line={<SwappingLine text={archiveLine} />}
      >
        <SwapSlot slotKey={archiveSlotKey}>
          {isArchived && (
            <Button variant='outline' onClick={restore}>
              Restore workspace
            </Button>
          )}
          {!isArchived && (
            <HoldButton
              label='Hold to archive'
              hint='Press and hold for two seconds to archive the workspace'
              onComplete={archive}
            />
          )}
        </SwapSlot>
      </SettingsRow>
      <SettingsRow
        label='Delete workspace'
        line={<SwappingLine text={deleteLine} />}
      >
        <SwapSlot slotKey={deleteSlotKey}>
          {isDeletionScheduled && (
            <Button variant='outline' onClick={cancelDeletion}>
              Cancel deletion
            </Button>
          )}
          {!isDeletionScheduled && (
            <Button
              variant='outline'
              onClick={openDeletion}
              className='text-destructive-ink'
            >
              Delete workspace
            </Button>
          )}
        </SwapSlot>
      </SettingsRow>
      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{`Delete ${workspaceName}?`}</AlertDialogTitle>
            <AlertDialogDescription>
              {`Nothing is removed for ${GRACE_LABEL}. After that it cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <ul className='bg-foreground/[0.03] hairline-divide-y divide-border flex flex-col rounded-lg text-[13px]'>
            <li className='px-3 py-2'>{ACCESS_LINE}</li>
            <li className='px-3 py-2'>{`${PROJECTS_LABEL} and ${TASKS_LABEL} are deleted`}</li>
            <li className='px-3 py-2'>
              Timesheets stay downloadable until the end
            </li>
          </ul>
          <div className='flex flex-col gap-1.5'>
            <label
              htmlFor={confirmFieldId}
              className='text-muted-foreground text-xs'
            >
              Type{' '}
              <span className='text-foreground font-medium'>
                {workspaceName}
              </span>{' '}
              to confirm
            </label>
            <Input
              id={confirmFieldId}
              value={typedName}
              autoComplete='off'
              spellCheck={false}
              onChange={changeTypedName}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep workspace</AlertDialogCancel>
            <AlertDialogAction
              variant='destructive'
              disabled={!isNameTyped}
              onClick={scheduleDeletion}
            >
              Delete workspace
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
