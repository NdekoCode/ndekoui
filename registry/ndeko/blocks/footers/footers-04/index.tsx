import { QuillmintMark } from './brand-mark';
import { CopyEmail } from './copy-email';
import { BRAND } from './data';
import { LanguageSelect } from './language-select';
import { Sitemap } from './sitemap';

export default function Footers04() {
  return (
    <footer className='px-4 pt-14 pb-8 sm:px-6 sm:pt-16 lg:px-8'>
      <div className='mx-auto flex max-w-6xl flex-col gap-10 sm:gap-14'>
        <div className='grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,2.4fr)] lg:gap-16'>
          <div className='flex flex-col items-start gap-6'>
            <div className='flex flex-col gap-3'>
              <a
                href='#'
                className='focus-visible:ring-ring/25 flex items-center gap-2 self-start rounded-md text-sm font-semibold outline-none focus-visible:ring-[3px]'
              >
                <QuillmintMark />
                {BRAND.name}
              </a>
              <p className='text-muted-foreground max-w-xs text-[13px] text-pretty'>
                {BRAND.tagline}
              </p>
            </div>
            <div className='flex flex-col gap-1'>
              <p className='text-muted-foreground text-xs font-medium'>
                {BRAND.contactLabel}
              </p>
              <CopyEmail email={BRAND.email} />
            </div>
          </div>
          <Sitemap />
        </div>
        <div className='flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between'>
          <p className='text-muted-foreground text-xs'>{BRAND.copyright}</p>
          <LanguageSelect />
        </div>
      </div>
    </footer>
  );
}
