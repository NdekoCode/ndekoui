import { Button } from '@/registry/ndeko/ui/button';

import { LoomboardMark } from './brand-mark';
import { BRAND, CATEGORIES, SOCIAL_LINKS } from './data';
import { NewsletterForm } from './newsletter-form';

export function SiteFooter() {
  return (
    <footer className='px-4 pt-16 pb-10 sm:px-6 lg:px-8'>
      <div className='mx-auto flex max-w-6xl flex-col gap-14'>
        <div className='grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:gap-16'>
          <div className='flex flex-col items-start gap-6'>
            <div className='flex flex-col gap-3'>
              <a
                href='#'
                className='focus-visible:ring-ring/25 flex items-center gap-2 self-start rounded-md text-sm font-semibold outline-none focus-visible:ring-[3px]'
              >
                <LoomboardMark />
                {BRAND.name}
              </a>
              <p className='text-muted-foreground max-w-xs text-[13px] text-pretty'>
                {BRAND.tagline}
              </p>
            </div>
            <NewsletterForm />
          </div>
          <nav
            aria-label='Footer'
            className='grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4'
          >
            {CATEGORIES.map((category) => (
              <div key={category.title} className='flex flex-col gap-3'>
                <h2 className='text-muted-foreground text-xs font-medium'>
                  {category.title}
                </h2>
                <ul className='flex flex-col gap-2'>
                  {category.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className='text-foreground/80 hover:text-foreground focus-visible:ring-ring/25 rounded-sm text-[13px] transition-colors outline-none focus-visible:ring-[3px]'
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
        <div className='flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between'>
          <p className='text-muted-foreground text-xs'>{BRAND.copyright}</p>
          <ul className='-ms-2 flex items-center gap-1 sm:ms-0'>
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
      </div>
    </footer>
  );
}
