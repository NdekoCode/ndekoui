'use client';

import { MenuIcon } from '@/registry/ndeko/lib/icons';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Button } from '@/registry/ndeko/ui/button';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';

type PageHeaderProps = {
  canReplay: boolean;
  onReplay: () => void;
  onOpenMenu: () => void;
};

export function PageHeader({
  canReplay,
  onReplay,
  onOpenMenu,
}: PageHeaderProps) {
  return (
    <header className='flex h-12 shrink-0 items-center gap-2 px-3'>
      <Button
        type='button'
        variant='ghost'
        size='icon-sm'
        data-menu-open
        aria-label='Open the sections'
        aria-haspopup='dialog'
        onClick={onOpenMenu}
        className='text-muted-foreground @3xl:hidden'
      >
        <MenuIcon />
      </Button>
      <h1 className='ps-1 text-sm font-medium'>Overview</h1>
      <Badge variant='secondary'>Illustrative data</Badge>
      <span className='ms-auto'>
        <ReplayButton isShown={canReplay} onReplay={onReplay} label='Replay' />
      </span>
    </header>
  );
}
