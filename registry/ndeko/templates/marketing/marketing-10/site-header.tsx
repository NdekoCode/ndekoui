import { Avatar } from '@/registry/ndeko/ui/avatar';
import { Button } from '@/registry/ndeko/ui/button';

import { CONTACT_ANCHOR, NAV_LINKS, PERSON } from './data';

export function SiteHeader() {
  return (
    <header className='px-4 pt-4 sm:px-6 lg:px-8'>
      <div className='mx-auto flex h-14 max-w-6xl items-center gap-4'>
        <a
          href='#'
          className='focus-visible:ring-ring/25 flex items-center gap-2.5 rounded-md text-sm font-semibold outline-none focus-visible:ring-[3px]'
        >
          <Avatar
            className='size-7'
            seed={PERSON.name}
            role='img'
            aria-label={PERSON.name}
          />
          {PERSON.name}
        </a>
        <nav aria-label='Main' className='ms-auto hidden md:block'>
          <ul className='flex items-center gap-1'>
            {NAV_LINKS.map((link) => (
              <li key={link.id}>
                <Button
                  variant='ghost'
                  nativeButton={false}
                  render={<a href={link.href} />}
                >
                  {link.label}
                </Button>
              </li>
            ))}
          </ul>
        </nav>
        <Button
          variant='outline'
          className='ms-auto md:ms-0'
          nativeButton={false}
          render={<a href={`#${CONTACT_ANCHOR}`} />}
        >
          Say hello
        </Button>
      </div>
    </header>
  );
}
