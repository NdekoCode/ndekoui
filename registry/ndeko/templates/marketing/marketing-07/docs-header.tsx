'use client';

import { pressedQuietOf } from '@/registry/ndeko/lib/demonstration';
import { MenuIcon } from '@/registry/ndeko/lib/icons';
import { FOCUS_RING } from '@/registry/ndeko/lib/recipes';
import { cn } from '@/registry/ndeko/lib/utils';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Button } from '@/registry/ndeko/ui/button';
import { CompanyMark } from '@/registry/ndeko/ui/company-mark';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';

import { PRODUCT } from './data';

type DocsHeaderProps = {
  isHome: boolean;
  pressed: string | null;
  canReplay: boolean;
  onOpenHome: () => void;
  onOpenMenu: () => void;
  onReplay: () => void;
};

function currentOf(isHome: boolean): 'page' | undefined {
  if (isHome) {
    return 'page';
  }
  return undefined;
}

export function DocsHeader({
  isHome,
  pressed,
  canReplay,
  onOpenHome,
  onOpenMenu,
  onReplay,
}: DocsHeaderProps) {
  function openHome(event: React.MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    onOpenHome();
  }

  return (
    <header className='hairline-b border-border flex h-14 shrink-0 items-center gap-3 px-4 @2xl:px-6'>
      {!isHome && (
        <Button
          type='button'
          variant='ghost'
          size='icon'
          aria-label='Open the docs menu'
          data-sheet-trigger
          onClick={onOpenMenu}
          className='text-muted-foreground -ms-1.5 @3xl:hidden'
        >
          <MenuIcon />
        </Button>
      )}
      <a
        href='#home'
        aria-current={currentOf(isHome)}
        onClick={openHome}
        className={cn(
          'flex items-center gap-2 rounded-md text-sm font-semibold',
          FOCUS_RING,
          pressedQuietOf(pressed === 'brand')
        )}
      >
        <CompanyMark seed={PRODUCT.name} size='lg' />
        {PRODUCT.name}
        <span className='text-muted-foreground font-normal'>Docs</span>
      </a>
      <Badge variant='secondary' className='tabular-nums'>
        {PRODUCT.version}
      </Badge>
      <span className='flex-1' />
      <ReplayButton isShown={canReplay} onReplay={onReplay} label='Replay' />
    </header>
  );
}
