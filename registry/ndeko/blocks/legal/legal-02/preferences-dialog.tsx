'use client';

import { useId } from 'react';

import {
  pressedQuietOf,
  pressedSolidOf,
} from '@/registry/ndeko/lib/demonstration';
import { LockIcon, XIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Button } from '@/registry/ndeko/ui/button';
import { Switch } from '@/registry/ndeko/ui/switch';

import {
  NECESSARY,
  OPTIONAL_CATEGORIES,
  SITE_NAME,
  type Category,
  type OptionalCategoryId,
} from './data';
import type { ConsentDraft } from './session';

function layerOf(isOpen: boolean) {
  if (isOpen) {
    return undefined;
  }
  return 'pointer-events-none';
}

function backdropOf(isOpen: boolean) {
  if (isOpen) {
    return 'opacity-100';
  }
  return 'opacity-0';
}

function panelOf(isOpen: boolean) {
  if (isOpen) {
    return 'scale-100 opacity-100';
  }
  return 'scale-95 opacity-0 duration-150';
}

type CategoryRowProps = {
  category: Category;
  isOn: boolean;
  isLocked: boolean;
  isPressed: boolean;
  /** A locked category takes no change. */
  onSwitch?: (isOn: boolean) => void;
};

function CategoryRow({
  category,
  isOn,
  isLocked,
  isPressed,
  onSwitch,
}: CategoryRowProps) {
  const nameId = useId();
  const lineId = useId();

  return (
    <li className='flex items-start gap-4 py-3'>
      <div className='flex min-w-0 flex-1 flex-col gap-1'>
        <p
          id={nameId}
          className='flex flex-wrap items-center gap-2 text-[13px] font-medium'
        >
          {category.name}
          {isLocked && (
            <Badge variant='secondary'>
              <LockIcon />
              Always on
            </Badge>
          )}
        </p>
        <p id={lineId} className='text-muted-foreground text-xs text-pretty'>
          {category.line}
        </p>
      </div>
      <span
        className={cn(
          'mt-0.5 inline-flex rounded-full transition-[scale] duration-150 ease-(--ease-out-strong)',
          pressedQuietOf(isPressed)
        )}
      >
        <Switch
          checked={isOn}
          disabled={isLocked}
          onCheckedChange={onSwitch}
          aria-labelledby={nameId}
          aria-describedby={lineId}
        />
      </span>
    </li>
  );
}

type PreferencesDialogProps = {
  isOpen: boolean;
  draft: ConsentDraft;
  pressed: string | null;
  onSwitch: (id: OptionalCategoryId, isOn: boolean) => void;
  onAcceptAll: () => void;
  onRejectAll: () => void;
  onSave: () => void;
  onClose: () => void;
};

/**
 * Drawn inside the block, so it never covers anything but the page it belongs to. While it is open
 * the page under it is inert, so the keyboard stays in the dialog until it closes.
 */
export function PreferencesDialog({
  isOpen,
  draft,
  pressed,
  onSwitch,
  onAcceptAll,
  onRejectAll,
  onSave,
  onClose,
}: PreferencesDialogProps) {
  const titleId = useId();
  const lineId = useId();

  function closeOnEscape(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'Escape') {
      return;
    }
    event.preventDefault();
    onClose();
  }

  return (
    <div
      inert={!isOpen}
      onKeyDown={closeOnEscape}
      className={cn('absolute inset-0 z-30', layerOf(isOpen))}
    >
      <button
        type='button'
        tabIndex={-1}
        aria-label='Close cookie preferences'
        onClick={onClose}
        className={cn(
          'absolute inset-0 cursor-default bg-black/40 backdrop-blur-xs transition-opacity duration-200',
          backdropOf(isOpen)
        )}
      />
      <div
        role='dialog'
        aria-modal='true'
        aria-labelledby={titleId}
        aria-describedby={lineId}
        className={cn(
          'bg-card text-card-foreground hairline-ring ring-border absolute top-1/2 left-1/2 flex max-h-[calc(100%-2rem)] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col gap-4 overflow-x-hidden overflow-y-auto rounded-2xl p-5 shadow-xl shadow-black/8 transition-[opacity,scale] duration-200 ease-(--ease-out-strong) @md:p-6',
          panelOf(isOpen)
        )}
      >
        <div className='flex flex-col gap-1.5 pe-8'>
          <h2
            id={titleId}
            data-dialog-title
            tabIndex={-1}
            className='text-lg leading-tight font-semibold outline-none'
          >
            Cookie preferences
          </h2>
          <p
            id={lineId}
            className='text-muted-foreground text-[13px] text-pretty'
          >
            {`Choose what ${SITE_NAME} may keep on this device. You can change it any time from Cookie settings at the foot of the page.`}
          </p>
        </div>
        <ul className='hairline-divide-y divide-border flex flex-col'>
          <CategoryRow category={NECESSARY} isOn isLocked isPressed={false} />
          {OPTIONAL_CATEGORIES.map((category) => (
            <CategoryRow
              key={category.id}
              category={category}
              isOn={draft[category.id]}
              isLocked={false}
              isPressed={pressed === `switch-${category.id}`}
              onSwitch={(isOn) => onSwitch(category.id, isOn)}
            />
          ))}
        </ul>
        <div className='flex flex-wrap items-center justify-end gap-2'>
          <Button
            type='button'
            variant='outline'
            onClick={onRejectAll}
            className={pressedQuietOf(pressed === 'reject-in-dialog')}
          >
            Reject all
          </Button>
          <Button type='button' variant='outline' onClick={onAcceptAll}>
            Accept all
          </Button>
          <Button
            type='button'
            onClick={onSave}
            className={pressedSolidOf(pressed === 'save')}
          >
            Save choices
          </Button>
        </div>
        <Button
          type='button'
          variant='ghost'
          size='icon-sm'
          aria-label='Close'
          onClick={onClose}
          className='text-muted-foreground absolute top-3 right-3'
        >
          <XIcon />
        </Button>
      </div>
    </div>
  );
}
