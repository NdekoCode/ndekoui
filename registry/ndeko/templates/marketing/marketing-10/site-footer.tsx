import { Button } from '@/registry/ndeko/ui/button';

import { FOOTER, PERSON, SOCIAL_LINKS } from './data';

export function SiteFooter() {
  return (
    <footer className='relative overflow-hidden px-4 pt-12 sm:px-6 lg:px-8'>
      <div className='mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <p className='text-muted-foreground max-w-md text-xs text-pretty'>
          {FOOTER.copyright}. {FOOTER.note}
        </p>
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
      <p
        aria-hidden='true'
        className='mx-auto mt-8 -mb-[0.2em] max-w-6xl text-center text-[clamp(4.5rem,24vw,19rem)] leading-none font-semibold opacity-[0.07] select-none'
      >
        {PERSON.handle}
      </p>
    </footer>
  );
}
