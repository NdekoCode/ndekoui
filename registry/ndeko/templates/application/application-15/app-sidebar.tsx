'use client';

import { motion } from 'motion/react';
import { useId } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { springOf } from '@/registry/ndeko/lib/motion-presets';
import { cn } from '@/registry/ndeko/lib/utils';
import { Avatar } from '@/registry/ndeko/ui/avatar';
import { CompanyMark } from '@/registry/ndeko/ui/company-mark';

import { BRAND, NAV, SALES_LEAD, type NavItem, type SectionId } from './data';

const NAV_ROW =
  "relative flex h-7 w-full min-w-0 cursor-pointer items-center gap-2 rounded-md px-2 text-start text-[13px] font-medium outline-none transition-colors duration-150 hover:bg-foreground/5 focus-visible:ring-[3px] focus-visible:ring-ring/25 [&_svg]:pointer-events-none [&_svg]:relative [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground";

function currentOf(isActive: boolean) {
  if (isActive) {
    return 'location';
  }
  return undefined;
}

function ActiveIndicator({ layoutId }: { layoutId: string }) {
  const shouldReduceMotion = usePrefersReducedMotion();

  return (
    <motion.span
      aria-hidden='true'
      layoutId={layoutId}
      transition={springOf(shouldReduceMotion)}
      className='bg-foreground/[0.07] absolute inset-0 rounded-md'
    />
  );
}

type NavRowProps = {
  item: NavItem;
  isActive: boolean;
  indicatorId: string;
  onNavigate: (id: SectionId) => void;
};

function NavRow({ item, isActive, indicatorId, onNavigate }: NavRowProps) {
  const ItemIcon = item.icon;

  function navigate() {
    onNavigate(item.id);
  }

  return (
    <li>
      <button
        type='button'
        aria-current={currentOf(isActive)}
        onClick={navigate}
        className={NAV_ROW}
      >
        {isActive && <ActiveIndicator layoutId={indicatorId} />}
        <ItemIcon />
        <span className='relative min-w-0 flex-1 truncate'>{item.label}</span>
      </button>
    </li>
  );
}

type AppSidebarProps = {
  activeId: SectionId;
  onNavigate: (id: SectionId) => void;
  className?: string;
};

export function AppSidebar({
  activeId,
  onNavigate,
  className,
}: AppSidebarProps) {
  const indicatorId = useId();

  return (
    <div className={cn('flex min-h-0 w-full flex-col gap-3', className)}>
      <div className='flex h-9 items-center gap-2 px-1.5'>
        <CompanyMark seed={BRAND.name} className='size-6 rounded-md' />
        <span className='text-[13px] font-semibold'>{BRAND.name}</span>
      </div>
      <nav aria-label='Sections of the overview' className='flex-1'>
        <ul className='flex flex-col gap-px'>
          {NAV.map((item) => (
            <NavRow
              key={item.id}
              item={item}
              isActive={item.id === activeId}
              indicatorId={indicatorId}
              onNavigate={onNavigate}
            />
          ))}
        </ul>
      </nav>
      <div className='flex items-center gap-2 px-1.5 py-1'>
        <Avatar className='size-7' seed={SALES_LEAD.name} />
        <div className='flex min-w-0 flex-col leading-tight'>
          <span className='truncate text-[13px] font-medium'>
            {SALES_LEAD.name}
          </span>
          <span className='text-muted-foreground truncate text-xs'>
            {SALES_LEAD.role}
          </span>
        </div>
      </div>
    </div>
  );
}
