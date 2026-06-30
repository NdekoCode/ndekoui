'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useId, useRef, useState } from 'react';

import {
  BlocksIcon,
  PlusIcon,
  RefreshCwIcon,
  XIcon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Chip } from '@/registry/ndeko/ui/chip';
import { Switch } from '@/registry/ndeko/ui/switch';

import { ActionButton, useTimedAction } from './_parts/action-button';
import { CopyButton } from './_parts/copy-button';
import {
  ModalCloseButton,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalPreview,
  ModalTitle,
} from './_parts/modal-frame';
import { chipVariantsOf } from './_parts/motion';
import { WORKSPACE_NAME } from './_parts/people';
import { RoleSelect, TEAM_ROLES, type TeamRole } from './_parts/role-select';
import { Swap } from './_parts/swap';

const CODES = [
  ['LAT', '7Q4M', '92K'],
  ['LAT', 'P5ZR', 'W8C'],
  ['LAT', 'K2VF', 'Y4D'],
];

const DOMAIN_PATTERN = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/;

const INITIAL_DOMAINS = ['lattice.example', 'northfield.example'];

function domainLineOf(isOn: boolean, count: number) {
  if (!isOn) {
    return 'Only people you invite can join';
  }
  if (count === 0) {
    return 'Add a domain so people can join with their work e-mail';
  }
  if (count === 1) {
    return 'People with an address at this domain join without an invitation';
  }
  return 'People with an address at these domains join without an invitation';
}

function normalizeDomain(value: string) {
  const trimmed = value.trim();
  const lowered = trimmed.toLowerCase();
  return lowered.replace(/^@/, '');
}

function SectionTitle({
  id,
  children,
}: {
  id?: string;
  children: React.ReactNode;
}) {
  return (
    <h3 id={id} className='text-[13px] font-medium'>
      {children}
    </h3>
  );
}

function JoinCode() {
  const [codeIndex, setCodeIndex] = useState(0);
  const action = useTimedAction();
  const code = CODES[codeIndex];
  const codeText = code.join('-');

  function commitNewCode() {
    setCodeIndex((previous) => {
      const next = previous + 1;
      return next % CODES.length;
    });
  }

  function makeNewCode() {
    action.run(commitNewCode);
  }

  return (
    <section className='flex flex-col gap-2'>
      <SectionTitle>Join with a code</SectionTitle>
      <div className='flex flex-wrap items-center gap-2'>
        <Swap swapKey={codeText} kind='label' className='gap-1'>
          {code.map((part) => (
            <span
              key={part}
              className='keycap-3d rounded-md px-2 py-1 font-mono text-[13px] font-medium tabular-nums'
            >
              {part}
            </span>
          ))}
        </Swap>
        <CopyButton
          text={codeText}
          variant='ghost'
          size='icon-sm'
          aria-label='Copy the join code'
          announcement='Join code copied'
          className='text-muted-foreground'
        />
        <ActionButton
          variant='ghost'
          size='sm'
          state={action.state}
          onClick={makeNewCode}
          idleIcon={<RefreshCwIcon />}
          className='text-muted-foreground ml-auto'
          labels={{
            idle: 'New code',
            working: 'Making a code',
            done: 'New code ready',
          }}
        />
      </div>
      <p className='text-muted-foreground text-xs'>
        People type it in the app after they sign up. A new code ends the old
        one
      </p>
    </section>
  );
}

function DomainChip({
  domain,
  onRemove,
}: {
  domain: string;
  onRemove: (domain: string) => void;
}) {
  const shouldReduceMotion = useReducedMotion();
  const variants = chipVariantsOf(shouldReduceMotion);
  const allowsLayout = !shouldReduceMotion;

  function remove() {
    onRemove(domain);
  }

  return (
    <motion.li
      layout={allowsLayout}
      variants={variants}
      initial='hidden'
      animate='shown'
      exit='hidden'
      className='flex'
    >
      <Chip
        color='var(--muted-foreground)'
        className='h-7 gap-1 pr-0.5 pl-2 text-[13px]'
      >
        {`@${domain}`}
        <button
          type='button'
          aria-label={`Remove ${domain}`}
          onClick={remove}
          className='hover:bg-foreground/10 focus-visible:ring-ring/25 flex size-6 cursor-pointer items-center justify-center rounded-[5px] outline-none focus-visible:ring-[3px]'
        >
          <XIcon className='size-3' />
        </button>
      </Chip>
    </motion.li>
  );
}

function DomainSlot({
  takenDomains,
  onAdd,
}: {
  takenDomains: string[];
  onAdd: (domain: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const errorId = useId();
  const hasError = Boolean(error);

  function open() {
    setIsOpen(true);
    window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }

  function close() {
    setIsOpen(false);
    setDraft('');
    setError(null);
  }

  function changeDraft(event: React.ChangeEvent<HTMLInputElement>) {
    setDraft(event.target.value);
    setError(null);
  }

  function commit() {
    const domain = normalizeDomain(draft);
    if (domain.length === 0) {
      close();
      return;
    }
    if (!DOMAIN_PATTERN.test(domain)) {
      setError(`${domain} is not a domain like company.com`);
      return;
    }
    if (takenDomains.includes(domain)) {
      setError(`${domain} is already on the list`);
      return;
    }
    onAdd(domain);
    setDraft('');
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault();
      commit();
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
    }
  }

  if (!isOpen) {
    return (
      <li className='flex'>
        <button
          type='button'
          onClick={open}
          className='hairline-border border-foreground/25 text-muted-foreground hover:bg-foreground/[0.03] hover:text-foreground focus-visible:ring-ring/25 flex h-7 cursor-pointer items-center gap-1 rounded-md border-dashed px-2 text-[13px] outline-none focus-visible:ring-[3px]'
        >
          <PlusIcon className='size-3.5' />
          Add domain
        </button>
      </li>
    );
  }

  return (
    <li className='flex flex-col gap-1'>
      <input
        ref={inputRef}
        type='text'
        autoComplete='off'
        spellCheck={false}
        aria-label='Domain to allow'
        aria-invalid={hasError}
        aria-describedby={errorId}
        placeholder='company.com'
        value={draft}
        onChange={changeDraft}
        onKeyDown={handleKeyDown}
        onBlur={commit}
        className={cn(
          'hairline-border border-foreground/25 placeholder:text-muted-foreground/75 focus-visible:ring-ring/25 h-7 w-40 rounded-md border-dashed bg-transparent px-2 text-base outline-none focus-visible:border-solid focus-visible:ring-[3px] md:text-[13px]',
          hasError && 'border-destructive/60'
        )}
      />
      {hasError && (
        <p id={errorId} className='text-destructive-ink text-xs'>
          {error}
        </p>
      )}
    </li>
  );
}

function DomainJoin() {
  const [isOn, setIsOn] = useState(true);
  const [domains, setDomains] = useState<string[]>(INITIAL_DOMAINS);
  const switchId = useId();
  const line = domainLineOf(isOn, domains.length);

  function addDomain(domain: string) {
    setDomains((previous) => [...previous, domain]);
  }

  function removeDomain(domain: string) {
    setDomains((previous) => previous.filter((item) => item !== domain));
  }

  return (
    <section className='flex flex-col gap-2'>
      <div className='flex items-start justify-between gap-4'>
        <div className='flex min-w-0 flex-col gap-0.5'>
          <label htmlFor={switchId} className='text-[13px] font-medium'>
            Join with a work e-mail
          </label>
          <Swap
            swapKey={line}
            kind='label'
            className='text-muted-foreground flex min-w-0 text-xs'
            contentClassName='max-w-full min-w-0 whitespace-normal'
          >
            {line}
          </Swap>
        </div>
        <Switch id={switchId} checked={isOn} onCheckedChange={setIsOn} />
      </div>
      <AnimatedSize>
        {isOn && (
          <ul
            aria-label='Allowed domains'
            className='relative flex flex-wrap items-start gap-1.5 pt-1'
          >
            <AnimatePresence initial={false} mode='popLayout'>
              {domains.map((domain) => (
                <DomainChip
                  key={domain}
                  domain={domain}
                  onRemove={removeDomain}
                />
              ))}
            </AnimatePresence>
            <DomainSlot takenDomains={domains} onAdd={addDomain} />
          </ul>
        )}
      </AnimatedSize>
    </section>
  );
}

function WorkspaceAccess() {
  const [role, setRole] = useState<TeamRole>('member');
  const roleLabelId = useId();

  return (
    <>
      <div className='flex items-start gap-3 pr-8'>
        <span className='gem-plate flex size-9 shrink-0 items-center justify-center rounded-lg [--gem:var(--primary)]'>
          <BlocksIcon className='size-4' strokeWidth={2.25} />
        </span>
        <ModalHeader className='pr-0'>
          <ModalTitle>Workspace access</ModalTitle>
          <ModalDescription>
            {`Choose how people join ${WORKSPACE_NAME} without an invitation`}
          </ModalDescription>
        </ModalHeader>
      </div>
      <div className='flex flex-col gap-6 pt-1'>
        <JoinCode />
        <DomainJoin />
        <section className='flex items-center justify-between gap-4'>
          <div className='flex min-w-0 flex-col gap-0.5'>
            <SectionTitle id={roleLabelId}>
              Role of people who join
            </SectionTitle>
            <p className='text-muted-foreground text-xs'>
              You can change it for each person later
            </p>
          </div>
          <RoleSelect
            label='Role of people who join'
            value={role}
            options={TEAM_ROLES}
            onValueChange={setRole}
            className='text-foreground'
          />
        </section>
      </div>
      <ModalFooter>
        <ModalCloseButton>Done</ModalCloseButton>
      </ModalFooter>
    </>
  );
}

export default function Modal07() {
  return (
    <ModalPreview triggerLabel='Open the workspace access dialog' size='md'>
      <WorkspaceAccess />
    </ModalPreview>
  );
}
