'use client';
import { ScrollArea } from '@/components/website/scroll-area';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React, { useEffect, useRef } from 'react';
import { TableOfContents } from '@/components/website/table-of-contents';
import { SiteHeader } from '@/app/_site/site-header';
import { SYSTEM_FONT_CLASS } from '@/lib/site';
import { motion, useReducedMotion, type Transition } from 'motion/react';
import { NAVIGATION } from './navigation';

const INDICATOR_SPRING: Transition = {
  type: 'spring',
  bounce: 0,
  duration: 0.3,
};

const INSTANT: Transition = { duration: 0 };

function indicatorTransitionOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return INSTANT;
  }
  return INDICATOR_SPRING;
}

function activeRefOf(
  isActive: boolean,
  activeRef: React.RefObject<HTMLLIElement | null>
) {
  if (isActive) {
    return activeRef;
  }
  return null;
}

function NavigationDesktop() {
  const pathname = usePathname();
  const activeRef = useRef<HTMLLIElement | null>(null);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({
        behavior: 'auto',
        block: 'nearest',
      });
    }
  }, [pathname]);

  return (
    <aside className='sticky top-14 hidden h-[calc(100dvh-(--spacing(16)))] w-[220px] shrink-0 pt-8 md:block lg:pt-12'>
      <ScrollArea className='h-full w-full'>
        <nav>
          <ul
            role='list'
            className='h-full pb-9 [&>li:not(:first-child)>div]:pt-6'
          >
            {NAVIGATION.map((item, index) => {
              return (
                <li key={`${item.name}-${index}`}>
                  <div className='bg-background text-foreground relative z-10 w-11/12 pb-4 text-sm/6 font-medium'>
                    {item.name}
                  </div>
                  <ul
                    role='list'
                    className='hairline-l border-border space-y-3.5'
                  >
                    {item.children.map((child) => {
                      const isActive = pathname === child.href;

                      return (
                        <li
                          key={child.href}
                          ref={activeRefOf(isActive, activeRef)}
                        >
                          <Link
                            className={cn(
                              'text-muted-foreground hover:text-foreground relative inline-flex items-center pl-4 text-sm font-normal transition-colors',
                              isActive && 'text-foreground'
                            )}
                            href={child.href}
                          >
                            {isActive && (
                              <motion.div
                                layout
                                className='bg-foreground absolute top-0 -left-px -z-1 h-full w-0.5 rounded-full'
                                transition={indicatorTransitionOf(
                                  shouldReduceMotion
                                )}
                                layoutId='underline-sidebar'
                              />
                            )}
                            <span>{child.name}</span>
                            {child?.isNew && (
                              <span className='bg-success/10 text-success-foreground ml-2 rounded-sm px-1.5 text-[11px] font-medium whitespace-nowrap'>
                                New
                              </span>
                            )}
                            {child?.isUpdated && (
                              <span className='bg-warning/10 text-warning-foreground ml-2 rounded-sm px-1.5 text-[11px] font-medium whitespace-nowrap'>
                                Updated
                              </span>
                            )}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              );
            })}
          </ul>
        </nav>
      </ScrollArea>
    </aside>
  );
}

function NavigationMobile() {
  const router = useRouter();
  const pathname = usePathname();
  const [selectedHref, setSelectedHref] = React.useState(pathname);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const href = e.target.value;
    setSelectedHref(href);
    router.push(href);
  };

  return (
    <div className='block w-full pt-8 md:hidden'>
      <select
        className='bg-card text-foreground hairline-ring ring-border block w-full appearance-none rounded-lg px-4 py-2 text-sm font-medium'
        value={selectedHref}
        onChange={handleChange}
      >
        {NAVIGATION.map((item) => {
          return (
            <optgroup label={item.name} key={item.name}>
              {item.children.map((child) => (
                <option key={child.href} value={child.href}>
                  {child.name}
                </option>
              ))}
            </optgroup>
          );
        })}
      </select>
    </div>
  );
}

export default function ComponentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`${SYSTEM_FONT_CLASS} bg-background text-foreground min-h-screen antialiased`}
    >
      <SiteHeader />
      <div className='px-6 lg:px-8'>
        <div className='mx-auto md:max-w-7xl'>
          <div className='mx-auto flex w-full flex-col items-start md:flex-row md:space-x-12'>
            <NavigationDesktop />
            <NavigationMobile />
            <main className='prose prose-zinc dark:prose-invert prose-h1:scroll-m-20 prose-h1:text-2xl prose-h1:font-semibold prose-h2:mt-12 prose-h2:scroll-m-20 prose-h2:text-xl prose-h2:font-medium prose-h3:scroll-m-20 prose-h3:text-base prose-h3:font-medium prose-h4:scroll-m-20 prose-h5:scroll-m-20 prose-h6:scroll-m-20 prose-strong:font-medium prose-table:block prose-table:overflow-y-auto mr-0 max-w-full min-w-0 flex-1 pt-8 pb-16 lg:pt-12 xl:mr-12 xl:max-w-2xl'>
              {children}
            </main>
            <aside className='sticky top-14 hidden h-[calc(100dvh-(--spacing(16)))] w-[220px] shrink-0 pt-8 lg:pt-12 xl:block'>
              <ScrollArea className='h-full w-full'>
                <TableOfContents />
              </ScrollArea>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
