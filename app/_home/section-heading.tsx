import type { ComponentType, ReactNode } from 'react';

import { cn } from '@/registry/ndeko/lib/utils';

type IconComponent = ComponentType<{ className?: string }>;

type EyebrowProps = {
  icon?: IconComponent;
  children: ReactNode;
  className?: string;
};

/** The small pill that names a section, above its title. */
export function Eyebrow({ icon: Icon, children, className }: EyebrowProps) {
  return (
    <p
      className={cn(
        'bg-card text-primary-ink hairline-ring ring-border inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium tabular-nums shadow-[0_1px_2px_rgb(0_0_0/0.04)]',
        className
      )}
    >
      {Icon && <Icon className='size-3.5' />}
      {children}
    </p>
  );
}

type SectionHeadingProps = {
  id: string;
  icon?: IconComponent;
  eyebrow: string;
  lead?: string;
  title: string;
  description: string;
  align?: 'center' | 'start';
  action?: ReactNode;
};

/** A two-tone title: the lead in the brand ink, the rest in the text colour. */
export function SectionHeading({
  id,
  icon,
  eyebrow,
  lead,
  title,
  description,
  align = 'start',
  action,
}: SectionHeadingProps) {
  const isCentered = align === 'center';

  return (
    <div
      className={cn(
        'flex flex-wrap items-end justify-between gap-x-10 gap-y-6',
        isCentered && 'flex-col items-center text-center'
      )}
    >
      <div
        className={cn(
          'flex max-w-2xl flex-col gap-4',
          isCentered && 'items-center'
        )}
      >
        <Eyebrow icon={icon}>{eyebrow}</Eyebrow>
        <h2
          id={id}
          className='text-3xl font-semibold tracking-tight text-balance sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]'
        >
          {lead && <span className='text-tint'>{`${lead} `}</span>}
          {title}
        </h2>
        <p className='text-muted-foreground max-w-xl text-[15px] text-pretty sm:text-base'>
          {description}
        </p>
      </div>
      {action}
    </div>
  );
}
