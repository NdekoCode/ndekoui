// Adapted from prompt-kit (MIT, Copyright (c) 2025 Julien Thibeaut).
'use client';

import { createContext, useContext } from 'react';

import { cn } from '@/registry/ndeko/lib/utils';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/registry/ndeko/ui/hover-card';

type SourceContextValue = {
  href: string;
  domain: string;
};

const SourceContext = createContext<SourceContextValue | null>(null);

function useSourceContext() {
  const context = useContext(SourceContext);
  if (!context) {
    throw new Error('Source parts must be used within a Source');
  }
  return context;
}

const WWW_PREFIX = /^www\./;

function hostOf(href: string) {
  try {
    return new URL(href).hostname;
  } catch {
    const lastSegment = href.split('/').pop();
    return lastSegment || href;
  }
}

function domainOf(href: string) {
  const host = hostOf(href);
  return host.replace(WWW_PREFIX, '');
}

function initialOf(domain: string) {
  const first = domain.charAt(0);
  return first.toUpperCase();
}

const OPEN_DELAY_MS = 150;

type SourceProps = {
  href: string;
  children: React.ReactNode;
};

function Source({ href, children }: SourceProps) {
  const domain = domainOf(href);
  const context: SourceContextValue = { href, domain };

  return (
    <SourceContext.Provider value={context}>
      <HoverCard>{children}</HoverCard>
    </SourceContext.Provider>
  );
}

/** The first letter of the site on a key cap. Drawn locally, so citing a page never loads anything from it. */
function SourceMark({ className }: { className?: string }) {
  const { domain } = useSourceContext();
  const initial = initialOf(domain);

  return (
    <span
      aria-hidden='true'
      className={cn(
        'keycap-3d text-muted-foreground inline-flex size-3.5 shrink-0 items-center justify-center rounded-[4px] text-[9px] leading-none font-semibold',
        className
      )}
    >
      {initial}
    </span>
  );
}

type SourceTriggerProps = {
  label?: string | number;
  showMark?: boolean;
  className?: string;
};

function SourceTrigger({
  label,
  showMark = false,
  className,
}: SourceTriggerProps) {
  const { href, domain } = useSourceContext();
  const visibleLabel = label ?? domain;

  return (
    <HoverCardTrigger
      href={href}
      target='_blank'
      rel='noreferrer'
      delay={OPEN_DELAY_MS}
      closeDelay={0}
      data-slot='source-trigger'
      className={cn(
        'bg-foreground/[0.06] text-muted-foreground hover:bg-foreground/10 hover:text-foreground focus-visible:ring-ring/25 inline-flex h-5 max-w-36 items-center gap-1 overflow-hidden rounded-full px-1.5 align-middle text-xs no-underline transition-colors duration-150 outline-none focus-visible:ring-[3px]',
        showMark && 'ps-0.5 pe-2',
        className
      )}
    >
      {showMark && <SourceMark className='rounded-full' />}
      <span className='truncate text-center tabular-nums'>{visibleLabel}</span>
    </HoverCardTrigger>
  );
}

type SourceContentProps = {
  title: string;
  description: string;
  className?: string;
};

function SourceContent({ title, description, className }: SourceContentProps) {
  const { href, domain } = useSourceContext();

  return (
    <HoverCardContent className={cn('w-80 p-0', className)}>
      <a
        href={href}
        target='_blank'
        rel='noreferrer'
        className='focus-visible:ring-ring/25 flex flex-col gap-1.5 rounded-xl p-3 outline-none focus-visible:ring-[3px]'
      >
        <span className='flex items-center gap-1.5'>
          <SourceMark />
          <span className='text-primary-ink truncate text-xs'>{domain}</span>
        </span>
        <span className='line-clamp-2 text-[13px] font-medium'>{title}</span>
        <span className='text-muted-foreground line-clamp-2 text-[13px]'>
          {description}
        </span>
      </a>
    </HoverCardContent>
  );
}

export { Source, SourceContent, SourceMark, SourceTrigger };
