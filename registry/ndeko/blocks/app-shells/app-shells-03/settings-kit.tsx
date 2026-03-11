'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
  useReducedMotion,
} from 'motion/react';
import { useEffect, useId, useState } from 'react';

import { CheckIcon } from '@/registry/ndeko/lib/icons';
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
import { Button } from '@/registry/ndeko/ui/button';
import { Input } from '@/registry/ndeko/ui/input';
import { RadioGroup, RadioGroupItem } from '@/registry/ndeko/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/registry/ndeko/ui/select';
import { Switch } from '@/registry/ndeko/ui/switch';

export const SETTINGS_SURFACE =
  'bg-card hairline-ring ring-border hairline-divide-y divide-border overflow-hidden rounded-xl shadow-[0_1px_2px_rgb(0_0_0/0.04)]';

const SAVED_NOTICE_MS = 1600;

const SWAP_TRANSITION: Transition = { duration: 0.15, ease: [0.2, 0, 0, 1] };

const SWAP_VARIANTS: Variants = {
  enter: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
  visible: { opacity: 1, scale: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
};

const VIEW_VARIANTS: Variants = {
  enter: { opacity: 0, y: 4 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
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

function viewVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return VIEW_VARIANTS;
}

export function SettingsPage({
  title,
  line,
  children,
}: {
  title: string;
  line: string;
  children: React.ReactNode;
}) {
  return (
    <div className='min-h-0 flex-1 overflow-y-auto'>
      <div className='mx-auto flex w-full max-w-[42rem] flex-col gap-8 px-4 py-8 md:py-10'>
        <div className='flex flex-col gap-1'>
          <h1 className='text-2xl font-semibold text-balance'>{title}</h1>
          <p className='text-muted-foreground text-[13px]'>{line}</p>
        </div>
        {children}
      </div>
    </div>
  );
}

export function SettingsSection({
  title,
  line,
  children,
}: {
  title: string;
  line?: string;
  children: React.ReactNode;
}) {
  const headingId = useId();

  return (
    <section aria-labelledby={headingId} className='flex flex-col gap-3'>
      <div className='flex flex-col gap-0.5'>
        <h2 id={headingId} className='text-sm font-medium'>
          {title}
        </h2>
        {line && <p className='text-muted-foreground text-xs'>{line}</p>}
      </div>
      <div className={SETTINGS_SURFACE}>{children}</div>
    </section>
  );
}

type SettingsRowProps = {
  label: string;
  line: string;
  labelId?: string;
  lineId?: string;
  children: React.ReactNode;
};

export function SettingsRow({
  label,
  line,
  labelId,
  lineId,
  children,
}: SettingsRowProps) {
  return (
    <div className='flex min-h-14 flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6'>
      <div className='flex min-w-0 flex-col gap-0.5'>
        <p id={labelId} className='text-[13px] font-medium'>
          {label}
        </p>
        <p id={lineId} className='text-muted-foreground text-xs'>
          {line}
        </p>
      </div>
      <div className='flex shrink-0 items-center gap-2'>{children}</div>
    </div>
  );
}

function EditLabel({ isSaved }: { isSaved: boolean }) {
  const shouldReduceMotion = useReducedMotion();
  const variants = swapVariantsOf(shouldReduceMotion);
  const labelKey = String(isSaved);

  return (
    <AnimatePresence mode='popLayout' initial={false}>
      <motion.span
        key={labelKey}
        variants={variants}
        initial='enter'
        animate='visible'
        exit='exit'
        transition={SWAP_TRANSITION}
        className='flex items-center gap-1.5'
      >
        {isSaved && <CheckIcon className='text-success-foreground size-3.5' />}
        {isSaved && 'Saved'}
        {!isSaved && 'Edit'}
      </motion.span>
    </AnimatePresence>
  );
}

export function describedByOf(hasError: boolean, errorId: string) {
  if (hasError) {
    return errorId;
  }
  return undefined;
}

type InlineTextRowProps = {
  label: string;
  line: string;
  value: string;
  inputType?: 'text' | 'email';
  validate: (draft: string) => string | null;
  onSave: (nextValue: string) => void;
};

export function InlineTextRow({
  label,
  line,
  value,
  inputType = 'text',
  validate,
  onSave,
}: InlineTextRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const viewVariants = viewVariantsOf(shouldReduceMotion);
  const errorId = useId();
  const hasError = Boolean(error);
  const showsError = isEditing && hasError;
  const describedBy = describedByOf(hasError, errorId);
  const viewKey = String(isEditing);

  useEffect(() => {
    if (!isSaved) {
      return;
    }
    const timer = window.setTimeout(() => setIsSaved(false), SAVED_NOTICE_MS);
    return () => window.clearTimeout(timer);
  }, [isSaved]);

  function startEditing() {
    setDraft(value);
    setError(null);
    setIsSaved(false);
    setIsEditing(true);
  }

  function cancelEditing() {
    setError(null);
    setIsEditing(false);
  }

  function changeDraft(event: React.ChangeEvent<HTMLInputElement>) {
    setDraft(event.target.value);
    setError(null);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      cancelEditing();
    }
  }

  function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = draft.trim();
    const problem = validate(trimmed);
    if (problem) {
      setError(problem);
      return;
    }
    onSave(trimmed);
    setIsEditing(false);
    setIsSaved(true);
  }

  return (
    <div className='flex min-h-14 flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6'>
      <div className='flex min-w-0 shrink-0 flex-col gap-0.5'>
        <p className='text-[13px] font-medium'>{label}</p>
        <p className='text-muted-foreground text-xs'>{line}</p>
      </div>
      <AnimatePresence mode='popLayout' initial={false}>
        <motion.div
          key={viewKey}
          variants={viewVariants}
          initial='enter'
          animate='visible'
          exit='exit'
          transition={SWAP_TRANSITION}
          className='flex min-w-0 flex-col gap-1.5 sm:items-end'
        >
          {isEditing && (
            <form onSubmit={save} className='flex items-center gap-2'>
              <Input
                autoFocus
                type={inputType}
                size='sm'
                value={draft}
                aria-label={label}
                aria-invalid={hasError}
                aria-describedby={describedBy}
                onChange={changeDraft}
                onKeyDown={handleKeyDown}
                className='w-full sm:w-56'
              />
              <Button
                type='button'
                variant='ghost'
                size='sm'
                onClick={cancelEditing}
              >
                Cancel
              </Button>
              <Button type='submit' size='sm'>
                Save
              </Button>
            </form>
          )}
          {showsError && (
            <p id={errorId} className='text-destructive-ink text-xs'>
              {error}
            </p>
          )}
          {!isEditing && (
            <div className='flex min-w-0 items-center gap-2'>
              <span className='min-w-0 truncate text-[13px]'>{value}</span>
              <Button
                variant='ghost'
                size='sm'
                aria-label={`Edit ${label.toLowerCase()}`}
                onClick={startEditing}
                className='text-muted-foreground'
              >
                <EditLabel isSaved={isSaved} />
              </Button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

type SwitchRowProps = {
  label: string;
  line: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
};

export function SwitchRow({
  label,
  line,
  checked,
  onCheckedChange,
}: SwitchRowProps) {
  const labelId = useId();
  const lineId = useId();

  return (
    <SettingsRow label={label} line={line} labelId={labelId} lineId={lineId}>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        aria-labelledby={labelId}
        aria-describedby={lineId}
      />
    </SettingsRow>
  );
}

type SelectOption = { value: string; label: string };

type SelectRowProps = {
  label: string;
  line: string;
  value: string;
  options: SelectOption[];
  onValueChange: (value: string) => void;
};

export function SelectRow({
  label,
  line,
  value,
  options,
  onValueChange,
}: SelectRowProps) {
  const labelId = useId();

  function changeValue(nextValue: unknown) {
    if (typeof nextValue === 'string') {
      onValueChange(nextValue);
    }
  }

  return (
    <SettingsRow label={label} line={line} labelId={labelId}>
      <Select items={options} value={value} onValueChange={changeValue}>
        <SelectTrigger aria-labelledby={labelId} className='w-full sm:w-48'>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </SettingsRow>
  );
}

type ChoiceOption = { value: string; label: string; line: string };

type ChoiceCardsProps = {
  label: string;
  value: string;
  options: ChoiceOption[];
  onValueChange: (value: string) => void;
};

export function ChoiceCards({
  label,
  value,
  options,
  onValueChange,
}: ChoiceCardsProps) {
  function changeValue(nextValue: unknown) {
    if (typeof nextValue === 'string') {
      onValueChange(nextValue);
    }
  }

  return (
    <RadioGroup
      aria-label={label}
      value={value}
      onValueChange={changeValue}
      className={cn(SETTINGS_SURFACE, 'gap-0')}
    >
      {options.map((option) => {
        const isPicked = option.value === value;

        return (
          <label
            key={option.value}
            className={cn(
              'flex cursor-pointer items-start gap-3 px-4 py-3 transition-colors duration-150',
              isPicked && 'bg-primary/[0.06]'
            )}
          >
            <RadioGroupItem value={option.value} className='mt-0.5' />
            <span className='flex min-w-0 flex-col gap-0.5'>
              <span className='text-[13px] font-medium'>{option.label}</span>
              <span className='text-muted-foreground text-xs'>
                {option.line}
              </span>
            </span>
          </label>
        );
      })}
    </RadioGroup>
  );
}

type DangerRowProps = {
  label: string;
  line: string;
  dialogTitle: string;
  actionLabel: string;
  objectName: string;
  consequences: string[];
  scheduledLine: string;
};

export function DangerRow({
  label,
  line,
  dialogTitle,
  actionLabel,
  objectName,
  consequences,
  scheduledLine,
}: DangerRowProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [typedName, setTypedName] = useState('');
  const [isScheduled, setIsScheduled] = useState(false);
  const confirmFieldId = useId();
  const isNameTyped = typedName.trim() === objectName;

  function openConfirmation() {
    setTypedName('');
    setIsOpen(true);
  }

  function changeTypedName(event: React.ChangeEvent<HTMLInputElement>) {
    setTypedName(event.target.value);
  }

  function confirmDeletion() {
    setIsScheduled(true);
  }

  function cancelDeletion() {
    setIsScheduled(false);
  }

  if (isScheduled) {
    return (
      <SettingsRow label={label} line={scheduledLine}>
        <Button variant='outline' onClick={cancelDeletion}>
          Cancel deletion
        </Button>
      </SettingsRow>
    );
  }

  return (
    <SettingsRow label={label} line={line}>
      <Button
        variant='outline'
        onClick={openConfirmation}
        className='text-destructive-ink'
      >
        {actionLabel}
      </Button>
      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{dialogTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone once the grace period ends
            </AlertDialogDescription>
          </AlertDialogHeader>
          <ul className='bg-foreground/[0.03] hairline-divide-y divide-border flex flex-col rounded-lg'>
            {consequences.map((consequence) => (
              <li key={consequence} className='px-3 py-2 text-[13px]'>
                {consequence}
              </li>
            ))}
          </ul>
          <div className='flex flex-col gap-1.5'>
            <label
              htmlFor={confirmFieldId}
              className='text-muted-foreground text-xs'
            >
              Type{' '}
              <span className='text-foreground font-medium'>{objectName}</span>{' '}
              to confirm
            </label>
            <Input
              id={confirmFieldId}
              value={typedName}
              autoComplete='off'
              onChange={changeTypedName}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction
              variant='destructive'
              disabled={!isNameTyped}
              onClick={confirmDeletion}
            >
              {actionLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SettingsRow>
  );
}
