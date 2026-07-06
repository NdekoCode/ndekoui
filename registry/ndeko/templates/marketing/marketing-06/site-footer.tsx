import { FOCUS_RING } from '@/registry/ndeko/lib/recipes';
import { cn } from '@/registry/ndeko/lib/utils';
import { CompanyMark } from '@/registry/ndeko/ui/company-mark';
import { CopyButton } from '@/registry/ndeko/ui/copy-button';

import { BRAND, FOOTER_COLUMNS } from './data';

const LINK =
  'text-foreground/80 hover:text-foreground rounded-sm text-[13px] transition-colors';

export function SiteFooter() {
  return (
    <footer className='@container'>
      <div className='mx-auto flex max-w-6xl flex-col gap-10 px-4 pt-14 pb-8 @2xl:gap-14 @2xl:px-6 @2xl:pt-16 @5xl:px-8'>
        <div className='grid gap-8 @3xl:grid-cols-[minmax(0,1fr)_minmax(0,2.4fr)] @3xl:gap-16'>
          <div className='flex flex-col items-start gap-6'>
            <div className='flex flex-col gap-3'>
              <a
                href='#'
                className={cn(
                  'flex items-center gap-2 self-start rounded-md text-sm font-semibold',
                  FOCUS_RING
                )}
              >
                <CompanyMark seed={BRAND.name} size='lg' />
                {BRAND.name}
              </a>
              <p className='text-muted-foreground max-w-xs text-[13px] text-pretty'>
                {BRAND.tagline}
              </p>
            </div>
            <div className='flex flex-col gap-1'>
              <p className='text-muted-foreground text-xs font-medium'>
                Support
              </p>
              <div className='flex items-center gap-1'>
                <a
                  href={`mailto:${BRAND.email}`}
                  className={cn(
                    'text-primary-ink rounded-sm text-[13px] font-medium underline-offset-4 hover:underline',
                    FOCUS_RING
                  )}
                >
                  {BRAND.email}
                </a>
                <CopyButton
                  text={BRAND.email}
                  label='Copy the support address'
                />
              </div>
            </div>
          </div>
          <nav aria-label='Footer'>
            <div className='grid grid-cols-2 gap-x-6 gap-y-10 @2xl:grid-cols-4'>
              {FOOTER_COLUMNS.map((column) => (
                <div key={column.title} className='flex flex-col gap-3'>
                  <h2 className='text-muted-foreground text-xs font-medium'>
                    {column.title}
                  </h2>
                  <ul className='flex flex-col gap-2'>
                    {column.links.map((link) => (
                      <li key={link.label}>
                        <a href={link.href} className={cn(LINK, FOCUS_RING)}>
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </nav>
        </div>
        <div className='flex flex-col gap-1 @2xl:flex-row @2xl:items-center @2xl:justify-between'>
          <p className='text-muted-foreground text-xs'>{BRAND.copyright}</p>
          <p className='text-muted-foreground text-xs text-pretty'>
            An example product: every name, figure and price on this page is
            invented.
          </p>
        </div>
      </div>
    </footer>
  );
}
