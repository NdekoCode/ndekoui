'use client';

import {
  LayoutGroup,
  motion,
  type Transition,
  useReducedMotion,
} from 'motion/react';
import { useId } from 'react';

import type { Icon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from '@/registry/ndeko/ui/navigation-menu';
import {
  TOOLTIP_GLIDE_CLOSE_DELAY,
  Tooltip,
  TooltipContent,
  type TooltipHandle,
  TooltipProvider,
  TooltipTrigger,
  useTooltipHandle,
} from '@/registry/ndeko/ui/tooltip';

type NavLinkItem = { label: string; href: string; icon?: Icon };

type NavIndicator = 'pill' | 'underline';

type NavLinkDisplay = 'label' | 'icon-label' | 'icon';

const SLIDE_TRANSITION: Transition = {
  type: 'spring',
  bounce: 0,
  duration: 0.3,
};
const INSTANT_TRANSITION: Transition = { duration: 0 };

const LINK_BASE =
  'relative flex-row items-center gap-2 py-0 font-medium text-muted-foreground hover:bg-transparent hover:text-foreground data-active:bg-transparent data-active:text-foreground';

const LINK_SHAPE: Record<NavIndicator, string> = {
  pill: 'h-8 rounded-md px-3',
  underline: 'h-full rounded-sm px-0.5',
};

const ICON_ONLY_SHAPE = 'size-8 justify-center px-0';

const LIST_CLASS: Record<NavIndicator, string> = {
  pill: 'gap-1',
  underline: 'h-full gap-6',
};

const ITEM_CLASS: Record<NavIndicator, string> = {
  pill: '',
  underline: 'h-full',
};

const INDICATOR_CLASS: Record<NavIndicator, string> = {
  pill: 'absolute inset-0 rounded-md bg-foreground/[0.06] dark:bg-foreground/10',
  underline: 'absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-primary',
};

function slideTransitionOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return INSTANT_TRANSITION;
  }
  return SLIDE_TRANSITION;
}

function isPlaceholderHref(href: string) {
  return href === '#';
}

function NavLinkIcon({ icon: LinkIcon }: { icon?: Icon }) {
  if (!LinkIcon) {
    return null;
  }
  return <LinkIcon className='size-4' />;
}

type NavLinksItemProps = {
  link: NavLinkItem;
  isActive: boolean;
  indicator: NavIndicator;
  display: NavLinkDisplay;
  transition: Transition;
  linkHint: TooltipHandle<string>;
  onFollow: (
    event: React.MouseEvent<HTMLAnchorElement>,
    link: NavLinkItem
  ) => void;
};

function NavLinksItem({
  link,
  isActive,
  indicator,
  display,
  transition,
  linkHint,
  onFollow,
}: NavLinksItemProps) {
  const isIconOnly = display === 'icon';
  const showsIcon = display !== 'label';
  const linkClassName = cn(
    LINK_BASE,
    LINK_SHAPE[indicator],
    isIconOnly && ICON_ONLY_SHAPE
  );

  function follow(event: React.MouseEvent<HTMLAnchorElement>) {
    onFollow(event, link);
  }

  const content = (
    <>
      {isActive && (
        <motion.span
          layoutId='active-link-indicator'
          transition={transition}
          className={INDICATOR_CLASS[indicator]}
        />
      )}
      <span className='relative flex items-center gap-2'>
        {showsIcon && <NavLinkIcon icon={link.icon} />}
        {isIconOnly && <span className='sr-only'>{link.label}</span>}
        {!isIconOnly && link.label}
      </span>
    </>
  );

  if (isIconOnly) {
    return (
      <NavigationMenuItem className={ITEM_CLASS[indicator]}>
        <TooltipTrigger
          handle={linkHint}
          payload={link.label}
          closeDelay={TOOLTIP_GLIDE_CLOSE_DELAY}
          render={
            <NavigationMenuLink
              href={link.href}
              active={isActive}
              onClick={follow}
              className={linkClassName}
            />
          }
        >
          {content}
        </TooltipTrigger>
      </NavigationMenuItem>
    );
  }

  return (
    <NavigationMenuItem className={ITEM_CLASS[indicator]}>
      <NavigationMenuLink
        href={link.href}
        active={isActive}
        onClick={follow}
        className={linkClassName}
      >
        {content}
      </NavigationMenuLink>
    </NavigationMenuItem>
  );
}

type NavLinksProps = {
  links: NavLinkItem[];
  activeLabel?: string;
  onNavigate: (label: string) => void;
  indicator?: NavIndicator;
  display?: NavLinkDisplay;
  className?: string;
};

function NavLinks({
  links,
  activeLabel,
  onNavigate,
  indicator = 'pill',
  display = 'label',
  className,
}: NavLinksProps) {
  const groupId = useId();
  const shouldReduceMotion = useReducedMotion();
  const transition = slideTransitionOf(shouldReduceMotion);
  const isUnderline = indicator === 'underline';
  const isIconOnly = display === 'icon';
  const linkHint = useTooltipHandle<string>();

  function followLink(
    event: React.MouseEvent<HTMLAnchorElement>,
    link: NavLinkItem
  ) {
    if (isPlaceholderHref(link.href)) {
      event.preventDefault();
    }
    onNavigate(link.label);
  }

  return (
    <LayoutGroup id={groupId}>
      <TooltipProvider>
        <NavigationMenu
          aria-label='Main'
          className={cn(isUnderline && 'h-full', className)}
        >
          <NavigationMenuList className={LIST_CLASS[indicator]}>
            {links.map((link) => (
              <NavLinksItem
                key={link.label}
                link={link}
                isActive={link.label === activeLabel}
                indicator={indicator}
                display={display}
                transition={transition}
                linkHint={linkHint}
                onFollow={followLink}
              />
            ))}
          </NavigationMenuList>
        </NavigationMenu>
        {isIconOnly && (
          <Tooltip handle={linkHint}>
            {({ payload }) => (
              <TooltipContent glide side='bottom'>
                {payload}
              </TooltipContent>
            )}
          </Tooltip>
        )}
      </TooltipProvider>
    </LayoutGroup>
  );
}

export {
  NavLinkIcon,
  NavLinks,
  isPlaceholderHref,
  type NavIndicator,
  type NavLinkDisplay,
  type NavLinkItem,
};
