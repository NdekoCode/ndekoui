'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { NdekoUILLogo } from '@/components/website/icons/ndekoui-logo';
import { GithubIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';

const NAVIGATION = [
  { href: '/kit', label: 'Primitives' },
  { href: '/components', label: 'Components' },
  { href: '/blocks', label: 'Blocks' },
  { href: '/templates', label: 'Templates' },
  { href: '/docs', label: 'Motion' },
];

function ariaCurrentOf(isCurrent: boolean) {
  if (isCurrent) {
    return 'page' as const;
  }
  return undefined;
}

function isCurrentSection(pathname: string, href: string) {
  const isExact = pathname === href;
  const isNested = pathname.startsWith(`${href}/`);
  return isExact || isNested;
}

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className='hairline-b border-border bg-background/90 sticky top-0 z-40 backdrop-blur-sm'>
      <div className='mx-auto flex h-14 w-full max-w-6xl items-center gap-4 px-4 md:px-6'>
        <Link
          href='/'
          className='focus-visible:ring-ring/25 flex items-center gap-2 rounded-md text-sm font-semibold outline-none focus-visible:ring-[3px]'
        >
          <NdekoUILLogo aria-hidden className='size-6' />
          Ndeko UI
        </Link>
        <nav aria-label='Sections' className='flex items-center gap-1'>
          {NAVIGATION.map((item) => {
            const isCurrent = isCurrentSection(pathname, item.href);
            return (
              <Button
                key={item.href}
                variant='ghost'
                size='sm'
                nativeButton={false}
                aria-current={ariaCurrentOf(isCurrent)}
                className='text-muted-foreground aria-[current=page]:text-foreground'
                render={<Link href={item.href} />}
              >
                {item.label}
              </Button>
            );
          })}
        </nav>
        <div className='ml-auto'>
          <Button
            variant='ghost'
            size='icon-sm'
            nativeButton={false}
            aria-label='Ndeko UI on GitHub'
            render={<a href='https://github.com/ndekocode/ndekoui' />}
          >
            <GithubIcon />
          </Button>
        </div>
      </div>
    </header>
  );
}
