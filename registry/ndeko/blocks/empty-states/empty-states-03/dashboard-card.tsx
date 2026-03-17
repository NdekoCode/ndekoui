import { cn } from '@/registry/ndeko/lib/utils';

type DashboardCardProps = {
  title: string;
  meta: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export function DashboardCard({
  title,
  meta,
  action,
  children,
  className,
}: DashboardCardProps) {
  return (
    <section
      aria-label={title}
      className={cn(
        'bg-card hairline-ring ring-border flex flex-col rounded-xl p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)]',
        className
      )}
    >
      <div className='flex min-h-7 items-center justify-between gap-2'>
        <div className='flex min-w-0 items-baseline gap-2'>
          <h2 className='truncate text-[13px] font-medium'>{title}</h2>
          <span className='text-muted-foreground shrink-0 text-xs'>{meta}</span>
        </div>
        {action}
      </div>
      <div className='mt-3'>{children}</div>
    </section>
  );
}
