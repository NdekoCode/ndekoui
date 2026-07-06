'use client';

import { useInView } from 'motion/react';
import { useRef } from 'react';

import { Settle } from '@/registry/ndeko/ui/settle';

const ENTERED_ONCE = { once: true, margin: '0px 0px -12% 0px' } as const;

type RevealProps = {
  className?: string;
  groupClassName?: string;
  children: React.ReactNode;
};

export function Reveal({ className, groupClassName, children }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, ENTERED_ONCE);

  return (
    <div ref={ref} className={className}>
      <Settle isShown={isInView} className={groupClassName}>
        {children}
      </Settle>
    </div>
  );
}
