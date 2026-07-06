import { Button } from '@/registry/ndeko/ui/button';

import { TallyfoldMark } from './brand-mark';
import { BRAND, FOOTER_LINKS, SOCIAL_LINKS } from './data';

function currentAttributeOf(isCurrent: boolean | undefined) {
  if (isCurrent) {
    return 'page' as const;
  }
  return undefined;
}

export function SiteFooter() {
  return (
    <footer className='px-4 py-8 sm:px-6 lg:px-8'>
      <div className='mx-auto flex max-w-6xl flex-col items-center gap-6 md:flex-row md:justify-between md:gap-8'>
        <div className='flex items-center gap-3'>
          <a
            href='#'
            className='focus-visible:ring-ring/25 flex items-center gap-2 rounded-md text-sm font-semibold outline-none focus-visible:ring-[3px]'
          >
            <TallyfoldMark />
            {BRAND.name}
          </a>
          <p className='text-muted-foreground text-xs'>{BRAND.copyright}</p>
        </div>
        <nav aria-label='Footer'>
          <ul className='flex flex-wrap justify-center gap-x-5 gap-y-2'>
            {FOOTER_LINKS.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  aria-current={currentAttributeOf(link.isCurrent)}
                  className='text-muted-foreground hover:text-foreground aria-[current=page]:text-foreground focus-visible:ring-ring/25 rounded-sm text-[13px] transition-colors outline-none focus-visible:ring-[3px] aria-[current=page]:font-medium'
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <ul className='flex items-center gap-1'>
          {SOCIAL_LINKS.map((link) => (
            <li key={link.label}>
              <Button
                variant='ghost'
                size='icon'
                className='text-muted-foreground'
                aria-label={link.label}
                nativeButton={false}
                render={<a href={link.href} />}
              >
                <link.icon />
              </Button>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
