'use client';

import React, { useRef, useState } from 'react';
import useMeasure from 'react-use-measure';
import {
  AnimatePresence,
  motion,
  MotionConfig,
  useReducedMotion,
} from 'motion/react';
import { cn } from '@/lib/utils';
import useClickOutside from '@/hooks/useClickOutside';
import {
  FolderIcon,
  MessageCircleIcon,
  UserIcon,
  WalletIcon,
} from '@/registry/ndeko/lib/icons';

const transition = {
  type: 'spring' as const,
  bounce: 0.1,
  duration: 0.25,
};

const PANEL_BUTTON =
  'bg-card text-foreground hairline-ring ring-foreground/12 hover:bg-foreground/[0.03] focus-visible:ring-ring relative h-8 w-full scale-100 appearance-none items-center justify-center rounded-full px-3.5 text-[13px] font-medium shadow-[0_1px_2px_rgb(0_0_0/0.05)] transition-[color,background-color,scale] duration-150 ease-(--ease-out-strong) select-none focus-visible:ring-2 active:scale-[0.97] dark:bg-foreground/[0.04] dark:ring-foreground/15';

const TOOL_BUTTON =
  'text-muted-foreground hover:bg-foreground/5 hover:text-foreground focus-visible:ring-ring relative flex h-9 w-9 shrink-0 scale-100 appearance-none items-center justify-center rounded-lg transition-[color,background-color,scale] duration-150 ease-(--ease-out-strong) select-none focus-visible:ring-2 focus-visible:outline-hidden active:scale-[0.97]';

function toolStateOf(isActive: boolean) {
  if (isActive) {
    return 'bg-foreground/[0.06] text-foreground';
  }
  return '';
}

function panelDisplayOf(isSelected: boolean) {
  if (isSelected) {
    return 'block';
  }
  return 'hidden';
}

function panelOpacityOf(isSelected: boolean) {
  if (isSelected) {
    return 1;
  }
  return 0;
}

function ReducedMotionConfig({ children }: { children: React.ReactNode }) {
  const prefersReducedMotion = useReducedMotion();
  if (!prefersReducedMotion) {
    return children;
  }
  return <MotionConfig reducedMotion='always'>{children}</MotionConfig>;
}

const ITEMS = [
  {
    id: 1,
    label: 'User',
    title: <UserIcon className='size-5' />,
    content: (
      <div className='flex flex-col space-y-4'>
        <div className='text-foreground flex flex-col space-y-1'>
          <div className='bg-primary/15 text-primary-ink flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium'>
            NC
          </div>
          <span>ndekocode</span>
        </div>
        <button className={PANEL_BUTTON} type='button'>
          Edit profile
        </button>
      </div>
    ),
  },
  {
    id: 2,
    label: 'Messages',
    title: <MessageCircleIcon className='size-5' />,
    content: (
      <div className='flex flex-col space-y-4'>
        <div className='text-foreground'>You have 3 new messages.</div>
        <button className={PANEL_BUTTON} type='button'>
          View more
        </button>
      </div>
    ),
  },
  {
    id: 3,
    label: 'Documents',
    title: <FolderIcon className='size-5' />,
    content: (
      <div className='flex flex-col space-y-4'>
        <div className='text-foreground flex flex-col'>
          <div className='space-y-1'>
            <div>Project_Proposal.pdf</div>
            <div>Meeting_Notes.docx</div>
            <div>Financial_Report.xls</div>
          </div>
        </div>
        <button className={PANEL_BUTTON} type='button'>
          Manage documents
        </button>
      </div>
    ),
  },
  {
    id: 4,
    label: 'Wallet',
    title: <WalletIcon className='size-5' />,
    content: (
      <div className='flex flex-col space-y-4'>
        <div className='text-foreground flex flex-col'>
          <span className='text-muted-foreground'>Current balance</span>
          <span className='tabular-nums'>$1,250.32</span>
        </div>
        <button className={PANEL_BUTTON} type='button'>
          View transactions
        </button>
      </div>
    ),
  },
];

export default function ToolbarExpandable() {
  const [active, setActive] = useState<number | null>(null);
  const [contentRef, { height: heightContent }] = useMeasure();
  const [menuRef, { width: widthContainer }] = useMeasure();
  const ref = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [maxWidth, setMaxWidth] = useState(0);

  useClickOutside(ref, () => {
    setIsOpen(false);
    setActive(null);
  });

  const isFirstMeasure = Boolean(widthContainer) && maxWidth === 0;
  if (isFirstMeasure) {
    setMaxWidth(widthContainer);
  }

  return (
    <ReducedMotionConfig>
      <MotionConfig transition={transition}>
        <div className='absolute bottom-8' ref={ref}>
          <div className='bg-card hairline-ring ring-border h-full w-full rounded-xl shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
            <div className='overflow-hidden'>
              <AnimatePresence initial={false} mode='sync'>
                {isOpen && (
                  <motion.div
                    key='content'
                    initial={{ height: 0 }}
                    animate={{ height: heightContent || 0 }}
                    exit={{ height: 0 }}
                    style={{
                      width: maxWidth,
                    }}
                  >
                    <div ref={contentRef} className='p-2'>
                      {ITEMS.map((item) => {
                        const isSelected = active === item.id;

                        return (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: panelOpacityOf(isSelected) }}
                            exit={{ opacity: 0 }}
                          >
                            <div
                              className={cn(
                                'px-2 pt-2 text-[13px]',
                                panelDisplayOf(isSelected)
                              )}
                            >
                              {item.content}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className='flex space-x-2 p-2' ref={menuRef}>
              {ITEMS.map((item) => (
                <button
                  key={item.id}
                  aria-label={item.label}
                  className={cn(TOOL_BUTTON, toolStateOf(active === item.id))}
                  type='button'
                  onClick={() => {
                    if (!isOpen) setIsOpen(true);
                    if (active === item.id) {
                      setIsOpen(false);
                      setActive(null);
                      return;
                    }

                    setActive(item.id);
                  }}
                >
                  {item.title}
                </button>
              ))}
            </div>
          </div>
        </div>
      </MotionConfig>
    </ReducedMotionConfig>
  );
}
