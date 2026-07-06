import type { Icon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';

type SectionFrameProps = {
  id?: string;
  ref?: React.Ref<HTMLElement>;
  className?: string;
  onPointerDownCapture?: React.PointerEventHandler<HTMLElement>;
  onKeyDownCapture?: React.KeyboardEventHandler<HTMLElement>;
  onFocusCapture?: React.FocusEventHandler<HTMLElement>;
  children: React.ReactNode;
};

/** One rhythm for every section of the page: the same width, the same padding, the same gap under the heading. */
export function SectionFrame({
  id,
  ref,
  className,
  onPointerDownCapture,
  onKeyDownCapture,
  onFocusCapture,
  children,
}: SectionFrameProps) {
  return (
    <section
      id={id}
      ref={ref}
      onPointerDownCapture={onPointerDownCapture}
      onKeyDownCapture={onKeyDownCapture}
      onFocusCapture={onFocusCapture}
      className='@container'
    >
      <div
        className={cn(
          'mx-auto flex max-w-6xl flex-col gap-10 px-4 py-16 @2xl:px-6 @2xl:py-24 @5xl:px-8',
          className
        )}
      >
        {children}
      </div>
    </section>
  );
}

type SectionHeaderProps = {
  icon: Icon;
  label: string;
  title: string;
  lead: string;
  children?: React.ReactNode;
};

/** One type scale for every section: a quiet label, a title, a lead, and what sits beside them. */
export function SectionHeader({
  icon: LabelIcon,
  label,
  title,
  lead,
  children,
}: SectionHeaderProps) {
  return (
    <header className='flex flex-wrap items-end justify-between gap-x-6 gap-y-4'>
      <div className='flex max-w-2xl flex-col gap-3'>
        <p className='text-primary-ink flex items-center gap-1.5 text-[13px] font-medium'>
          <LabelIcon className='size-4' />
          {label}
        </p>
        <h2 className='text-2xl font-semibold text-balance @2xl:text-3xl'>
          {title}
        </h2>
        <p className='text-muted-foreground text-base text-pretty'>{lead}</p>
      </div>
      {children && (
        <div className='flex flex-wrap items-center gap-2'>{children}</div>
      )}
    </header>
  );
}
