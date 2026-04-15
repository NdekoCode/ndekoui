'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
  useReducedMotion,
} from 'motion/react';

import { MenuIcon, XIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/registry/ndeko/ui/accordion';
import { Button } from '@/registry/ndeko/ui/button';
import {
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/registry/ndeko/ui/collapsible';
import { SelectedMark } from '@/registry/ndeko/ui/selected-mark';

import {
  type MenuLink,
  PRODUCT_LINKS,
  RESOURCE_LINKS,
  SOLUTION_GROUPS,
} from './data';

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
  'flex h-10 items-center gap-3 rounded-md px-2 text-sm text-foreground outline-none transition-colors hover:bg-foreground/5 focus-visible:ring-[3px] focus-visible:ring-ring/25';

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
  const shouldReduceMotion = useReducedMotion();
  const iconVariants = iconVariantsOf(shouldReduceMotion);
  const glyph = toggleGlyphOf(isOpen);

  return (
    <CollapsibleTrigger
      render={
        <Button
          variant='ghost'
          size='icon'
          className='md:hidden'
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

type MobileLinksProps = {
  links: MenuLink[];
  onNavigate: () => void;
};

function currentAttributeOf(isCurrent: boolean | undefined) {
  if (isCurrent) {
    return 'page' as const;
  }
  return undefined;
}

function MobileIconLinks({ links, onNavigate }: MobileLinksProps) {
  return (
    <ul className='flex flex-col'>
      {links.map((link) => (
        <li key={link.title}>
          <a
            href={link.href}
            aria-current={currentAttributeOf(link.isCurrent)}
            className={cn(ROW, 'aria-[current=page]:bg-foreground/5')}
            onClick={onNavigate}
          >
            <span className='keycap-3d text-muted-foreground flex size-7 shrink-0 items-center justify-center rounded-lg'>
              <link.icon className='size-3.5' />
            </span>
            {link.title}
            {link.isCurrent && <SelectedMark className='ms-auto' />}
          </a>
        </li>
      ))}
    </ul>
  );
}

export function MobileMenuPanel({ onNavigate }: { onNavigate: () => void }) {
  return (
    <CollapsibleContent className='md:hidden'>
      <nav aria-label='Main' className='flex flex-col gap-4 pt-2 pb-5'>
        <Accordion defaultValue={['resources']}>
          <AccordionItem value='product' className='border-b-0'>
            <AccordionTrigger className='px-2 text-sm'>
              Product
            </AccordionTrigger>
            <AccordionContent>
              <MobileIconLinks links={PRODUCT_LINKS} onNavigate={onNavigate} />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value='solutions' className='border-b-0'>
            <AccordionTrigger className='px-2 text-sm'>
              Solutions
            </AccordionTrigger>
            <AccordionContent className='flex flex-col gap-3'>
              {SOLUTION_GROUPS.map((group) => (
                <div key={group.label} className='flex flex-col gap-0.5'>
                  <p className='text-muted-foreground px-2 py-1 text-xs font-medium'>
                    {group.label}
                  </p>
                  <ul className='flex flex-col'>
                    {group.links.map((link) => (
                      <li key={link.title}>
                        <a
                          href={link.href}
                          className={ROW}
                          onClick={onNavigate}
                        >
                          {link.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value='resources' className='border-b-0'>
            <AccordionTrigger className='px-2 text-sm'>
              Resources
            </AccordionTrigger>
            <AccordionContent>
              <MobileIconLinks links={RESOURCE_LINKS} onNavigate={onNavigate} />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        <a href='#' className={ROW} onClick={onNavigate}>
          Pricing
        </a>
        <div className='flex flex-col gap-2 px-2'>
          <Button
            variant='outline'
            size='lg'
            nativeButton={false}
            render={<a href='#' />}
          >
            Sign in
          </Button>
          <Button size='lg' nativeButton={false} render={<a href='#' />}>
            Start free
          </Button>
        </div>
      </nav>
    </CollapsibleContent>
  );
}
