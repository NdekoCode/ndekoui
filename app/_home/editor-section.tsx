'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import Link from 'next/link';
import { useState, type ComponentType } from 'react';

import { CopyButton } from '@/app/_site/copy-button';
import { ClaudeCodeMark } from '@/app/mcp/_components/client-marks';
import {
  MCP_PAGE_PATH,
  MCP_URL,
  SERVER_NAME,
} from '@/app/mcp/_shared/mcp-config';
import { TOOLS, type ToolName } from '@/app/mcp/_shared/tool-catalogue';
import {
  ArrowRightIcon,
  CodeIcon,
  DownloadIcon,
  SearchIcon,
  SwatchBookIcon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';

import { Reveal } from './reveal';
import { ROW_TITLE, STAGGER_MS } from './section-heading';

type Capability = {
  title: string;
  detail: string;
  icon: ComponentType<{ className?: string }>;
};

const CAPABILITIES: Capability[] = [
  {
    title: 'Search',
    detail: 'by name, category or what the screen needs',
    icon: SearchIcon,
  },
  {
    title: 'Fetch',
    detail: 'the full source, with every file it uses',
    icon: CodeIcon,
  },
  {
    title: 'Install',
    detail: 'with the exact shadcn command',
    icon: DownloadIcon,
  },
  {
    title: 'Follow the rules',
    detail: 'the theme tokens and the design guidelines',
    icon: SwatchBookIcon,
  },
];

const CLAUDE_CODE_COMMAND = `claude mcp add --transport http ${SERVER_NAME} ${MCP_URL}`;

const DETAIL_SWAP = {
  initial: { opacity: 0, height: 0 },
  animate: { opacity: 1, height: 'auto' },
  exit: { opacity: 0, height: 0 },
};

const DETAIL_TIMING = { duration: 0.24, ease: [0.23, 1, 0.32, 1] } as const;

const NO_MOTION = { duration: 0 } as const;

function detailTimingOf(prefersReducedMotion: boolean | null) {
  if (prefersReducedMotion) {
    return NO_MOTION;
  }
  return DETAIL_TIMING;
}

function CapabilityList() {
  return (
    <ul className='flex flex-col gap-3'>
      {CAPABILITIES.map((capability, index) => (
        <Reveal
          as='li'
          key={capability.title}
          delay={index * STAGGER_MS}
          className='bg-card hairline-ring ring-border flex items-center gap-4 rounded-2xl p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'
        >
          <span className='bg-primary text-primary-foreground flex size-10 shrink-0 items-center justify-center rounded-full shadow-[inset_0_1px_0_rgb(255_255_255/0.25)]'>
            <capability.icon className='size-[1.125rem]' />
          </span>
          <span className='flex flex-col'>
            <span className={ROW_TITLE}>{capability.title}</span>
            <span className='text-muted-foreground text-sm'>
              {capability.detail}
            </span>
          </span>
        </Reveal>
      ))}
    </ul>
  );
}

function TerminalCard() {
  return (
    <div className='bg-card hairline-ring ring-border flex flex-col gap-3 rounded-2xl p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
      <div className='flex items-center gap-2.5'>
        <span className='bg-foreground/[0.06] flex size-8 items-center justify-center rounded-lg'>
          <ClaudeCodeMark className='size-4' />
        </span>
        <span className='flex flex-col'>
          <span className='text-sm font-semibold'>Claude Code</span>
          <span className='text-muted-foreground text-xs'>
            Run it once in your project folder
          </span>
        </span>
      </div>
      <div className='bg-foreground/[0.04] flex items-center gap-2 rounded-xl py-2 ps-3 pe-1.5'>
        <code className='min-w-0 flex-1 [scrollbar-width:none] overflow-x-auto font-mono text-xs whitespace-nowrap'>
          {CLAUDE_CODE_COMMAND}
        </code>
        <CopyButton value={CLAUDE_CODE_COMMAND} label='Copy the command' />
      </div>
    </div>
  );
}

function ToolList() {
  const [activeName, setActiveName] = useState<ToolName>(TOOLS[0].name);
  const prefersReducedMotion = useReducedMotion();
  const timing = detailTimingOf(prefersReducedMotion);

  return (
    <ul className='bg-card hairline-ring ring-border flex flex-col gap-0.5 rounded-2xl p-1.5 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
      {TOOLS.map((tool) => {
        const isActive = tool.name === activeName;

        function pick() {
          setActiveName(tool.name);
        }

        return (
          <li key={tool.name}>
            <button
              type='button'
              aria-expanded={isActive}
              onClick={pick}
              className={cn(
                'focus-visible:ring-ring/25 flex w-full flex-col rounded-xl px-3 py-2.5 text-left transition-colors outline-none focus-visible:ring-[3px]',
                isActive && 'bg-foreground/[0.04]',
                !isActive && 'hover:bg-foreground/[0.025]'
              )}
            >
              <span className='flex items-center justify-between gap-3'>
                <span className='text-sm font-medium'>{tool.title}</span>
                <code className='text-muted-foreground font-mono text-xs'>
                  {tool.name}
                </code>
              </span>
              <AnimatePresence initial={false}>
                {isActive && (
                  <motion.span
                    initial={DETAIL_SWAP.initial}
                    animate={DETAIL_SWAP.animate}
                    exit={DETAIL_SWAP.exit}
                    transition={timing}
                    className='text-muted-foreground block overflow-hidden text-[13px] text-pretty'
                  >
                    <span className='block pt-1.5'>{tool.summary}</span>
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/** What an editor can do once it is connected, with the command that connects it. */
export function EditorSection() {
  return (
    <div className='grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-10'>
      <div className='flex flex-col gap-6'>
        <CapabilityList />
        <Reveal delay={CAPABILITIES.length * STAGGER_MS}>
          <Button
            variant='outline'
            nativeButton={false}
            className='w-fit rounded-full'
            render={<Link href={MCP_PAGE_PATH} />}
          >
            Connect your editor
            <ArrowRightIcon />
          </Button>
        </Reveal>
      </div>
      <Reveal className='flex min-w-0 flex-col gap-4' delay={STAGGER_MS * 2}>
        <TerminalCard />
        <ToolList />
      </Reveal>
    </div>
  );
}
