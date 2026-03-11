'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
  useReducedMotion,
} from 'motion/react';

import {
  ArrowLeftToLineIcon,
  ArrowRightToLineIcon,
  MenuIcon,
} from '@/registry/ndeko/lib/icons';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/registry/ndeko/ui/breadcrumb';
import { Button } from '@/registry/ndeko/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/registry/ndeko/ui/tooltip';

import type { NavItem, Person } from './data';
import { PersonAvatar } from './sidebar-parts';

const STACK_LIMIT = 4;

const SWAP_TRANSITION: Transition = { duration: 0.15, ease: [0.2, 0, 0, 1] };

const SWAP_VARIANTS: Variants = {
  enter: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
  visible: { opacity: 1, scale: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
};

const FADE_VARIANTS: Variants = {
  enter: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

function swapVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return SWAP_VARIANTS;
}

function toggleLabelOf(isCollapsed: boolean) {
  if (isCollapsed) {
    return 'Expand sidebar';
  }
  return 'Collapse sidebar';
}

function ToggleGlyph({ isCollapsed }: { isCollapsed: boolean }) {
  if (isCollapsed) {
    return <ArrowRightToLineIcon />;
  }
  return <ArrowLeftToLineIcon />;
}

function SidebarToggle({
  isCollapsed,
  onToggle,
}: {
  isCollapsed: boolean;
  onToggle: () => void;
}) {
  const shouldReduceMotion = useReducedMotion();
  const variants = swapVariantsOf(shouldReduceMotion);
  const label = toggleLabelOf(isCollapsed);
  const glyphKey = String(isCollapsed);

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant='ghost'
            size='icon-sm'
            aria-label={label}
            aria-expanded={!isCollapsed}
            onClick={onToggle}
            className='text-muted-foreground hidden md:inline-flex'
          />
        }
      >
        <AnimatePresence mode='popLayout' initial={false}>
          <motion.span
            key={glyphKey}
            className='flex'
            variants={variants}
            initial='enter'
            animate='visible'
            exit='exit'
            transition={SWAP_TRANSITION}
          >
            <ToggleGlyph isCollapsed={isCollapsed} />
          </motion.span>
        </AnimatePresence>
      </TooltipTrigger>
      <TooltipContent side='bottom'>{label}</TooltipContent>
    </Tooltip>
  );
}

function AvatarStack({ people }: { people: Person[] }) {
  const shown = people.slice(0, STACK_LIMIT);
  const hiddenCount = people.length - shown.length;
  const hasHidden = hiddenCount > 0;

  return (
    <div
      role='group'
      aria-label='Team members'
      className='hidden items-center sm:flex'
    >
      {shown.map((person) => (
        <PersonAvatar
          key={person.id}
          person={person}
          className='ring-background -ml-1.5 size-6 text-[10px] ring-2 first:ml-0'
        />
      ))}
      {hasHidden && (
        <span className='bg-muted text-muted-foreground ring-background -ml-1.5 inline-flex size-6 items-center justify-center rounded-full text-[10px] font-medium tabular-nums ring-2'>
          +{hiddenCount}
        </span>
      )}
    </div>
  );
}

type TopBarProps = {
  page: NavItem;
  ancestor?: string;
  people: Person[];
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onOpenNavigation: () => void;
};

export function TopBar({
  page,
  ancestor,
  people,
  isSidebarCollapsed,
  onToggleSidebar,
  onOpenNavigation,
}: TopBarProps) {
  const PageIcon = page.icon;
  const hasAncestor = Boolean(ancestor);

  return (
    <header className='hairline-b border-border flex h-11 shrink-0 items-center gap-2 px-3 md:px-4'>
      <Button
        variant='ghost'
        size='icon-sm'
        aria-label='Open navigation'
        onClick={onOpenNavigation}
        className='text-muted-foreground md:hidden'
      >
        <MenuIcon />
      </Button>
      <SidebarToggle
        isCollapsed={isSidebarCollapsed}
        onToggle={onToggleSidebar}
      />
      <Breadcrumb className='min-w-0'>
        <BreadcrumbList className='flex-nowrap'>
          <li aria-hidden='true' className='flex'>
            <PageIcon className='text-muted-foreground size-4 shrink-0' />
          </li>
          {hasAncestor && (
            <>
              <BreadcrumbItem className='hidden sm:inline-flex'>
                {ancestor}
              </BreadcrumbItem>
              <BreadcrumbSeparator className='hidden sm:block' />
            </>
          )}
          <BreadcrumbItem className='min-w-0'>
            <BreadcrumbPage className='truncate'>{page.label}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className='ml-auto flex items-center gap-2'>
        <AvatarStack people={people} />
      </div>
    </header>
  );
}
