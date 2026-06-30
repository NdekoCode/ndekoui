import { ArrowUpRightIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';

import { TidepostMark } from './brand-mark';
import { ACTIONS, BRAND, LINKS, STATUS } from './data';

const TRAVEL = 'transition-[translate] ease-(--ease-out-strong)';

const LEAVING_ARROW =
  'duration-250 group-hover/button:translate-x-6 group-hover/button:-translate-y-6 group-hover/button:duration-200';

const ARRIVING_ARROW =
  'absolute -translate-x-6 translate-y-6 duration-200 group-hover/button:translate-x-0 group-hover/button:translate-y-0 group-hover/button:duration-250';

const QUIET_LINK =
  'text-muted-foreground hover:text-foreground focus-visible:ring-ring/25 rounded-sm text-[13px] transition-colors outline-none focus-visible:ring-[3px]';

export default function Footers05() {
  return (
    <footer className='px-4 pt-16 pb-8 sm:px-6 lg:px-8'>
      <div className='mx-auto flex max-w-6xl flex-col gap-16'>
        <div className='flex flex-col gap-6 md:flex-row md:items-end md:justify-between md:gap-12'>
          <div className='flex max-w-xl flex-col gap-3'>
            <h2 className='text-2xl font-semibold text-balance sm:text-3xl'>
              {BRAND.headline}
            </h2>
            <p className='text-muted-foreground text-sm text-pretty'>
              {BRAND.description}
            </p>
          </div>
          <div className='flex flex-wrap gap-2'>
            <Button
              size='lg'
              className='pe-1'
              nativeButton={false}
              render={<a href={ACTIONS.primary.href} />}
            >
              {ACTIONS.primary.label}
              <span
                aria-hidden='true'
                className='bg-primary-foreground/15 relative flex size-7 items-center justify-center overflow-hidden rounded-full'
              >
                <ArrowUpRightIcon className={cn(TRAVEL, LEAVING_ARROW)} />
                <ArrowUpRightIcon className={cn(TRAVEL, ARRIVING_ARROW)} />
              </span>
            </Button>
            <Button
              size='lg'
              variant='outline'
              nativeButton={false}
              render={<a href={ACTIONS.secondary.href} />}
            >
              {ACTIONS.secondary.label}
            </Button>
          </div>
        </div>
        <div className='flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between'>
          <div className='flex items-center gap-3'>
            <a
              href='#'
              className='focus-visible:ring-ring/25 flex items-center gap-2 rounded-md text-sm font-semibold outline-none focus-visible:ring-[3px]'
            >
              <TidepostMark />
              {BRAND.name}
            </a>
            <p className='text-muted-foreground text-xs'>{BRAND.copyright}</p>
          </div>
          <nav aria-label='Footer'>
            <ul className='flex flex-wrap gap-x-5 gap-y-2'>
              {LINKS.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className={QUIET_LINK}>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <a
            href={STATUS.href}
            className={cn(
              QUIET_LINK,
              'flex items-center gap-2 self-start lg:self-auto'
            )}
          >
            <span
              aria-hidden='true'
              className='bg-success size-2 rounded-full'
            />
            {STATUS.label}
          </a>
        </div>
      </div>
    </footer>
  );
}
