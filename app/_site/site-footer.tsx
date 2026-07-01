import Link from 'next/link';

import { groupsOf } from '@/app/blocks/_shared/bundles';
import { catalog } from '@/app/components/_generated/catalog';
import {
  NdekoUIGlyph,
  NdekoUILLogo,
} from '@/components/website/icons/ndekoui-logo';
import { GithubIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';

import { REPOSITORY_URL } from './repository';

const COLUMN_SIZE = 6;

const WATERMARK_COUNT = 9;

type FooterLink = { href: string; label: string };

const LIBRARY_LINKS: FooterLink[] = [
  { href: '/kit', label: 'Primitives' },
  { href: '/components', label: 'Components' },
  { href: '/blocks', label: 'Blocks' },
  { href: '/templates', label: 'Templates' },
  { href: '/docs', label: 'Motion' },
];

const RESOURCE_LINKS: FooterLink[] = [
  { href: '/docs/installation', label: 'Installation' },
  { href: '/mcp/connect', label: 'MCP server' },
  { href: '/r/registry.json', label: 'Registry index' },
];

const PROJECT_LINKS: FooterLink[] = [
  { href: REPOSITORY_URL, label: 'GitHub' },
  {
    href: `${REPOSITORY_URL}/blob/main/CONTRIBUTING.md`,
    label: 'Contributing',
  },
  { href: `${REPOSITORY_URL}/issues/new`, label: 'Suggest a component' },
  { href: `${REPOSITORY_URL}/blob/main/LICENCE.md`, label: 'MIT licence' },
  {
    href: `${REPOSITORY_URL}/blob/main/THIRD_PARTY_NOTICES.md`,
    label: 'Credits',
  },
];

const FOOTER_LINK =
  'rounded-sm text-[13px] text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50';

const WATERMARKS = Array.from({ length: WATERMARK_COUNT }, (_, index) => index);

function largestCategoryLinks(): FooterLink[] {
  const bySize = [...catalog].sort(
    (first, second) => second.entries.length - first.entries.length
  );
  const largest = bySize.slice(0, COLUMN_SIZE);
  const links = largest.map((category) => ({
    href: `/components/${category.slug}`,
    label: category.name,
  }));
  return [...links, { href: '/components', label: 'All categories' }];
}

function blockGroupLinks(): FooterLink[] {
  const groups = groupsOf('blocks').slice(0, COLUMN_SIZE);
  const links = groups.map((group) => ({
    href: `/blocks/${group.slug}`,
    label: group.name,
  }));
  return [...links, { href: '/blocks', label: 'All blocks' }];
}

function currentYear() {
  return new Date().getFullYear();
}

export function SiteFooter() {
  return (
    <footer className='dark bg-background text-foreground relative isolate overflow-hidden'>
      <div className='mx-auto flex w-full max-w-6xl flex-col gap-14 px-4 pt-16 pb-12 md:px-6 md:pt-20'>
        <div className='flex flex-wrap items-start justify-between gap-6'>
          <div className='flex max-w-sm flex-col gap-3'>
            <Link
              href='/'
              className='focus-visible:ring-ring/50 flex w-fit items-center gap-2.5 rounded-lg text-[15px] font-semibold tracking-tight outline-none focus-visible:ring-[3px]'
            >
              <NdekoUILLogo aria-hidden className='size-7' />
              Ndeko UI
            </Link>
            <p className='text-muted-foreground text-[13px] text-pretty'>
              Open-source React components that animate every change of state,
              installed with the shadcn CLI or through MCP.
            </p>
          </div>
          <Button
            variant='outline'
            size='icon'
            nativeButton={false}
            aria-label='Ndeko UI on GitHub'
            role='link'
            render={<a href={REPOSITORY_URL} />}
          >
            <GithubIcon />
          </Button>
        </div>
        <div className='grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3 lg:grid-cols-5'>
          <FooterColumn title='Library' links={LIBRARY_LINKS} />
          <FooterColumn title='Components' links={largestCategoryLinks()} />
          <FooterColumn title='Blocks' links={blockGroupLinks()} />
          <FooterColumn title='Resources' links={RESOURCE_LINKS} />
          <FooterColumn title='Project' links={PROJECT_LINKS} />
        </div>
        <p className='text-muted-foreground text-center text-xs'>
          {`© ${currentYear()} ndekocode. Open source under the MIT licence.`}
        </p>
      </div>
      <div
        aria-hidden='true'
        className='text-primary/15 flex h-28 translate-y-6 justify-center gap-10 overflow-hidden mask-x-from-70% sm:h-36'
      >
        {WATERMARKS.map((index) => (
          <NdekoUIGlyph key={index} className='h-full' />
        ))}
      </div>
    </footer>
  );
}

type FooterColumnProps = {
  title: string;
  links: FooterLink[];
};

function FooterColumn({ title, links }: FooterColumnProps) {
  return (
    <div className='flex flex-col gap-3'>
      <p className='text-foreground text-[13px] font-medium'>{title}</p>
      <ul className='flex flex-col gap-2.5'>
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className={FOOTER_LINK}>
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
