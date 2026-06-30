'use client';

import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Transition,
} from 'motion/react';
import { useState } from 'react';

import { CopyButton } from '@/app/_site/copy-button';
import { REGISTRY_URL } from '@/lib/site';
import { ChevronDownIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuGroupLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/registry/ndeko/ui/dropdown-menu';

import {
  PACKAGE_MANAGERS,
  SHADCN_ADD,
  choosePackageManager,
  installCommandFor,
  isPackageManager,
  runnerOf,
  usePackageManager,
  type PackageManager,
} from './package-manager';
import { useElementWidth } from './use-element-width';

const REGISTRY_BASE = `${REGISTRY_URL}/`;

const SHOWN = {
  opacity: 1,
  transform: 'translateY(0px)',
  filter: 'blur(0px)',
};
const FROM_BELOW = {
  opacity: 0,
  transform: 'translateY(6px)',
  filter: 'blur(4px)',
};
const TO_ABOVE = {
  opacity: 0,
  transform: 'translateY(-6px)',
  filter: 'blur(4px)',
};
const FADED = { opacity: 0 };

const ENTER_TIMING: Transition = { duration: 0.18, ease: [0.23, 1, 0.32, 1] };
const EXIT_TIMING: Transition = { duration: 0.12, ease: [0.23, 1, 0.32, 1] };
const INSTANT: Transition = { duration: 0 };
const WIDTH_SPRING: Transition = { type: 'spring', bounce: 0, duration: 0.3 };

type Roll = {
  enter: typeof SHOWN | typeof FADED;
  leave: typeof SHOWN | typeof FADED;
  enterTiming: Transition;
  exitTiming: Transition;
  widthTiming: Transition;
};

const STILL_ROLL: Roll = {
  enter: SHOWN,
  leave: FADED,
  enterTiming: INSTANT,
  exitTiming: INSTANT,
  widthTiming: INSTANT,
};

const FADE_ROLL: Roll = {
  enter: FADED,
  leave: FADED,
  enterTiming: ENTER_TIMING,
  exitTiming: EXIT_TIMING,
  widthTiming: INSTANT,
};

const MOVING_ROLL: Roll = {
  enter: FROM_BELOW,
  leave: TO_ABOVE,
  enterTiming: ENTER_TIMING,
  exitTiming: EXIT_TIMING,
  widthTiming: WIDTH_SPRING,
};

/**
 * Only the trigger the person used rolls. Another card following the choice, or the stored
 * choice replacing the server default right after hydration, changes in place.
 */
function rollOf(isAnswering: boolean, prefersReducedMotion: boolean | null) {
  if (!isAnswering) {
    return STILL_ROLL;
  }
  if (prefersReducedMotion) {
    return FADE_ROLL;
  }
  return MOVING_ROLL;
}

function widthTargetOf(width: number | null) {
  if (width === null) {
    return { width: 'auto' };
  }
  return { width };
}

type RunnerLabelProps = {
  runner: string;
  isAnswering: boolean;
};

/** The runner rolls to its new words and the label eases to their width, so the rest of the command slides instead of jumping. */
function RunnerLabel({ runner, isAnswering }: RunnerLabelProps) {
  const prefersReducedMotion = useReducedMotion();
  const [content, setContent] = useState<HTMLSpanElement | null>(null);
  const contentWidth = useElementWidth(content);
  const roll = rollOf(isAnswering, prefersReducedMotion);
  const exit = { ...roll.leave, transition: roll.exitTiming };

  return (
    <motion.span
      className='inline-block overflow-x-clip'
      initial={false}
      animate={widthTargetOf(contentWidth)}
      transition={roll.widthTiming}
    >
      <span ref={setContent} className='relative block w-max'>
        <AnimatePresence mode='popLayout' initial={false}>
          <motion.span
            key={runner}
            className='block'
            initial={roll.enter}
            animate={SHOWN}
            exit={exit}
            transition={roll.enterTiming}
          >
            {runner}
          </motion.span>
        </AnimatePresence>
      </span>
    </motion.span>
  );
}

function PackageManagerMenu({ manager }: { manager: PackageManager }) {
  const [chosenHere, setChosenHere] = useState<PackageManager | null>(null);
  const runner = runnerOf(manager);
  const isAnswering = chosenHere === manager;

  function changePackageManager(value: unknown) {
    if (!isPackageManager(value)) {
      return;
    }
    setChosenHere(value);
    choosePackageManager(value);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant='ghost'
            size='sm'
            aria-label={`Package manager, ${runner}`}
            className='gap-1 px-2 font-mono'
          />
        }
      >
        <RunnerLabel runner={runner} isAnswering={isAnswering} />
        <ChevronDownIcon className='text-muted-foreground size-3.5' />
      </DropdownMenuTrigger>
      <DropdownMenuContent className='min-w-44'>
        <DropdownMenuGroup>
          <DropdownMenuGroupLabel>Package manager</DropdownMenuGroupLabel>
          <DropdownMenuRadioGroup
            value={manager}
            onValueChange={changePackageManager}
          >
            {PACKAGE_MANAGERS.map((option) => (
              <DropdownMenuRadioItem
                key={option.id}
                value={option.id}
                closeOnClick
              >
                <span className='flex-1'>{option.id}</span>
                <span className='text-muted-foreground font-mono text-xs'>
                  {option.runner}
                </span>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

type InstallCommandProps = {
  itemName: string;
  className?: string;
};

/**
 * The command shows what the copy button copies. When room runs out, the registry address
 * gives way first and the item's file name stays readable.
 */
export function InstallCommand({ itemName, className }: InstallCommandProps) {
  const manager = usePackageManager();
  const command = installCommandFor(manager, itemName);
  const fileName = `${itemName}.json`;

  return (
    <div
      className={cn(
        'bg-foreground/[0.04] flex min-w-0 items-center rounded-lg p-0.5',
        className
      )}
    >
      <PackageManagerMenu manager={manager} />
      <code className='text-muted-foreground flex min-w-0 items-center pe-1 font-mono text-xs whitespace-nowrap'>
        <span className='me-[1ch] min-w-0 truncate'>{SHADCN_ADD}</span>
        <span className='min-w-0 shrink-[100] truncate'>{REGISTRY_BASE}</span>
        <span className='text-foreground shrink-0'>{fileName}</span>
      </code>
      <CopyButton value={command} label='Copy install command' />
    </div>
  );
}
