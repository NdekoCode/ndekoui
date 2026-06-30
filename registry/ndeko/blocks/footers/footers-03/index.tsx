import { BackToTop } from './back-to-top';
import { FernwickMark } from './brand-mark';
import { BRAND, CATEGORIES, LEGAL_LINKS } from './data';

const LINK =
  'text-foreground/80 hover:text-foreground focus-visible:ring-ring/25 rounded-sm text-[13px] transition-colors outline-none focus-visible:ring-[3px]';

export default function Footers03() {
  return (
    <footer className='overflow-hidden px-4 pt-16 sm:px-6 lg:px-8'>
      <div className='@container mx-auto flex max-w-6xl flex-col'>
        <div className='grid gap-12 md:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] md:gap-16'>
          <div className='flex flex-col items-start gap-4'>
            <a
              href='#'
              className='focus-visible:ring-ring/25 flex items-center gap-2 rounded-md text-sm font-semibold outline-none focus-visible:ring-[3px]'
            >
              <FernwickMark />
              {BRAND.name}
            </a>
            <p className='text-muted-foreground max-w-xs text-[13px] text-pretty'>
              {BRAND.tagline}
            </p>
            <a
              href={`mailto:${BRAND.email}`}
              className='text-primary-ink focus-visible:ring-ring/25 rounded-sm text-[13px] font-medium underline-offset-4 outline-none hover:underline focus-visible:ring-[3px]'
            >
              {BRAND.email}
            </a>
          </div>
          <nav
            aria-label='Footer'
            className='grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3'
          >
            {CATEGORIES.map((category) => (
              <div key={category.title} className='flex flex-col gap-3'>
                <h2 className='text-muted-foreground text-xs font-medium'>
                  {category.title}
                </h2>
                <ul className='flex flex-col gap-2'>
                  {category.links.map((link) => (
                    <li key={link.label}>
                      <a href={link.href} className={LINK}>
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
        <div className='mt-14 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
          <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6'>
            <p className='text-muted-foreground text-xs'>{BRAND.copyright}</p>
            <ul className='flex flex-wrap gap-x-5 gap-y-2'>
              {LEGAL_LINKS.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className='text-muted-foreground hover:text-foreground focus-visible:ring-ring/25 rounded-sm text-xs transition-colors outline-none focus-visible:ring-[3px]'
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className='-ms-2.5 sm:ms-0 sm:-me-2.5'>
            <BackToTop />
          </div>
        </div>
        <p
          aria-hidden='true'
          className='text-foreground/[0.07] pointer-events-none mt-6 -mb-[0.2em] text-center text-[length:20cqw] leading-none font-semibold whitespace-nowrap select-none'
        >
          {BRAND.wordmark}
        </p>
      </div>
    </footer>
  );
}
