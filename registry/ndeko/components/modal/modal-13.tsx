'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useId, useState } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import {
  CircleCheckIcon,
  ClockIcon,
  CreditCardIcon,
  DownloadIcon,
  FolderIcon,
  LayersIcon,
  RotateCcwIcon,
  Trash2Icon,
  UsersIcon,
  type Icon,
} from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';
import { Chip } from '@/registry/ndeko/ui/chip';
import { Input } from '@/registry/ndeko/ui/input';

import {
  ActionButton,
  useTimedAction,
  type ActionLabels,
  type ActionState,
} from './_parts/action-button';
import {
  ModalCloseButton,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalPreview,
  ModalTitle,
} from './_parts/modal-frame';
import { rowVariantsOf } from './_parts/motion';
import { WORKSPACE_NAME } from './_parts/people';
import { Swap } from './_parts/swap';

type Consequence = { id: string; icon: Icon; text: string };

const CONSEQUENCES: Consequence[] = [
  {
    id: 'projects',
    icon: FolderIcon,
    text: '12 projects and their 1,240 tasks are deleted',
  },
  {
    id: 'members',
    icon: UsersIcon,
    text: '18 members lose access at once',
  },
  {
    id: 'time',
    icon: ClockIcon,
    text: 'Time logs, timesheets and reports are erased',
  },
  {
    id: 'billing',
    icon: CreditCardIcon,
    text: 'The Team plan stops at the end of the billing period',
  },
];

const DELETE_LABELS: ActionLabels = {
  idle: 'Delete workspace',
  working: 'Deleting',
  done: 'Deleted',
};

const EXPORT_LABELS: ActionLabels = {
  idle: 'Export the data first',
  working: 'Preparing the export',
  done: 'Export sent by e-mail',
};

const WORKSPACE_GEM = { '--gem': 'var(--primary)' } as React.CSSProperties;

function shownStateOf(state: ActionState, isDeleted: boolean): ActionState {
  if (isDeleted) {
    return 'done';
  }
  return state;
}

function WorkspaceCard() {
  return (
    <div className='bg-card hairline-ring ring-border flex items-center gap-3 rounded-xl p-3 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
      <span
        style={WORKSPACE_GEM}
        className='gem-plate flex size-10 shrink-0 items-center justify-center rounded-lg'
      >
        <LayersIcon className='size-5' strokeWidth={2} />
      </span>
      <div className='flex min-w-0 flex-col gap-0.5'>
        <div className='flex items-center gap-2'>
          <p className='truncate text-sm font-medium'>{WORKSPACE_NAME}</p>
          <Chip color='var(--primary)'>Team plan</Chip>
        </div>
        <p className='text-muted-foreground truncate text-xs tabular-nums'>
          18 members · 12 projects · since March 2024
        </p>
      </div>
    </div>
  );
}

function ConsequenceList() {
  return (
    <ul
      aria-label='What deleting does'
      className='bg-destructive/[0.05] flex flex-col gap-2.5 rounded-xl p-3.5'
    >
      {CONSEQUENCES.map((consequence) => {
        const ConsequenceGlyph = consequence.icon;

        return (
          <li
            key={consequence.id}
            className='flex items-start gap-2.5 text-[13px]'
          >
            <ConsequenceGlyph className='text-destructive-ink/80 mt-0.5 size-4 shrink-0' />
            {consequence.text}
          </li>
        );
      })}
    </ul>
  );
}

function DeleteWorkspaceContent() {
  const [typedName, setTypedName] = useState('');
  const [isDeleted, setIsDeleted] = useState(false);
  const deletion = useTimedAction();
  const exporting = useTimedAction();
  const shouldReduceMotion = usePrefersReducedMotion();
  const rowVariants = rowVariantsOf(shouldReduceMotion);
  const fieldId = useId();
  const hintId = useId();
  const isMatch = typedName.trim() === WORKSPACE_NAME;
  const matchKey = String(isMatch);
  const isIdle = deletion.state === 'idle';
  const isDeleteDisabled = isIdle && !isMatch;
  const isLocked = deletion.isBusy || isDeleted;
  const shownState = shownStateOf(deletion.state, isDeleted);

  function changeTypedName(event: React.ChangeEvent<HTMLInputElement>) {
    setTypedName(event.target.value);
  }

  function markDeleted() {
    setIsDeleted(true);
  }

  function deleteWorkspace(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const canDelete = isMatch && !isDeleted;
    if (!canDelete) {
      return;
    }
    deletion.run(markDeleted);
  }

  function exportData() {
    exporting.run(() => {});
  }

  function restore() {
    setIsDeleted(false);
    setTypedName('');
  }

  return (
    <form onSubmit={deleteWorkspace} className='flex flex-col gap-4'>
      <ModalHeader>
        <ModalTitle>{`Delete the ${WORKSPACE_NAME} workspace`}</ModalTitle>
        <ModalDescription>
          It goes for everyone in it. Owners can restore it for 30 days, then it
          is gone for good
        </ModalDescription>
      </ModalHeader>
      <WorkspaceCard />
      <ConsequenceList />
      <ActionButton
        type='button'
        variant='link'
        size='sm'
        state={exporting.state}
        labels={EXPORT_LABELS}
        idleIcon={<DownloadIcon />}
        onClick={exportData}
        className='-ml-1 self-start px-1'
      />
      <div className='flex flex-col gap-1.5'>
        <label htmlFor={fieldId} className='text-[13px]'>
          Type <span className='font-medium'>{WORKSPACE_NAME}</span> to confirm
        </label>
        <div className='relative'>
          <Input
            id={fieldId}
            autoComplete='off'
            spellCheck={false}
            value={typedName}
            disabled={isLocked}
            aria-describedby={hintId}
            placeholder={WORKSPACE_NAME}
            onChange={changeTypedName}
            className='pr-9'
          />
          <Swap
            swapKey={matchKey}
            className='pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2'
          >
            {isMatch && (
              <CircleCheckIcon className='text-success-foreground size-4' />
            )}
          </Swap>
        </div>
        <p id={hintId} className='text-muted-foreground text-xs'>
          The name is case sensitive
        </p>
      </div>
      <AnimatePresence initial={false}>
        {isDeleted && (
          <motion.div
            key='deleted'
            variants={rowVariants}
            initial='hidden'
            animate='shown'
            exit='hidden'
          >
            <div className='bg-foreground/[0.03] flex items-center gap-3 rounded-xl p-3'>
              <p className='min-w-0 flex-1 text-[13px]'>
                {`${WORKSPACE_NAME} is deleted. It stays restorable from Settings until 5 December`}
              </p>
              <Button variant='outline' size='sm' onClick={restore}>
                <RotateCcwIcon />
                Restore
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <ModalFooter>
        <ModalCloseButton type='button' variant='ghost'>
          Cancel
        </ModalCloseButton>
        <ActionButton
          type='submit'
          variant='destructive'
          state={shownState}
          labels={DELETE_LABELS}
          idleIcon={<Trash2Icon />}
          disabled={isDeleteDisabled}
        />
      </ModalFooter>
    </form>
  );
}

export default function Modal13() {
  return (
    <ModalPreview triggerLabel='Open delete workspace' size='md'>
      <DeleteWorkspaceContent />
    </ModalPreview>
  );
}
