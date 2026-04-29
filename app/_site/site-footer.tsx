import Link from 'next/link';

import { groupsOf } from '@/app/blocks/_shared/bundles';
import { catalog } from '@/app/components/_generated/catalog';
import { NdekoUILLogo } from '@/components/website/icons/ndekoui-logo';
import { GithubIcon } from '@/registry/ndeko/lib/icons';

const COLUMN_SIZE = 7;

const REPOSITORY_URL = 'https://github.com/ndekocode/ndekoui';

type FooterLink = { href: string; label: string };

const LIBRARY_LINKS: FooterLink[] = [
  { href: '/kit', label: 'Primitives' },
  { href: '/components', label: 'Components' },
  { href: '/blocks', label: 'Blocks' },
  { href: '/templates', label: 'Templates' },
  { href: '/docs', label: 'Motion' },
  { href: '/docs/installation', label: 'Installation' },
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

export function SiteFooter() {
  return (
    <footer className='hairline-t border-border'>
      <div className='mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 md:px-6 lg:grid-cols-[minmax(0,2fr)_repeat(4,minmax(0,1fr))]'>
        <div className='flex flex-col gap-3'>
          <Link
            href='/'
            className='focus-visible:ring-ring/25 flex w-fit items-center gap-2 rounded-md text-sm font-semibold outline-none focus-visible:ring-[3px]'
          >
            <NdekoUILLogo aria-hidden className='size-6' />
            Ndeko UI
          </Link>
          <p className='text-muted-foreground max-w-xs text-[13px] text-pretty'>
            Open-source React components that animate every change of state,
            installed with the shadcn CLI.
          </p>
          <a
            href={REPOSITORY_URL}
            className={`${FOOTER_LINK} flex w-fit items-center gap-1.5`}
          >
            <GithubIcon className='size-4' />
            ndekocode/ndekoui
          </a>
        </div>
        <div className='grid grid-cols-2 gap-8 sm:grid-cols-4 lg:col-span-4'>
          <FooterColumn title='Library' links={LIBRARY_LINKS} />
          <FooterColumn title='Components' links={largestCategoryLinks()} />
          <FooterColumn title='Blocks' links={blockGroupLinks()} />
          <FooterColumn title='Project' links={PROJECT_LINKS} />
        </div>
      </div>
      <div className='text-muted-foreground mx-auto w-full max-w-6xl px-4 pb-10 text-xs md:px-6'>
        Ndeko UI is open source under the MIT licence, built by ndekocode
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
    <div className='flex flex-col gap-2.5'>
      <p className='text-foreground text-xs font-medium'>{title}</p>
      <ul className='flex flex-col gap-2'>
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
