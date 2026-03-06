// Adapted from prompt-kit (MIT, Copyright (c) 2025 Julien Thibeaut).
'use client';

import { useEffect, useRef, useState } from 'react';
import { bundledLanguages, codeToHtml, type BundledTheme } from 'shiki';

import { CheckIcon, CopyIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import { Swap } from '@/registry/ndeko/ui/chat-motion';

type CodeThemes = {
  light: BundledTheme;
  dark: BundledTheme;
};

const DEFAULT_THEMES: CodeThemes = {
  light: 'github-light',
  dark: 'github-dark',
};

const PLAIN_LANGUAGE = 'text';

const COPIED_FOR_MS = 1600;

type CodeBlockProps = React.ComponentProps<'div'>;

function CodeBlock({ className, ...props }: CodeBlockProps) {
  return (
    <div
      data-slot='code-block'
      className={cn(
        'not-prose bg-card text-card-foreground hairline-ring ring-border flex w-full flex-col overflow-clip rounded-xl shadow-[0_1px_2px_rgb(0_0_0/0.04)]',
        className
      )}
      {...props}
    />
  );
}

function isBundledLanguage(language: string) {
  return language in bundledLanguages;
}

function highlightableLanguageOf(language: string) {
  if (isBundledLanguage(language)) {
    return language;
  }
  return PLAIN_LANGUAGE;
}

function highlightCode(code: string, language: string, themes: CodeThemes) {
  const lang = highlightableLanguageOf(language);
  return codeToHtml(code, { lang, themes, defaultColor: false });
}

function keepPlainCode() {
  return null;
}

/** Shiki writes both themes as CSS variables on every token; the `dark` class picks which one paints. */
const CODE_AREA = [
  'w-full overflow-x-auto font-mono text-[13px] leading-relaxed',
  '[&_pre]:min-w-max [&_pre]:bg-transparent [&_pre]:px-4 [&_pre]:py-3 [&_pre]:outline-none',
  '[&_.shiki]:text-(--shiki-light) [&_.shiki_span]:text-(--shiki-light)',
  'dark:[&_.shiki]:text-(--shiki-dark) dark:[&_.shiki_span]:text-(--shiki-dark)',
].join(' ');

type CodeBlockCodeProps = Omit<
  React.ComponentProps<'div'>,
  'children' | 'dangerouslySetInnerHTML'
> & {
  code: string;
  language?: string;
  themes?: CodeThemes;
};

function CodeBlockCode({
  code,
  language = 'tsx',
  themes = DEFAULT_THEMES,
  className,
  ...props
}: CodeBlockCodeProps) {
  const [highlightedHtml, setHighlightedHtml] = useState<string | null>(null);
  const lightTheme = themes.light;
  const darkTheme = themes.dark;
  const areaClassName = cn(CODE_AREA, className);

  useEffect(() => {
    let isCurrent = true;
    const pair = { light: lightTheme, dark: darkTheme };

    function applyHighlight(html: string) {
      if (isCurrent) {
        setHighlightedHtml(html);
      }
    }

    highlightCode(code, language, pair)
      .then(applyHighlight)
      .catch(keepPlainCode);

    return () => {
      isCurrent = false;
    };
  }, [code, language, lightTheme, darkTheme]);

  if (!highlightedHtml) {
    return (
      <div data-slot='code-block-code' className={areaClassName} {...props}>
        <pre>
          <code>{code}</code>
        </pre>
      </div>
    );
  }

  return (
    <div
      data-slot='code-block-code'
      className={areaClassName}
      dangerouslySetInnerHTML={{ __html: highlightedHtml }}
      {...props}
    />
  );
}

type CodeBlockGroupProps = React.ComponentProps<'div'>;

function CodeBlockGroup({ className, ...props }: CodeBlockGroupProps) {
  return (
    <div
      data-slot='code-block-group'
      className={cn(
        'flex items-center justify-between gap-2 py-1.5 ps-4 pe-1.5',
        className
      )}
      {...props}
    />
  );
}

function CodeBlockLanguage({
  className,
  ...props
}: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot='code-block-language'
      className={cn('text-muted-foreground font-mono text-xs', className)}
      {...props}
    />
  );
}

function useCopiedFlag() {
  const [isCopied, setIsCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
    };
  }, []);

  function flagCopied() {
    if (timer.current) {
      clearTimeout(timer.current);
    }
    setIsCopied(true);
    timer.current = setTimeout(() => setIsCopied(false), COPIED_FOR_MS);
  }

  return { isCopied, flagCopied };
}

function copyLabelOf(isCopied: boolean) {
  if (isCopied) {
    return 'Copied';
  }
  return 'Copy code';
}

type CodeBlockCopyButtonProps = Omit<
  React.ComponentProps<typeof Button>,
  'children' | 'onClick'
> & {
  code: string;
  onCopyError?: (error: unknown) => void;
};

function CodeBlockCopyButton({
  code,
  onCopyError,
  className,
  ...props
}: CodeBlockCopyButtonProps) {
  const { isCopied, flagCopied } = useCopiedFlag();
  const label = copyLabelOf(isCopied);
  const iconKey = String(isCopied);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
    } catch (error) {
      onCopyError?.(error);
      return;
    }
    flagCopied();
  }

  return (
    <Button
      type='button'
      variant='ghost'
      size='icon-sm'
      aria-label={label}
      onClick={copy}
      className={cn('text-muted-foreground', className)}
      {...props}
    >
      <Swap swapKey={iconKey}>
        {isCopied && <CheckIcon className='size-3.5' />}
        {!isCopied && <CopyIcon className='size-3.5' />}
      </Swap>
    </Button>
  );
}

export {
  CodeBlock,
  CodeBlockCode,
  CodeBlockCopyButton,
  CodeBlockGroup,
  CodeBlockLanguage,
  type CodeThemes,
};
