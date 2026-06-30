'use client';

import { Menu as MenuPrimitive } from '@base-ui/react/menu';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useEffect, useState, type ReactNode } from 'react';

import { installCommandOf } from '@/lib/site';
import {
  CheckIcon,
  ChevronDownIcon,
  CopyIcon,
  ExternalLinkIcon,
  SourceCodeIcon,
} from '@/registry/ndeko/lib/icons';
import { MENU_ITEM, MENU_SEPARATOR } from '@/registry/ndeko/lib/recipes';
import { Button } from '@/registry/ndeko/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/registry/ndeko/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/registry/ndeko/ui/tooltip';

import {
  chatGptLinkOf,
  claudeLinkOf,
  cursorLinkOf,
  lovableLinkOf,
  promptOf,
  v0LinkOf,
} from './open-in-links';
import {
  ChatGptMark,
  ClaudeMark,
  CursorMark,
  LovableMark,
  V0Mark,
} from './tool-marks';
import { ToolRoller } from './tool-roller';

type OpenInMenuProps = {
  title: string;
  itemName: string;
};

type CopiedValue = 'prompt' | 'command' | null;

const COPIED_FOR_MS = 1600;

const SWAP_IN = { opacity: 1, scale: 1, filter: 'blur(0px)' };
const SWAP_OUT = { opacity: 0, scale: 0.6, filter: 'blur(2px)' };
const FADE_IN = { opacity: 1 };
const FADE_OUT = { opacity: 0 };
const SWAP_TIMING = { duration: 0.15, ease: [0.23, 1, 0.32, 1] } as const;

function swapStatesOf(prefersReducedMotion: boolean | null) {
  if (prefersReducedMotion) {
    return { shown: FADE_IN, hidden: FADE_OUT };
  }
  return { shown: SWAP_IN, hidden: SWAP_OUT };
}

type OpenLinkProps = {
  href: string;
  icon: ReactNode;
  hint?: string;
  children: ReactNode;
};

function OpenLink({ href, icon, hint, children }: OpenLinkProps) {
  return (
    <MenuPrimitive.LinkItem
      className={MENU_ITEM}
      render={<a href={href} target='_blank' rel='noreferrer' />}
    >
      {icon}
      <span className='flex flex-1 flex-col'>
        <span>{children}</span>
        {hint && <span className='text-muted-foreground text-xs'>{hint}</span>}
      </span>
      <ExternalLinkIcon className='text-muted-foreground/70 size-3.5' />
    </MenuPrimitive.LinkItem>
  );
}

type CopyItemProps = {
  isCopied: boolean;
  label: string;
  copiedLabel: string;
  hint?: string;
  icon: ReactNode;
  onCopy: () => void;
};

function CopyItem({
  isCopied,
  label,
  copiedLabel,
  hint,
  icon,
  onCopy,
}: CopyItemProps) {
  const prefersReducedMotion = useReducedMotion();
  const swap = swapStatesOf(prefersReducedMotion);
  const stateKey = String(isCopied);

  function labelOf(copied: boolean) {
    if (copied) {
      return copiedLabel;
    }
    return label;
  }

  function iconOf(copied: boolean) {
    if (copied) {
      return <CheckIcon className='text-success-foreground' />;
    }
    return icon;
  }

  return (
    <MenuPrimitive.Item
      closeOnClick={false}
      onClick={onCopy}
      className={MENU_ITEM}
    >
      <span className='relative flex size-4 items-center justify-center'>
        <AnimatePresence mode='popLayout' initial={false}>
          <motion.span
            key={stateKey}
            className='flex'
            initial={swap.hidden}
            animate={swap.shown}
            exit={swap.hidden}
            transition={SWAP_TIMING}
          >
            {iconOf(isCopied)}
          </motion.span>
        </AnimatePresence>
      </span>
      <span className='flex flex-1 flex-col'>
        <span aria-live='polite'>{labelOf(isCopied)}</span>
        {hint && <span className='text-muted-foreground text-xs'>{hint}</span>}
      </span>
    </MenuPrimitive.Item>
  );
}

/** Opens an item in an AI app builder, or copies what any other builder needs to install it. */
export function OpenInMenu({ title, itemName }: OpenInMenuProps) {
  const [copied, setCopied] = useState<CopiedValue>(null);
  const prompt = promptOf(title, itemName);
  const installCommand = installCommandOf(itemName);
  const isPromptCopied = copied === 'prompt';
  const isCommandCopied = copied === 'command';

  useEffect(() => {
    if (copied === null) {
      return;
    }
    const timeout = window.setTimeout(() => setCopied(null), COPIED_FOR_MS);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  async function copy(value: string, which: Exclude<CopiedValue, null>) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(which);
    } catch {
      setCopied(null);
    }
  }

  function copyPrompt() {
    copy(prompt, 'prompt');
  }

  function copyCommand() {
    copy(installCommand, 'command');
  }

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger
          render={
            <DropdownMenuTrigger
              render={
                <Button
                  variant='outline'
                  size='sm'
                  className='gap-1 px-2.5'
                  aria-label={`Open ${title} in v0 or another app builder`}
                />
              }
            />
          }
        >
          <ToolRoller />
          <ChevronDownIcon className='text-muted-foreground size-3.5' />
        </TooltipTrigger>
        <TooltipContent>
          Open in v0, Lovable, Cursor, Claude or ChatGPT
        </TooltipContent>
      </Tooltip>
      <DropdownMenuContent align='end' className='w-64'>
        <OpenLink href={v0LinkOf(itemName)} icon={<V0Mark />}>
          Open in v0
        </OpenLink>
        <OpenLink href={lovableLinkOf(prompt)} icon={<LovableMark />}>
          Open in Lovable
        </OpenLink>
        <OpenLink href={cursorLinkOf(prompt)} icon={<CursorMark />}>
          Open in Cursor
        </OpenLink>
        <OpenLink
          href={claudeLinkOf(prompt)}
          icon={<ClaudeMark />}
          hint='Claude asks you to confirm prompts that come from a link'
        >
          Ask Claude
        </OpenLink>
        <OpenLink href={chatGptLinkOf(prompt)} icon={<ChatGptMark />}>
          Ask ChatGPT
        </OpenLink>
        <div role='separator' className={MENU_SEPARATOR} />
        <CopyItem
          isCopied={isPromptCopied}
          label='Copy the prompt'
          copiedLabel='Prompt copied'
          hint='For Bolt, Replit, Windsurf and others'
          icon={<CopyIcon className='text-muted-foreground' />}
          onCopy={copyPrompt}
        />
        <CopyItem
          isCopied={isCommandCopied}
          label='Copy the install command'
          copiedLabel='Command copied'
          icon={<SourceCodeIcon className='text-muted-foreground' />}
          onCopy={copyCommand}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
