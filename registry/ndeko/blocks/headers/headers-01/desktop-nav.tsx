import { ArrowRightIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@/registry/ndeko/ui/navigation-menu';

import {
  FEATURED_GUIDE,
  type MenuLink,
  PRODUCT_LINKS,
  RESOURCE_LINKS,
  SOLUTION_GROUPS,
} from './data';

function IconLink({ link }: { link: MenuLink }) {
  return (
    <NavigationMenuLink href={link.href} className='flex-row items-start gap-3'>
      <span className='keycap-3d text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-lg'>
        <link.icon />
      </span>
      <span className='flex flex-col gap-0.5'>
        <span className='text-foreground font-medium'>{link.title}</span>
        <span className='text-muted-foreground text-xs'>
          {link.description}
        </span>
      </span>
    </NavigationMenuLink>
  );
}

function ProductPanel() {
  return (
    <ul className='grid gap-1 sm:w-[34rem] sm:grid-cols-2'>
      {PRODUCT_LINKS.map((link) => (
        <li key={link.title}>
          <IconLink link={link} />
        </li>
      ))}
    </ul>
  );
}

function SolutionsPanel() {
  return (
    <div className='grid gap-4 p-1 sm:w-[24rem] sm:grid-cols-2'>
      {SOLUTION_GROUPS.map((group) => (
        <div key={group.label} className='flex flex-col gap-1'>
          <p className='text-muted-foreground px-2.5 pt-1.5 text-xs font-medium'>
            {group.label}
          </p>
          <ul className='flex flex-col'>
            {group.links.map((link) => (
              <li key={link.title}>
                <NavigationMenuLink
                  href={link.href}
                  className='text-foreground py-2'
                >
                  {link.title}
                </NavigationMenuLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function ResourcesPanel() {
  return (
    <div className='grid gap-2 sm:w-[38rem] sm:grid-cols-[minmax(0,1fr)_15rem]'>
      <ul className='flex flex-col gap-1'>
        {RESOURCE_LINKS.map((link) => (
          <li key={link.title}>
            <IconLink link={link} />
          </li>
        ))}
      </ul>
      <NavigationMenuLink
        href={FEATURED_GUIDE.href}
        className='group/guide p-0 transition-[scale] duration-150 ease-(--ease-out-strong) hover:bg-transparent active:scale-[0.97]'
      >
        <span className='bg-foreground/[0.03] group-hover/guide:bg-foreground/[0.05] flex h-full flex-col justify-between gap-6 rounded-lg p-4 transition-colors'>
          <span className='flex flex-col gap-1.5'>
            <span className='text-primary-ink text-xs font-medium'>
              {FEATURED_GUIDE.label}
            </span>
            <span className='text-foreground text-sm font-medium text-balance'>
              {FEATURED_GUIDE.title}
            </span>
            <span className='text-muted-foreground text-xs'>
              {FEATURED_GUIDE.description}
            </span>
          </span>
          <span className='text-primary-ink inline-flex items-center gap-1 text-xs font-medium'>
            Read the guide
            <ArrowRightIcon className='size-3.5' />
          </span>
        </span>
      </NavigationMenuLink>
    </div>
  );
}

export function DesktopNav() {
  return (
    <NavigationMenu className='hidden md:block'>
      <NavigationMenuList>
        <NavigationMenuItem value='product'>
          <NavigationMenuTrigger>Product</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ProductPanel />
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem value='solutions'>
          <NavigationMenuTrigger>Solutions</NavigationMenuTrigger>
          <NavigationMenuContent>
            <SolutionsPanel />
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem value='resources'>
          <NavigationMenuTrigger>Resources</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ResourcesPanel />
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink
            href='#'
            className={cn(navigationMenuTriggerStyle, 'flex-row py-0')}
          >
            Pricing
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}
