import { PinemarshMark } from './brand-mark';
import { BRAND, FOOTER_LINKS } from './data';

export function SiteFooter() {
  return (
    <footer className='px-4 py-8 @sm:px-6 @5xl:px-8'>
      <div className='mx-auto flex max-w-6xl flex-col items-center gap-6 @3xl:flex-row @3xl:justify-between @3xl:gap-8'>
        <div className='flex items-center gap-3'>
          <a
            href='#'
            className='focus-visible:ring-ring/25 flex items-center gap-2 rounded-md text-sm font-semibold outline-none focus-visible:ring-[3px]'
          >
            <PinemarshMark />
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
                  className='text-muted-foreground hover:text-foreground focus-visible:ring-ring/25 rounded-sm text-[13px] transition-colors outline-none focus-visible:ring-[3px]'
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
