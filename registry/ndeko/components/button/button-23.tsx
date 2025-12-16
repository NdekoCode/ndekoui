'use client';

import { useState } from 'react';

import { Button } from '@/registry/ndeko/ui/button';

function menuLabelOf(isOpen: boolean) {
  if (isOpen) {
    return 'Close menu';
  }
  return 'Open menu';
}

export default function Button23() {
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
      <svg
        width={16}
        height={16}
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth='1.75'
        strokeLinecap='round'
        strokeLinejoin='round'
        aria-hidden='true'
      >
        <path
          d='M4 12L20 12'
          className='origin-center -translate-y-[7px] transition-[translate,rotate] duration-300 ease-(--ease-out-strong) group-aria-expanded/button:translate-x-0 group-aria-expanded/button:translate-y-0 group-aria-expanded/button:rotate-[315deg]'
        />
        <path
          d='M4 12H20'
          className='origin-center transition-[rotate] duration-300 ease-(--ease-out-strong) group-aria-expanded/button:rotate-45'
        />
        <path
          d='M4 12H20'
          className='origin-center translate-y-[7px] transition-[translate,rotate] duration-300 ease-(--ease-out-strong) group-aria-expanded/button:translate-y-0 group-aria-expanded/button:rotate-[135deg]'
        />
      </svg>
    </Button>
  );
}
