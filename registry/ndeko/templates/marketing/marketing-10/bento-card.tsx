import { cn } from '@/registry/ndeko/lib/utils';

type BentoCardProps = {
  title: string;
  className?: string;
  children: React.ReactNode;
};

export function BentoCard({ title, className, children }: BentoCardProps) {
  return (
    <article
      className={cn(
        'bg-card hairline-ring ring-border flex min-w-0 flex-col gap-5 rounded-2xl p-5 shadow-[0_1px_2px_rgb(0_0_0/0.04)] sm:p-6',
        className
      )}
    >
      <h3 className='text-muted-foreground text-xs font-medium'>{title}</h3>
      {children}
    </article>
  );
}
