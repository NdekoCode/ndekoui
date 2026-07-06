'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
} from 'motion/react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { MenuIcon, XIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';
import {
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/registry/ndeko/ui/collapsible';

import { HEADER, type NavLink } from './data';

const SWAP_TRANSITION: Transition = { duration: 0.15, ease: [0.2, 0, 0, 1] };

const ICON_VARIANTS: Variants = {
  enter: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
  visible: { opacity: 1, scale: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
};

const FADE_VARIANTS: Variants = {
  enter: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const ROW =
  'flex h-10 items-center rounded-md px-2 text-sm text-foreground outline-none transition-colors hover:bg-foreground/5 focus-visible:ring-[3px] focus-visible:ring-ring/25';

function iconVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return ICON_VARIANTS;
}

function toggleGlyphOf(isOpen: boolean) {
  if (isOpen) {
    return { key: 'close', icon: <XIcon /> };
  }
  return { key: 'open', icon: <MenuIcon /> };
}

function toggleLabelOf(isOpen: boolean) {
  if (isOpen) {
    return 'Close menu';
  }
  return 'Open menu';
}

export function MobileMenuTrigger({ isOpen }: { isOpen: boolean }) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const iconVariants = iconVariantsOf(shouldReduceMotion);
  const glyph = toggleGlyphOf(isOpen);

  return (
    <CollapsibleTrigger
      render={
        <Button
          variant='ghost'
          size='icon'
          className='@3xl:hidden'
          aria-label={toggleLabelOf(isOpen)}
        />
      }
    >
      <AnimatePresence mode='popLayout' initial={false}>
        <motion.span
          key={glyph.key}
          className='flex'
          variants={iconVariants}
          initial='enter'
          animate='visible'
          exit='exit'
          transition={SWAP_TRANSITION}
        >
          {glyph.icon}
        </motion.span>
      </AnimatePresence>
    </CollapsibleTrigger>
  );
}

type NavigateHandler = (event: React.MouseEvent<HTMLAnchorElement>) => void;

type MobileMenuPanelProps = {
  links: NavLink[];
  onNavigate: NavigateHandler;
};

export function MobileMenuPanel({ links, onNavigate }: MobileMenuPanelProps) {
  return (
    <CollapsibleContent className='@3xl:hidden'>
      <nav aria-label='Main' className='flex flex-col gap-4 pt-2 pb-5'>
        <ul className='flex flex-col'>
          {links.map((link) => (
            <li key={link.id}>
              <a href={link.href} className={ROW} onClick={onNavigate}>
                {link.label}
              </a>
            </li>
          ))}
        </ul>
        <div className='px-2'>
          <Button
            size='lg'
            className='w-full'
            nativeButton={false}
            render={<a href={HEADER.actionHref} onClick={onNavigate} />}
          >
            {HEADER.action}
          </Button>
        </div>
      </nav>
    </CollapsibleContent>
  );
}
