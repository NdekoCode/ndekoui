'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';

import {
  CheckIcon,
  CopyIcon,
  FileTextIcon,
  SlidersIcon,
  TerminalIcon,
} from '@/registry/ndeko/lib/icons';
import { FADE } from '@/registry/ndeko/lib/motion-presets';
import { cn } from '@/registry/ndeko/lib/utils';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Button } from '@/registry/ndeko/ui/button';
import { Swap } from '@/registry/ndeko/ui/chat-motion';
import { jsonTokensOf } from '@/registry/ndeko/ui/json-view';

import type { EditorId, Snippet, SnippetLanguage } from './data';

const NO_LINES: string[] = [];

const FADE_IN = { opacity: 1 };

const FADE_OUT = { opacity: 0 };

const TOKEN_CLASS: Record<string, string> = {
  key: 'text-foreground',
  string: 'text-primary-ink',
  number: 'text-muted-foreground',
  literal: 'text-muted-foreground',
  mark: 'text-muted-foreground/60',
  space: '',
};

type Shown = {
  key: string;
  editorId: EditorId;
  lines: string[];
  /** The lines the last change of an option brought in. */
  fresh: string[];
};

/** A line is fresh when an option changed it; a new editor brings a whole new config and none is. */
function freshLinesOf(
  isSameEditor: boolean,
  before: string[],
  after: string[]
) {
  if (!isSameEditor) {
    return NO_LINES;
  }
  return after.filter((line) => !before.includes(line));
}

/** A changed line lights once, then settles back into the block. */
function freshClassOf(isFresh: boolean) {
  if (isFresh) {
    return 'transition-colors duration-1000 ease-out starting:bg-primary/25';
  }
  return undefined;
}

function pressedQuietOf(isPressed: boolean) {
  if (isPressed) {
    return 'scale-[0.94] bg-foreground/[0.07] text-foreground';
  }
  return undefined;
}

function copyWordOf(isCopied: boolean, copyLabel: string) {
  if (isCopied) {
    return 'Copied';
  }
  return copyLabel;
}

function LabelGlyph({ language }: { language: SnippetLanguage }) {
  if (language === 'bash') {
    return <TerminalIcon className='size-3.5 shrink-0' />;
  }
  if (language === 'fields') {
    return <SlidersIcon className='size-3.5 shrink-0' />;
  }
  return <FileTextIcon className='size-3.5 shrink-0' />;
}

type CodeLineProps = {
  line: string;
  language: SnippetLanguage;
};

function CodeLine({ line, language }: CodeLineProps) {
  if (language !== 'json') {
    return <>{line}</>;
  }
  const tokens = jsonTokensOf(line);

  return (
    <>
      {tokens.map((token, index) => (
        <span key={index} className={TOKEN_CLASS[token.kind]}>
          {token.text}
        </span>
      ))}
    </>
  );
}

export type ConfigBlockProps = {
  editorId: EditorId;
  /** Changes with the editor and with each option, so the block knows a new config arrived. */
  configKey: string;
  snippet: Snippet;
  isCopied: boolean;
  isCopyPressed: boolean;
  onCopy: () => void;
};

export function ConfigBlock({
  editorId,
  configKey,
  snippet,
  isCopied,
  isCopyPressed,
  onCopy,
}: ConfigBlockProps) {
  const [shown, setShown] = useState<Shown>(() => ({
    key: configKey,
    editorId,
    lines: snippet.lines,
    fresh: NO_LINES,
  }));
  if (shown.key !== configKey) {
    const isSameEditor = shown.editorId === editorId;
    const fresh = freshLinesOf(isSameEditor, shown.lines, snippet.lines);
    setShown({ key: configKey, editorId, lines: snippet.lines, fresh });
  }
  const copyWord = copyWordOf(isCopied, snippet.copyLabel);

  return (
    <div className='bg-foreground/[0.03] dark:bg-foreground/[0.05] flex flex-col rounded-lg'>
      <div className='flex h-10 items-center gap-2 ps-3 pe-1.5'>
        <span className='text-muted-foreground flex min-w-0 flex-1 items-center gap-2 text-xs'>
          <Swap swapKey={snippet.language}>
            <LabelGlyph language={snippet.language} />
          </Swap>
          <span className='min-w-0 truncate font-mono'>
            <Swap swapKey={snippet.label}>{snippet.label}</Swap>
          </span>
        </span>
        <Button
          type='button'
          variant='ghost'
          size='sm'
          onClick={onCopy}
          className={cn('text-muted-foreground', pressedQuietOf(isCopyPressed))}
        >
          <Swap swapKey={String(isCopied)}>
            {isCopied && <CheckIcon className='text-success-foreground' />}
            {!isCopied && <CopyIcon />}
          </Swap>
          <Swap swapKey={copyWord}>{copyWord}</Swap>
        </Button>
      </div>
      <AnimatedSize className='m-0' contentClassName='relative p-0'>
        <AnimatePresence mode='popLayout' initial={false}>
          <motion.pre
            key={editorId}
            initial={FADE_OUT}
            animate={FADE_IN}
            exit={FADE_OUT}
            transition={FADE}
            className='overflow-x-auto px-3 pb-3 font-mono text-xs leading-6'
          >
            <code className='flex min-w-max flex-col'>
              {snippet.lines.map((line, index) => (
                <span
                  key={`${index}:${line}`}
                  className={cn(
                    '-mx-1.5 rounded-sm px-1.5 whitespace-pre',
                    freshClassOf(shown.fresh.includes(line))
                  )}
                >
                  <CodeLine line={line} language={snippet.language} />
                </span>
              ))}
            </code>
          </motion.pre>
        </AnimatePresence>
      </AnimatedSize>
    </div>
  );
}
