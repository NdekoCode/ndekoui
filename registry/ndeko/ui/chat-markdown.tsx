// Adapted from prompt-kit (MIT, Copyright (c) 2025 Julien Thibeaut).
'use client';

import { marked } from 'marked';
import { isValidElement, memo, useId, useMemo } from 'react';
import ReactMarkdown, {
  type Components,
  type ExtraProps,
} from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';

import { cn } from '@/registry/ndeko/lib/utils';
import {
  CodeBlock,
  CodeBlockCode,
  CodeBlockCopyButton,
  CodeBlockGroup,
  CodeBlockLanguage,
} from '@/registry/ndeko/ui/chat-code-block';

const REMARK_PLUGINS = [remarkGfm, remarkBreaks];

const EXTERNAL_HREF = /^(https?:)?\/\//i;

const LANGUAGE_CLASS = /language-([\w+#-]+)/;

const TRAILING_NEWLINE = /\n$/;

const PLAIN_LANGUAGE = 'text';

const LINK =
  'text-primary-ink underline decoration-primary-ink/30 underline-offset-2 transition-colors hover:decoration-primary-ink focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/25';

function parseMarkdownIntoBlocks(markdown: string) {
  const tokens = marked.lexer(markdown);
  return tokens.map((token) => token.raw);
}

function isExternalHref(href: string | undefined) {
  if (!href) {
    return false;
  }
  return EXTERNAL_HREF.test(href);
}

function textOf(node: React.ReactNode): string {
  if (typeof node === 'string') {
    return node;
  }
  if (typeof node === 'number') {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(textOf).join('');
  }
  return '';
}

function languageOf(className: string | undefined) {
  if (!className) {
    return PLAIN_LANGUAGE;
  }
  const match = className.match(LANGUAGE_CLASS);
  if (!match) {
    return PLAIN_LANGUAGE;
  }
  return match[1];
}

type CodeElementProps = {
  className?: string;
  children?: React.ReactNode;
};

function fencedCodeOf(children: React.ReactNode) {
  if (!isValidElement<CodeElementProps>(children)) {
    return { code: textOf(children), language: PLAIN_LANGUAGE };
  }
  const rawCode = textOf(children.props.children);
  const code = rawCode.replace(TRAILING_NEWLINE, '');
  const language = languageOf(children.props.className);
  return { code, language };
}

type MarkdownPartProps<Tag extends keyof React.JSX.IntrinsicElements> =
  React.ComponentProps<Tag> & ExtraProps;

function MarkdownPre({ children }: MarkdownPartProps<'pre'>) {
  const { code, language } = fencedCodeOf(children);

  return (
    <CodeBlock className='my-1'>
      <CodeBlockGroup>
        <CodeBlockLanguage>{language}</CodeBlockLanguage>
        <CodeBlockCopyButton code={code} />
      </CodeBlockGroup>
      <CodeBlockCode code={code} language={language} />
    </CodeBlock>
  );
}

function MarkdownInlineCode({ children }: MarkdownPartProps<'code'>) {
  return (
    <code className='bg-foreground/[0.06] rounded-sm px-1 py-px font-mono text-[0.9em]'>
      {children}
    </code>
  );
}

function MarkdownLink({ href, title, children }: MarkdownPartProps<'a'>) {
  const isExternal = isExternalHref(href);

  if (isExternal) {
    return (
      <a
        href={href}
        title={title}
        target='_blank'
        rel='noreferrer'
        className={LINK}
      >
        {children}
      </a>
    );
  }

  return (
    <a href={href} title={title} className={LINK}>
      {children}
    </a>
  );
}

function MarkdownTable({ children }: MarkdownPartProps<'table'>) {
  return (
    <div className='overflow-x-auto'>
      <table className='w-full text-[13px] tabular-nums'>{children}</table>
    </div>
  );
}

function MarkdownTableHead({ children, style }: MarkdownPartProps<'th'>) {
  return (
    <th
      style={style}
      className='hairline-b border-border text-muted-foreground px-2 py-1.5 text-start font-medium'
    >
      {children}
    </th>
  );
}

function MarkdownTableCell({ children, style }: MarkdownPartProps<'td'>) {
  return (
    <td
      style={style}
      className='hairline-b border-border px-2 py-1.5 align-top'
    >
      {children}
    </td>
  );
}

const DEFAULT_COMPONENTS: Partial<Components> = {
  pre: MarkdownPre,
  code: MarkdownInlineCode,
  a: MarkdownLink,
  table: MarkdownTable,
  th: MarkdownTableHead,
  td: MarkdownTableCell,
  h1: ({ children }) => (
    <h3 className='text-base font-semibold text-balance'>{children}</h3>
  ),
  h2: ({ children }) => (
    <h4 className='text-[15px] font-semibold text-balance'>{children}</h4>
  ),
  h3: ({ children }) => (
    <h5 className='text-sm font-semibold text-balance'>{children}</h5>
  ),
  h4: ({ children }) => <h6 className='text-sm font-medium'>{children}</h6>,
  p: ({ children }) => <p>{children}</p>,
  ul: ({ children }) => (
    <ul className='marker:text-muted-foreground list-disc space-y-1 ps-5'>
      {children}
    </ul>
  ),
  ol: ({ children, start }) => (
    <ol
      start={start}
      className='marker:text-muted-foreground list-decimal space-y-1 ps-5 marker:tabular-nums'
    >
      {children}
    </ol>
  ),
  li: ({ children }) => <li className='ps-0.5'>{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className='border-foreground/10 text-muted-foreground border-s-2 ps-3'>
      {children}
    </blockquote>
  ),
  hr: () => <hr className='bg-border h-(--hairline) border-0' />,
  strong: ({ children }) => (
    <strong className='font-semibold'>{children}</strong>
  ),
};

type MarkdownBlockProps = {
  content: string;
  components: Partial<Components>;
};

function hasSameContent(
  previous: MarkdownBlockProps,
  next: MarkdownBlockProps
) {
  return previous.content === next.content;
}

/** Each block re-renders only when its own text changes, so a streaming reply only parses its last block. */
const MemoizedMarkdownBlock = memo(function MarkdownBlock({
  content,
  components,
}: MarkdownBlockProps) {
  return (
    <ReactMarkdown remarkPlugins={REMARK_PLUGINS} components={components}>
      {content}
    </ReactMarkdown>
  );
}, hasSameContent);

type MarkdownProps = {
  children: string;
  id?: string;
  className?: string;
  components?: Partial<Components>;
};

function MarkdownComponent({
  children,
  id,
  className,
  components,
}: MarkdownProps) {
  const generatedId = useId();
  const blockId = id ?? generatedId;
  const blocks = useMemo(() => parseMarkdownIntoBlocks(children), [children]);
  const mergedComponents = useMemo(
    () => ({ ...DEFAULT_COMPONENTS, ...components }),
    [components]
  );

  return (
    <div
      data-slot='markdown'
      className={cn(
        'text-foreground space-y-3 text-sm leading-relaxed break-words',
        className
      )}
    >
      {blocks.map((block, index) => (
        <MemoizedMarkdownBlock
          key={`${blockId}-block-${index}`}
          content={block}
          components={mergedComponents}
        />
      ))}
    </div>
  );
}

const Markdown = memo(MarkdownComponent);

export { Markdown, type MarkdownProps };
