'use client';

import { motion, type Transition } from 'motion/react';
import { useId, useState } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { pressedQuietOf } from '@/registry/ndeko/lib/demonstration';
import { ChevronDownIcon } from '@/registry/ndeko/lib/icons';
import { INSTANT, SPRING } from '@/registry/ndeko/lib/motion-presets';
import { FOCUS_RING } from '@/registry/ndeko/lib/recipes';
import { cn } from '@/registry/ndeko/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/registry/ndeko/ui/collapsible';

import { SECTIONS } from './data';

function travelOf(shouldReduceMotion: boolean): Transition {
  if (shouldReduceMotion) {
    return INSTANT;
  }
  return SPRING;
}

function currentOf(isActive: boolean): 'location' | undefined {
  if (isActive) {
    return 'location';
  }
  return undefined;
}

function sectionTitleOf(sectionId: string) {
  const section = SECTIONS.find((candidate) => candidate.id === sectionId);
  return section?.title ?? SECTIONS[0].title;
}

/** `@starting-style` also plays when the page loads, so the title fades in only once it replaced another. */
function titleEntranceOf(hasChanged: boolean) {
  if (hasChanged) {
    return 'transition-opacity duration-150 starting:opacity-0';
  }
  return undefined;
}

type ContentsProps = {
  activeId: string;
  headingIdOf: (sectionId: string) => string;
  onJump: (sectionId: string) => void;
};

type ContentsLinkProps = {
  sectionId: string;
  title: string;
  isActive: boolean;
  isPressed: boolean;
  headingIdOf: (sectionId: string) => string;
  onJump: (sectionId: string) => void;
  className?: string;
};

function ContentsLink({
  sectionId,
  title,
  isActive,
  isPressed,
  headingIdOf,
  onJump,
  className,
}: ContentsLinkProps) {
  function jump(event: React.MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    onJump(sectionId);
  }

  return (
    <a
      href={`#${headingIdOf(sectionId)}`}
      aria-current={currentOf(isActive)}
      onClick={jump}
      className={cn(
        'text-muted-foreground hover:text-foreground block rounded-sm py-1.5 text-[13px] text-pretty transition-[color,scale] duration-150',
        isActive && 'text-foreground',
        pressedQuietOf(isPressed),
        FOCUS_RING,
        className
      )}
    >
      {title}
    </a>
  );
}

export function TableOfContents({
  activeId,
  headingIdOf,
  onJump,
  pressed,
}: ContentsProps & { pressed: string | null }) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const markerId = useId();

  return (
    <nav aria-label='On this page' className='flex flex-col gap-3'>
      <p className='text-muted-foreground text-xs font-medium'>On this page</p>
      <ol className='hairline-l border-border flex flex-col'>
        {SECTIONS.map((section) => {
          const isActive = section.id === activeId;
          return (
            <li key={section.id} className='relative'>
              {isActive && (
                <motion.span
                  layoutId={markerId}
                  transition={travelOf(shouldReduceMotion)}
                  className='bg-primary absolute inset-y-1.5 -start-px w-0.5 rounded-full'
                />
              )}
              <ContentsLink
                sectionId={section.id}
                title={section.title}
                isActive={isActive}
                isPressed={pressed === `toc-${section.id}`}
                headingIdOf={headingIdOf}
                onJump={onJump}
                className='ps-3'
              />
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function OnThisPage({ activeId, headingIdOf, onJump }: ContentsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [firstActiveId] = useState(activeId);
  const [hasActiveChanged, setHasActiveChanged] = useState(false);
  const isFirstChange = !hasActiveChanged && activeId !== firstActiveId;
  const activeTitle = sectionTitleOf(activeId);
  if (isFirstChange) {
    setHasActiveChanged(true);
  }

  function jumpAndClose(sectionId: string) {
    setIsOpen(false);
    onJump(sectionId);
  }

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className='bg-background hairline-b border-border sticky top-0 z-10 -mx-4 px-4 @3xl:hidden'
    >
      <CollapsibleTrigger
        className={cn(
          'flex h-11 w-full items-center gap-2 rounded-md text-start',
          FOCUS_RING
        )}
      >
        <span className='text-muted-foreground shrink-0 text-xs'>
          On this page
        </span>
        <span
          key={activeId}
          className={cn(
            'min-w-0 truncate text-[13px] font-medium',
            titleEntranceOf(hasActiveChanged)
          )}
        >
          {activeTitle}
        </span>
        <ChevronDownIcon
          className={cn(
            'text-muted-foreground ms-auto size-4 shrink-0 transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className='bg-background hairline-b border-border absolute inset-x-0 top-full px-4'>
        <ol className='flex flex-col pb-3'>
          {SECTIONS.map((section) => (
            <li key={section.id}>
              <ContentsLink
                sectionId={section.id}
                title={section.title}
                isActive={section.id === activeId}
                isPressed={false}
                headingIdOf={headingIdOf}
                onJump={jumpAndClose}
              />
            </li>
          ))}
        </ol>
      </CollapsibleContent>
    </Collapsible>
  );
}
