'use client';

import { Switch as SwitchPrimitive } from '@base-ui/react/switch';

import {
  MobileNav,
  MobileNavLinks,
} from '@/registry/ndeko/components/navbar/_parts/mobile-nav';
import {
  NavLinks,
  type NavLinkItem,
} from '@/registry/ndeko/components/navbar/_parts/nav-links';
import { useActiveLink } from '@/registry/ndeko/components/navbar/_parts/use-active-link';
import {
  ClockIcon,
  PowerIcon,
  PowerOffIcon,
  ZapIcon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Badge } from '@/registry/ndeko/ui/badge';

const LINKS: NavLinkItem[] = [
  { href: '#', label: 'Overview' },
  { href: '#', label: 'Graphs' },
  { href: '#', label: 'Backups' },
];

const POWER_TRACK = [
  'group/power inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full bg-foreground/15 p-0.5 outline-none',
  'transition-colors duration-200 ease-(--ease-out-strong) focus-visible:ring-[3px] focus-visible:ring-ring/25',
  'data-checked:bg-primary dark:bg-foreground/20',
].join(' ');

const POWER_THUMB = [
  'relative flex size-6 items-center justify-center rounded-full bg-white',
  'shadow-[0_1px_2px_rgb(0_0_0/0.2),0_0_0_var(--hairline)_rgb(0_0_0/0.04)]',
  'transition-[translate] duration-200 ease-(--ease-out-strong) data-checked:translate-x-5',
].join(' ');

const POWER_GLYPH =
  'absolute size-3.5 transition-[opacity,scale] duration-150 ease-(--ease-out-strong)';

export default function Navbar20() {
  const { activeLabel, navigate } = useActiveLink('Overview');

  return (
    <header className='hairline-b border-border px-4 md:px-6'>
      <div className='flex h-16 justify-between gap-4'>
        <div className='flex gap-2'>
          <div className='flex items-center md:hidden'>
            <MobileNav className='w-36'>
              <MobileNavLinks
                links={LINKS}
                activeLabel={activeLabel}
                onNavigate={navigate}
              />
            </MobileNav>
          </div>
          <NavLinks
            links={LINKS}
            activeLabel={activeLabel}
            onNavigate={navigate}
            indicator='underline'
            className='max-md:hidden'
          />
        </div>
        <div className='flex items-center gap-4'>
          <div className='flex items-center gap-2'>
            <Badge variant='success' className='gap-1.5'>
              <span
                aria-hidden='true'
                className='bg-success size-1.5 rounded-full'
              />
              Online
            </Badge>
            <Badge
              variant='outline'
              className='gap-1.5 tabular-nums max-sm:hidden'
            >
              <ZapIcon className='opacity-60' />
              <span className='sr-only'>Uptime</span>
              99.9%
            </Badge>
            <Badge
              variant='outline'
              className='gap-1.5 tabular-nums max-sm:hidden'
            >
              <ClockIcon className='opacity-60' />
              <span className='sr-only'>Response time</span>
              45ms
            </Badge>
          </div>
          <SwitchPrimitive.Root
            defaultChecked
            aria-label='Server power'
            className={POWER_TRACK}
          >
            <SwitchPrimitive.Thumb className={POWER_THUMB}>
              <PowerOffIcon
                className={cn(
                  POWER_GLYPH,
                  'text-muted-foreground group-data-checked/power:scale-75 group-data-checked/power:opacity-0'
                )}
              />
              <PowerIcon
                className={cn(
                  POWER_GLYPH,
                  'text-primary-ink scale-75 opacity-0 group-data-checked/power:scale-100 group-data-checked/power:opacity-100'
                )}
              />
            </SwitchPrimitive.Thumb>
          </SwitchPrimitive.Root>
        </div>
      </div>
    </header>
  );
}
