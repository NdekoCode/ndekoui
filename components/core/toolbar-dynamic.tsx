'use client';
import React, { useRef, useState } from 'react';
import { motion, MotionConfig, useReducedMotion } from 'motion/react';
import useClickOutside from '@/hooks/useClickOutside';
import {
  ArrowLeftIcon,
  SearchIcon,
  UserIcon,
} from '@/registry/ndeko/lib/icons';

const transition = {
  type: 'spring' as const,
  bounce: 0.1,
  duration: 0.2,
};

const OPEN_WIDTH = '300px';

const CLOSED_WIDTH = '98px';

function ReducedMotionConfig({ children }: { children: React.ReactNode }) {
  const prefersReducedMotion = useReducedMotion();
  if (!prefersReducedMotion) {
    return children;
  }
  return <MotionConfig reducedMotion='always'>{children}</MotionConfig>;
}

function toolbarWidthOf(isOpen: boolean) {
  if (isOpen) {
    return OPEN_WIDTH;
  }
  return CLOSED_WIDTH;
}

function Button({
  children,
  onClick,
  disabled,
  ariaLabel,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  ariaLabel?: string;
}) {
  return (
    <button
      className='text-muted-foreground hover:bg-foreground/5 hover:text-foreground focus-visible:ring-ring relative flex h-9 w-9 shrink-0 scale-100 appearance-none items-center justify-center rounded-lg transition-[color,background-color,scale] duration-150 ease-(--ease-out-strong) select-none focus-visible:ring-2 focus-visible:outline-hidden active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50'
      type='button'
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
}

export default function ToolbarDynamic() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useClickOutside(containerRef, () => {
    setIsOpen(false);
  });

  return (
    <ReducedMotionConfig>
      <MotionConfig transition={transition}>
        <div className='absolute bottom-8' ref={containerRef}>
          <div className='bg-card hairline-ring ring-border h-full w-full rounded-xl shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
            <motion.div
              animate={{
                width: toolbarWidthOf(isOpen),
              }}
              initial={false}
            >
              <div className='overflow-hidden p-2'>
                {!isOpen && (
                  <div className='flex space-x-2'>
                    <Button disabled ariaLabel='User profile'>
                      <UserIcon className='size-5' />
                    </Button>
                    <Button
                      onClick={() => setIsOpen(true)}
                      ariaLabel='Search notes'
                    >
                      <SearchIcon className='size-5' />
                    </Button>
                  </div>
                )}
                {isOpen && (
                  <div className='flex space-x-2'>
                    <Button onClick={() => setIsOpen(false)} ariaLabel='Back'>
                      <ArrowLeftIcon className='size-5' />
                    </Button>
                    <div className='relative w-full'>
                      <input
                        className='hairline-ring ring-border text-foreground placeholder:text-muted-foreground focus-visible:ring-ring/25 h-9 w-full rounded-lg bg-transparent p-2 text-base focus:outline-hidden focus-visible:ring-[3px] md:text-[13px]'
                        autoFocus
                        aria-label='Search notes'
                        placeholder='Search notes'
                      />
                      <div className='absolute top-0 right-1 flex h-full items-center justify-center'></div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </MotionConfig>
    </ReducedMotionConfig>
  );
}
