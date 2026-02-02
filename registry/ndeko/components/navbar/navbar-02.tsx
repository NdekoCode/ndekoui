'use client';

import { LogoLink } from '@/registry/ndeko/components/navbar/_parts/logo';
import {
  MobileNav,
  MobileNavHeading,
  MobileNavLink,
  MobileNavSeparator,
} from '@/registry/ndeko/components/navbar/_parts/mobile-nav';
import {
  BookOpenIcon,
  type Icon,
  InfoIcon,
  LifeBuoyIcon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@/registry/ndeko/ui/navigation-menu';

type MenuEntry = { href: string; label: string };

const FEATURES = [
  {
    href: '#',
    label: 'Components',
    description: 'Browse all components in the library.',
  },
  {
    href: '#',
    label: 'Documentation',
    description: 'Learn how to use the library.',
  },
  {
    href: '#',
    label: 'Templates',
    description: 'Pre-built layouts for common use cases.',
  },
];

const PLANS: MenuEntry[] = [
  { href: '#', label: 'Starter' },
  { href: '#', label: 'Team' },
  { href: '#', label: 'Business' },
  { href: '#', label: 'Enterprise' },
];

const ABOUT: (MenuEntry & { icon: Icon })[] = [
  { href: '#', label: 'Getting started', icon: BookOpenIcon },
  { href: '#', label: 'Tutorials', icon: LifeBuoyIcon },
  { href: '#', label: 'About us', icon: InfoIcon },
];

const TOP_LINK = cn(
  navigationMenuTriggerStyle,
  'flex-row py-0 data-active:bg-transparent'
);

function MobileSection({
  title,
  entries,
}: {
  title: string;
  entries: MenuEntry[];
}) {
  return (
    <>
      <MobileNavSeparator />
      <MobileNavHeading>{title}</MobileNavHeading>
      <ul className='flex flex-col'>
        {entries.map((entry) => (
          <li key={entry.label}>
            <MobileNavLink href={entry.href}>{entry.label}</MobileNavLink>
          </li>
        ))}
      </ul>
    </>
  );
}

export default function Navbar02() {
  return (
    <header className='hairline-b border-border px-4 md:px-6'>
      <div className='flex h-16 items-center justify-between gap-4'>
        <div className='flex items-center gap-2'>
          <MobileNav className='w-56'>
            <ul className='flex flex-col'>
              <li>
                <MobileNavLink href='#'>Home</MobileNavLink>
              </li>
            </ul>
            <MobileSection title='Features' entries={FEATURES} />
            <MobileSection title='Pricing' entries={PLANS} />
            <MobileSection title='About' entries={ABOUT} />
          </MobileNav>
          <div className='flex items-center gap-6'>
            <LogoLink />
            <NavigationMenu aria-label='Main' className='max-md:hidden'>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuLink href='#' className={TOP_LINK}>
                    Home
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuTrigger>Features</NavigationMenuTrigger>
                  <NavigationMenuContent className='sm:min-w-72'>
                    <ul className='flex flex-col'>
                      {FEATURES.map((feature) => (
                        <li key={feature.label}>
                          <NavigationMenuLink href={feature.href} closeOnClick>
                            <span className='font-medium'>{feature.label}</span>
                            <span className='text-muted-foreground line-clamp-2 text-xs'>
                              {feature.description}
                            </span>
                          </NavigationMenuLink>
                        </li>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuTrigger>Pricing</NavigationMenuTrigger>
                  <NavigationMenuContent className='sm:min-w-48'>
                    <ul className='flex flex-col'>
                      {PLANS.map((plan) => (
                        <li key={plan.label}>
                          <NavigationMenuLink
                            href={plan.href}
                            closeOnClick
                            className='py-2'
                          >
                            {plan.label}
                          </NavigationMenuLink>
                        </li>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuTrigger>About</NavigationMenuTrigger>
                  <NavigationMenuContent className='sm:min-w-48'>
                    <ul className='flex flex-col'>
                      {ABOUT.map((entry) => (
                        <li key={entry.label}>
                          <NavigationMenuLink
                            href={entry.href}
                            closeOnClick
                            className='flex-row items-center gap-2.5 py-2'
                          >
                            <entry.icon className='text-muted-foreground size-4' />
                            {entry.label}
                          </NavigationMenuLink>
                        </li>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>
        </div>
        <div className='flex items-center gap-2'>
          <Button variant='ghost' nativeButton={false} render={<a href='#' />}>
            Sign in
          </Button>
          <Button nativeButton={false} render={<a href='#' />}>
            Get started
          </Button>
        </div>
      </div>
    </header>
  );
}
