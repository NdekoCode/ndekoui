'use client';

import { useState } from 'react';

import { PlusIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';

function menuLabelOf(isOpen: boolean) {
  if (isOpen) {
    return 'Close menu';
  }
  return 'Open menu';
}

export default function Button21() {
  const [isOpen, setIsOpen] = useState(false);

  function toggleMenu() {
    setIsOpen((current) => !current);
  }

  return (
    <Button
      variant='outline'
      size='icon'
      onClick={toggleMenu}
      aria-expanded={isOpen}
      aria-label={menuLabelOf(isOpen)}
    >
      <PlusIcon className='transition-[rotate] duration-200 ease-(--ease-out-strong) group-aria-expanded/button:rotate-135' />
    </Button>
  );
}
