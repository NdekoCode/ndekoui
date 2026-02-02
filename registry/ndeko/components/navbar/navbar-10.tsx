import { LogoLink } from '@/registry/ndeko/components/navbar/_parts/logo';
import { SearchField } from '@/registry/ndeko/components/navbar/_parts/search-field';
import { ThemeToggle } from '@/registry/ndeko/components/navbar/_parts/theme-toggle';
import { MicIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';

export default function Navbar10() {
  return (
    <header className='hairline-b border-border px-4 md:px-6'>
      <div className='flex h-16 items-center justify-between gap-4'>
        <div className='flex-1'>
          <LogoLink className='w-fit' />
        </div>
        <div className='grow max-sm:hidden'>
          <SearchField
            containerClassName='mx-auto w-full max-w-xs'
            end={
              <Button
                variant='ghost'
                size='icon-sm'
                aria-label='Search by voice'
                className='text-muted-foreground'
              >
                <MicIcon />
              </Button>
            }
          />
        </div>
        <div className='flex flex-1 items-center justify-end gap-2'>
          <Button variant='ghost' nativeButton={false} render={<a href='#' />}>
            Community
          </Button>
          <Button nativeButton={false} render={<a href='#' />}>
            Get started
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
