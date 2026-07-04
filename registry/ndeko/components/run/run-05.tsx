'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useId, useState } from 'react';

import { formatTokens } from '@/registry/ndeko/lib/agent-run';
import { ChevronDownIcon, FileIcon, XIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Fold } from '@/registry/ndeko/ui/chat-motion';

import { CompactOffer, contextAnnouncementOf } from './_parts/compact-offer';
import {
  freeTokensOf,
  LEVEL_WORD,
  levelOf,
  PART_FILL,
  percentOf,
  RESERVE_STYLE,
  usedTokensOf,
  type Compaction,
  type ContextBudget,
  type ContextItem,
  type ContextPart,
} from './_parts/context';
import { ContextHeader } from './_parts/context-header';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import {
  FADE,
  rowPresenceOf,
  springOf,
} from '@/registry/ndeko/lib/motion-presets';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';
import { TokenCount } from './_parts/token-count';
import {
  useContextControls,
  useContextRun,
  type CompactStatus,
} from './_parts/use-context-demo';

function chevronTurnOf(isOpen: boolean) {
  if (isOpen) {
    return 'rotate-180';
  }
  return 'rotate-0';
}

function segmentStyleOf(
  part: ContextPart,
  budget: ContextBudget
): React.CSSProperties {
  const width = percentOf(part.tokens, budget);
  return { width: `${width}%`, backgroundColor: PART_FILL[part.id] };
}

function spokenUsageOf(budget: ContextBudget) {
  const used = usedTokensOf(budget);
  const level = levelOf(budget);
  const usedText = formatTokens(used);
  const limitText = formatTokens(budget.limit);
  return `${usedText} of ${limitText} tokens used, ${LEVEL_WORD[level]}`;
}

function filledParts(budget: ContextBudget) {
  return budget.parts.filter((part) => part.tokens > 0);
}

function PartDot({ fill }: { fill: string }) {
  return (
    <span
      aria-hidden='true'
      className='size-2 shrink-0 rounded-full'
      style={{ backgroundColor: fill }}
    />
  );
}

function SegmentBar({ budget }: { budget: ContextBudget }) {
  const shouldReduceMotion = useReducedMotion();
  const spring = springOf(shouldReduceMotion);
  const used = usedTokensOf(budget);
  const reservePercent = percentOf(budget.reserve, budget);
  const spoken = spokenUsageOf(budget);
  const parts = filledParts(budget);

  return (
    <div
      role='meter'
      aria-label='Context used'
      aria-valuemin={0}
      aria-valuemax={budget.limit}
      aria-valuenow={used}
      aria-valuetext={spoken}
      className='flex h-3 gap-0.5 overflow-hidden rounded-full'
    >
      <AnimatePresence initial={false}>
        {parts.map((part) => (
          <motion.span
            key={part.id}
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ layout: spring, opacity: FADE }}
            className='h-full shrink rounded-[3px] first:rounded-s-full'
            style={segmentStyleOf(part, budget)}
          />
        ))}
      </AnimatePresence>
      <motion.span
        layout
        transition={{ layout: spring }}
        className='bg-foreground/[0.05] h-full min-w-0 flex-1 rounded-[3px]'
      />
      <motion.span
        layout
        transition={{ layout: spring }}
        className='h-full shrink-0 rounded-s-[3px] rounded-e-full'
        style={{ ...RESERVE_STYLE, width: `${reservePercent}%` }}
      />
    </div>
  );
}

function PartRow({ part }: { part: ContextPart }) {
  return (
    <div className='flex h-8 items-center gap-2.5 px-2 text-[13px]'>
      <PartDot fill={PART_FILL[part.id]} />
      <span className='min-w-0 flex-1 truncate'>{part.label}</span>
      <TokenCount tokens={part.tokens} className='text-muted-foreground' />
    </div>
  );
}

function FileRow({
  file,
  onRemove,
}: {
  file: ContextItem;
  onRemove?: (itemId: string) => void;
}) {
  const canRemove = onRemove !== undefined;

  return (
    <div className='flex h-8 items-center gap-2.5 ps-6 pe-1 text-[13px]'>
      <FileIcon className='text-muted-foreground size-3.5 shrink-0' />
      <span className='min-w-0 flex-1 truncate font-mono text-xs'>
        {file.label}
      </span>
      <TokenCount tokens={file.tokens} className='text-muted-foreground' />
      {canRemove && (
        <button
          type='button'
          aria-label={`Remove ${file.label} from the context`}
          onClick={() => onRemove?.(file.id)}
          className='text-muted-foreground hover:text-foreground hover:bg-foreground/5 focus-visible:ring-ring/25 inline-flex size-6 cursor-pointer items-center justify-center rounded-md outline-none focus-visible:ring-[3px] active:scale-[0.97]'
        >
          <XIcon className='size-3.5' />
        </button>
      )}
    </div>
  );
}

function FilesRow({
  part,
  onRemove,
}: {
  part: ContextPart;
  onRemove?: (itemId: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const panelId = useId();
  const shouldReduceMotion = useReducedMotion();
  const rowPresence = rowPresenceOf(shouldReduceMotion);
  const hasFiles = part.items.length > 0;

  function toggle() {
    setIsOpen((current) => !current);
  }

  return (
    <div>
      <button
        type='button'
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={toggle}
        className='hover:bg-foreground/[0.03] focus-visible:ring-ring/25 flex h-8 w-full cursor-pointer items-center gap-2.5 rounded-md px-2 text-start text-[13px] outline-none focus-visible:ring-[3px]'
      >
        <PartDot fill={PART_FILL[part.id]} />
        <span className='min-w-0 flex-1 truncate'>
          {part.label}
          <span className='text-muted-foreground ms-1.5 tabular-nums'>
            {part.items.length}
          </span>
        </span>
        <TokenCount tokens={part.tokens} className='text-muted-foreground' />
        <ChevronDownIcon
          className={cn(
            'text-muted-foreground size-4 shrink-0 transition-transform duration-200 ease-(--ease-out-strong)',
            chevronTurnOf(isOpen)
          )}
        />
      </button>
      <Fold open={isOpen} id={panelId}>
        <ul aria-label='Files in the context'>
          <AnimatePresence initial={false}>
            {part.items.map((file) => (
              <motion.li
                key={file.id}
                className='overflow-hidden'
                {...rowPresence}
              >
                <FileRow file={file} onRemove={onRemove} />
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
        {!hasFiles && (
          <p className='text-muted-foreground ps-6 text-xs leading-8'>
            No file left in the context
          </p>
        )}
      </Fold>
    </div>
  );
}

function LegendRow({
  part,
  onRemoveItem,
}: {
  part: ContextPart;
  onRemoveItem?: (itemId: string) => void;
}) {
  if (part.id === 'files') {
    return <FilesRow part={part} onRemove={onRemoveItem} />;
  }
  return <PartRow part={part} />;
}

export type ContextWindowBarProps = {
  budget: ContextBudget;
  onRemoveItem?: (itemId: string) => void;
  onCompact?: () => void;
  compactStatus?: CompactStatus;
  canCompact?: boolean;
  compaction?: Compaction | null;
  className?: string;
};

export function ContextWindowBar({
  budget,
  onRemoveItem,
  onCompact,
  compactStatus = 'idle',
  canCompact = false,
  compaction = null,
  className,
}: ContextWindowBarProps) {
  const shouldReduceMotion = useReducedMotion();
  const rowPresence = rowPresenceOf(shouldReduceMotion);
  const free = freeTokensOf(budget);
  const titleId = useId();

  return (
    <section
      aria-labelledby={titleId}
      className={cn(
        'bg-card hairline-ring ring-border flex flex-col gap-4 rounded-xl p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)]',
        className
      )}
    >
      <ContextHeader budget={budget} titleId={titleId} />

      <SegmentBar budget={budget} />

      <ul aria-label='What fills the context' className='-mx-2 flex flex-col'>
        <AnimatePresence initial={false}>
          {budget.parts.map((part) => (
            <motion.li
              key={part.id}
              className='overflow-hidden'
              {...rowPresence}
            >
              <LegendRow part={part} onRemoveItem={onRemoveItem} />
            </motion.li>
          ))}
        </AnimatePresence>
        <li className='flex h-8 items-center gap-2.5 px-2 text-[13px]'>
          <span
            aria-hidden='true'
            className='bg-foreground/[0.08] size-2 shrink-0 rounded-full'
          />
          <span className='min-w-0 flex-1 truncate'>Free</span>
          <TokenCount tokens={free} className='text-muted-foreground' />
        </li>
        <li className='flex h-8 items-center gap-2.5 px-2 text-[13px]'>
          <span
            aria-hidden='true'
            className='size-2 shrink-0 rounded-full'
            style={RESERVE_STYLE}
          />
          <span className='min-w-0 flex-1 truncate'>Held for the answer</span>
          <TokenCount
            tokens={budget.reserve}
            className='text-muted-foreground'
          />
        </li>
      </ul>

      <CompactOffer
        budget={budget}
        canCompact={canCompact}
        compactStatus={compactStatus}
        compaction={compaction}
        onCompact={onCompact}
      />
    </section>
  );
}

export default function Run05() {
  const { ref, turns, restart, isFinished } = useContextRun();
  const controls = useContextControls(turns);
  const level = levelOf(controls.budget);
  const announcement = contextAnnouncementOf(
    level,
    LEVEL_WORD[level],
    controls.compaction
  );

  function replay() {
    controls.reset();
    restart();
  }

  return (
    <div ref={ref} className='flex w-full max-w-[26rem] flex-col gap-2'>
      <ContextWindowBar
        budget={controls.budget}
        onRemoveItem={controls.removeFile}
        onCompact={controls.compact}
        compactStatus={controls.compactStatus}
        canCompact={controls.canCompact}
        compaction={controls.compaction}
      />
      <div className='flex h-7 items-center justify-end'>
        <ReplayButton
          isShown={isFinished}
          onReplay={replay}
          label='Replay the conversation'
        />
      </div>
      <LiveRegion message={announcement} />
    </div>
  );
}
