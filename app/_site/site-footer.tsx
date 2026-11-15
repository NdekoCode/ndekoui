import Link from 'next/link';

import { groupsOf } from '@/app/blocks/_shared/bundles';
import { catalog } from '@/app/components/_generated/catalog';
import { NdekoUILLogo } from '@/components/website/icons/ndekoui-logo';
import {
  ArrowUpRightIcon,
  GithubIcon,
  LinkedinBrandIcon,
  TwitterXIcon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';

import { REPOSITORY_URL } from './repository';

const COLUMN_SIZE = 6;

const AUTHOR_NAME = 'Arick Bulakali';

const AUTHOR_URL = 'https://ndekocode.dev';

type FooterLink = { href: string; label: string };

type ProfileLink = {
  href: string;
  label: string;
  Icon: typeof GithubIcon;
};

const AUTHOR_PROFILES: ProfileLink[] = [
  {
    href: 'https://github.com/NdekoCode',
    label: `${AUTHOR_NAME} on GitHub`,
    Icon: GithubIcon,
  },
  {
    href: 'https://www.linkedin.com/in/ndekocode',
    label: `${AUTHOR_NAME} on LinkedIn`,
    Icon: LinkedinBrandIcon,
  },
  {
    href: 'https://x.com/ndekocode',
    label: `${AUTHOR_NAME} on X`,
    Icon: TwitterXIcon,
  },
];

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

/** The negative margin gives each icon a 24px target without making the line taller than its text. */
const PROFILE_LINK =
  '-m-1 flex rounded-sm p-1 text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50';

/** Where each mark sits around the wordmark: its place, its size and its turn. */
const WORDMARK_TILES = [
  'left-[1%] top-[-6%] size-[clamp(2.5rem,6.5vw,5rem)] -rotate-12',
  'right-[2%] top-[-14%] size-[clamp(2.25rem,5.5vw,4.25rem)] rotate-12',
  'left-[52%] top-[-10%] size-[clamp(1.75rem,3.5vw,2.75rem)] rotate-6',
];

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

/** The name set very large and faint at the foot of the page, with a few marks placed around it. */
function Wordmark() {
  return (
    <div
      aria-hidden='true'
      className='relative mx-auto mt-16 flex w-full max-w-7xl justify-center px-4 select-none md:px-8'
    >
      <span className='text-foreground/[0.16] mask-b-from-35% mask-b-to-95% text-[clamp(4.5rem,23.5vw,18.5rem)] leading-[0.82] font-semibold'>
        ndekoui
      </span>
      {WORDMARK_TILES.map((placement) => (
        <NdekoUILLogo
          key={placement}
          className={cn(
            'absolute drop-shadow-[0_8px_14px_rgb(0_0_0/0.5)]',
            placement
          )}
        />
      ))}
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer className='dark bg-background text-foreground relative isolate overflow-hidden'>
      <div className='mx-auto flex w-full max-w-7xl flex-col gap-12 px-4 pt-16 md:px-8 md:pt-20'>
        <div className='flex flex-wrap items-start justify-between gap-6'>
          <div className='flex max-w-sm flex-col gap-3'>
            <Link
              href='/'
              className='focus-visible:ring-ring/50 flex w-fit items-center gap-2.5 rounded-lg text-[15px] font-semibold outline-none focus-visible:ring-[3px]'
            >
              <NdekoUILLogo aria-hidden className='size-7' />
              ndekoui
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
            aria-label='ndekoui on GitHub'
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
        <div className='text-muted-foreground flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-[13px]'>
          <p>{`© ${currentYear()} ndekoui, open source under the MIT licence`}</p>
          <div className='flex flex-wrap items-center gap-x-4 gap-y-2'>
            <p>
              {'Built by '}
              <a
                href={AUTHOR_URL}
                className='text-foreground focus-visible:ring-ring/50 inline-flex items-center gap-0.5 rounded-sm font-medium underline-offset-4 outline-none hover:underline focus-visible:ring-[3px]'
              >
                {AUTHOR_NAME}
                <ArrowUpRightIcon className='size-3.5' />
              </a>
            </p>
            <AuthorProfiles />
          </div>
        </div>
      </div>
      <Wordmark />
    </footer>
  );
}

function AuthorProfiles() {
  return (
    <ul className='flex items-center gap-3'>
      {AUTHOR_PROFILES.map(({ href, label, Icon }) => (
        <li key={href} className='flex'>
          <a href={href} aria-label={label} className={PROFILE_LINK}>
            <Icon aria-hidden className='size-4' />
          </a>
        </li>
      ))}
    </ul>
  );
}

type FooterColumnProps = {
  title: string;
  links: FooterLink[];
};

/** Next prefetches every internal Link as a page, so a static file such as the registry index gets a plain anchor. */
function isPageRoute(href: string) {
  const isInternal = href.startsWith('/');
  const isFile = href.endsWith('.json');
  return isInternal && !isFile;
}

function FooterLinkView({ link }: { link: FooterLink }) {
  if (isPageRoute(link.href)) {
    return (
      <Link href={link.href} className={FOOTER_LINK}>
        {link.label}
      </Link>
    );
  }
  return (
    <a href={link.href} className={FOOTER_LINK}>
      {link.label}
    </a>
  );
}

function FooterColumn({ title, links }: FooterColumnProps) {
  return (
    <div className='flex flex-col gap-3'>
      <p className='text-foreground text-[13px] font-medium'>{title}</p>
      <ul className='flex flex-col gap-2.5'>
        {links.map((link) => (
          <li key={link.href}>
            <FooterLinkView link={link} />
          </li>
        ))}
      </ul>
    </div>
  );
}
