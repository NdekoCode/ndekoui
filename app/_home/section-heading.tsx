import type { ComponentType, ReactNode } from 'react';

import { cn } from '@/registry/ndeko/lib/utils';

import { Reveal } from './reveal';

type IconComponent = ComponentType<{ className?: string }>;

/* The type scale of the home page. Every heading and paragraph of a section picks from these. */
export const DISPLAY_TITLE =
  'text-[2.5rem] leading-[1.05] font-semibold tracking-[-0.03em] text-balance sm:text-6xl lg:text-7xl lg:leading-[1.02]';
export const SECTION_TITLE =
  'text-3xl leading-[1.12] font-semibold tracking-[-0.02em] text-balance sm:text-4xl lg:text-5xl lg:leading-[1.06] lg:tracking-[-0.025em]';
export const SECTION_LEAD = 'text-muted-foreground text-base text-pretty';

export const STAGGER_MS = 60;

type EyebrowProps = {
  icon?: IconComponent;
  children: ReactNode;
  className?: string;
};

/** The quiet label that names a section, above its title: an icon and a few words in the brand ink. */
export function Eyebrow({ icon: Icon, children, className }: EyebrowProps) {
  return (
    <p
      className={cn(
        'text-primary-ink inline-flex w-fit items-center gap-2 text-sm font-medium tabular-nums',
        className
      )}
    >
      {Icon && <Icon className='size-4' />}
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

/** A two-tone title: the lead in the brand ink, the rest in the text colour. Its lines settle one after the other. */
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
        <Reveal>
          <Eyebrow icon={icon}>{eyebrow}</Eyebrow>
        </Reveal>
        <Reveal delay={STAGGER_MS}>
          <h2 id={id} className={SECTION_TITLE}>
            {lead && <span className='text-tint'>{`${lead} `}</span>}
            {title}
          </h2>
        </Reveal>
        <Reveal delay={STAGGER_MS * 2}>
          <p className={cn(SECTION_LEAD, 'max-w-xl')}>{description}</p>
        </Reveal>
      </div>
      {action && <Reveal delay={STAGGER_MS * 3}>{action}</Reveal>}
    </div>
  );
}
